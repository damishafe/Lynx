import bcrypt from "bcryptjs";
import { ObjectId, type Collection } from "mongodb";

import { getDb } from "./mongodb";
import {
  OTP_TTL_MS,
  RESET_TTL_MS,
  generateOtp,
  generateResetToken,
  hashSecret,
  safeEqual,
} from "./otp";

export type SubscriptionStatus = "free" | "pro";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  emailVerified: boolean;

  // Email-verification OTP
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts?: number;

  // Password reset
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;

  // Subscription (Stripe Checkout, no webhook — verified on success redirect)
  subscriptionStatus?: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionCurrentPeriodEnd?: Date;

  createdAt: Date;
  lastLoginAt?: Date;
};

const COLLECTION = "users";
let indexEnsured = false;

async function getCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  const c = db.collection<UserDoc>(COLLECTION);
  if (!indexEnsured) {
    await c.createIndex({ email: 1 }, { unique: true });
    indexEnsured = true;
  }
  return c;
}

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  const c = await getCollection();
  return c.findOne({ email: email.toLowerCase() });
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const c = await getCollection();
  return c.findOne({ _id: new ObjectId(id) });
}

export async function createUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<UserDoc> {
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const doc: Omit<UserDoc, "_id"> = {
    email: email.toLowerCase(),
    passwordHash,
    name,
    emailVerified: false,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as UserDoc);
  return { ...doc, _id: result.insertedId } as UserDoc;
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function recordLogin(userId: ObjectId): Promise<void> {
  const c = await getCollection();
  await c.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}

export async function updateUserName(
  userId: ObjectId,
  name: string,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: userId },
    { $set: { name: name.trim() } },
  );
  return result.matchedCount === 1;
}

export async function updateUserPassword(
  userId: ObjectId,
  newPlain: string,
): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPlain, 12);
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: userId },
    {
      $set: { passwordHash },
      // Any in-flight reset link is invalidated when the password changes.
      $unset: { resetTokenHash: "", resetTokenExpiresAt: "" },
    },
  );
  return result.matchedCount === 1;
}

/** Promote the user to Lynx Pro after a successful Stripe Checkout. */
export async function setUserPro(
  userId: ObjectId,
  details: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    currentPeriodEnd?: Date;
  },
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: userId },
    {
      $set: {
        subscriptionStatus: "pro",
        stripeCustomerId: details.stripeCustomerId,
        stripeSubscriptionId: details.stripeSubscriptionId,
        ...(details.currentPeriodEnd && {
          subscriptionCurrentPeriodEnd: details.currentPeriodEnd,
        }),
      },
    },
  );
  return result.matchedCount === 1;
}

/**
 * Hard-delete a user and every owned document. GDPR-aligned data wipe — the
 * caller is responsible for confirming with the user first.
 */
export async function deleteUserCascade(userId: ObjectId): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.collection("units").deleteMany({ ownerId: userId }),
    db.collection("vendors").deleteMany({ ownerId: userId }),
    db.collection("work_orders").deleteMany({ ownerId: userId }),
    db.collection("payouts").deleteMany({ ownerId: userId }),
    db.collection("activity_events").deleteMany({ ownerId: userId }),
  ]);
  await db.collection("users").deleteOne({ _id: userId });
}

// ---------- Email verification (OTP) ----------

/**
 * Issue a fresh OTP for the given user and store its hash on the doc.
 * Returns the *plaintext* code so the caller can email it.
 */
export async function issueOtp(userId: ObjectId): Promise<string> {
  const code = generateOtp();
  const c = await getCollection();
  await c.updateOne(
    { _id: userId },
    {
      $set: {
        otpHash: hashSecret(code),
        otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        otpAttempts: 0,
      },
    },
  );
  return code;
}

export type OtpVerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing" | "expired" | "exhausted" | "mismatch";
    };

export async function verifyOtp(
  userId: ObjectId,
  code: string,
): Promise<OtpVerifyResult> {
  const c = await getCollection();
  const user = await c.findOne({ _id: userId });
  if (!user || !user.otpHash || !user.otpExpiresAt) {
    return { ok: false, reason: "missing" };
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if ((user.otpAttempts ?? 0) >= 5) {
    return { ok: false, reason: "exhausted" };
  }
  if (!safeEqual(hashSecret(code), user.otpHash)) {
    await c.updateOne({ _id: userId }, { $inc: { otpAttempts: 1 } });
    return { ok: false, reason: "mismatch" };
  }
  await c.updateOne(
    { _id: userId },
    {
      $set: { emailVerified: true },
      $unset: {
        otpHash: "",
        otpExpiresAt: "",
        otpAttempts: "",
      },
    },
  );
  return { ok: true };
}

// ---------- Password reset ----------

/**
 * Issue a password-reset token for the given email. Returns null silently
 * if no user exists (callers should never reveal that fact externally).
 */
export async function issueResetToken(
  email: string,
): Promise<{ token: string; user: UserDoc } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const token = generateResetToken();
  const c = await getCollection();
  await c.updateOne(
    { _id: user._id },
    {
      $set: {
        resetTokenHash: hashSecret(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    },
  );
  return { token, user };
}

export type ResetResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" };

export async function consumeResetToken(
  token: string,
  newPassword: string,
): Promise<ResetResult> {
  const tokenHash = hashSecret(token);
  const c = await getCollection();
  const user = await c.findOne({ resetTokenHash: tokenHash });
  if (!user) return { ok: false, reason: "invalid" };
  if (
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt.getTime() < Date.now()
  ) {
    return { ok: false, reason: "expired" };
  }
  const newHash = await bcrypt.hash(newPassword, 12);
  await c.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash: newHash },
      $unset: { resetTokenHash: "", resetTokenExpiresAt: "" },
    },
  );
  return { ok: true };
}

// ---------- Errors ----------

export class EmailTakenError extends Error {
  constructor() {
    super("EMAIL_TAKEN");
    this.name = "EmailTakenError";
  }
}

const MONGO_DUP_KEY = 11000;

export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === MONGO_DUP_KEY
  );
}

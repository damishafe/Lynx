import { cookies } from "next/headers";

const SESSION_COOKIE = "lynx_session";
const PENDING_COOKIE = "lynx_pending_verify";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const PENDING_TTL = 60 * 30; // 30 minutes — long enough to find the email

const isProd = process.env.NODE_ENV === "production";

const cookieDefaults = {
  httpOnly: true as const,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
};

export type PendingVerify = {
  userId: string;
  email: string;
};

// ---------- Logged-in session ----------

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string"
    ) {
      return null;
    }
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(user), {
    ...cookieDefaults,
    maxAge: SESSION_TTL,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ---------- Pending email verification ----------
// A short-lived cookie set after signup or after a login attempt by an
// unverified user. The /verify page reads it to know whose code to check.

export async function setPendingVerify(p: PendingVerify) {
  const store = await cookies();
  store.set(PENDING_COOKIE, JSON.stringify(p), {
    ...cookieDefaults,
    maxAge: PENDING_TTL,
  });
}

export async function getPendingVerify(): Promise<PendingVerify | null> {
  const store = await cookies();
  const raw = store.get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingVerify>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }
    return parsed as PendingVerify;
  } catch {
    return null;
  }
}

export async function clearPendingVerify() {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}

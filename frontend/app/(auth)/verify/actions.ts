"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

import {
  clearPendingVerify,
  getPendingVerify,
  setPendingVerify,
  setSession,
} from "@/lib/auth";
import { getUserById, issueOtp, verifyOtp } from "@/lib/users";
import { sendOtpEmail, sendWelcomeEmail } from "@/lib/email";

export type VerifyState = { error?: string };
export type ResendState = { ok?: boolean; error?: string };

export async function verify(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter the 6-digit code from your email." };
  }

  const pending = await getPendingVerify();
  if (!pending) {
    return {
      error:
        "Your verification link expired. Sign up again or log in to get a new code.",
    };
  }
  if (!ObjectId.isValid(pending.userId)) {
    return { error: "Something looks off. Try signing up again." };
  }

  const user = await getUserById(pending.userId);
  if (!user) {
    return { error: "We couldn't find your account. Try signing up again." };
  }

  const result = await verifyOtp(new ObjectId(pending.userId), code);
  if (!result.ok) {
    switch (result.reason) {
      case "expired":
        return {
          error:
            "That code expired. Tap 'Resend code' to get a fresh one in your inbox.",
        };
      case "exhausted":
        return {
          error:
            "Too many wrong attempts. Tap 'Resend code' to start over with a new one.",
        };
      case "missing":
        return {
          error:
            "No verification is pending for this account. Tap 'Resend code'.",
        };
      case "mismatch":
      default:
        return { error: "That code didn't match. Double-check and try again." };
    }
  }

  // Verified! Real signups land on a clean account — the seeded demo
  // experience lives behind the dedicated /demo path. Send the welcome
  // email (fire-and-forget) and start the session.
  void sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) => {
    console.error("[verify] sendWelcomeEmail failed:", err);
  });

  await setSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });
  await clearPendingVerify();
  redirect("/dashboard");
}

export async function resendOtp(): Promise<ResendState> {
  const pending = await getPendingVerify();
  if (!pending || !ObjectId.isValid(pending.userId)) {
    return {
      error: "Your verification link expired. Sign up or log in again.",
    };
  }
  const user = await getUserById(pending.userId);
  if (!user) {
    return { error: "We couldn't find your account. Sign up again." };
  }
  if (user.emailVerified) {
    // Already verified — push them to login.
    return {
      error: "This account is already verified. Log in to continue.",
    };
  }
  try {
    const code = await issueOtp(user._id);
    await sendOtpEmail({ to: user.email, name: user.name, code });
  } catch (err) {
    console.error("[resendOtp] failed:", err);
    return { error: "We couldn't resend the code. Please try again." };
  }
  // Refresh the pending cookie's TTL.
  await setPendingVerify({ userId: user._id.toString(), email: user.email });
  return { ok: true };
}

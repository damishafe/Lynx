"use server";

import { redirect } from "next/navigation";

import { setPendingVerify, setSession } from "@/lib/auth";
import {
  getUserByEmail,
  issueOtp,
  recordLogin,
  verifyPassword,
} from "@/lib/users";
import { sendOtpEmail } from "@/lib/email";

export type LoginState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same message for missing user and bad password — prevents email enumeration.
const INVALID_CREDS = "Email or password is incorrect.";

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are both required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  let user;
  try {
    user = await getUserByEmail(email);
  } catch (err) {
    console.error("[login] getUserByEmail failed:", err);
    return {
      error:
        "We couldn't reach our servers right now. Please try again in a moment.",
    };
  }
  if (!user) return { error: INVALID_CREDS };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: INVALID_CREDS };

  // If their email isn't verified yet, send a fresh OTP and bounce them
  // into the verify flow instead of letting them into the dashboard.
  if (!user.emailVerified) {
    try {
      const code = await issueOtp(user._id);
      await sendOtpEmail({ to: user.email, name: user.name, code });
    } catch (err) {
      console.error("[login] resend OTP failed:", err);
      return {
        error:
          "Your email isn't verified yet, and we couldn't resend the code. Please try again.",
      };
    }
    await setPendingVerify({ userId: user._id.toString(), email: user.email });
    redirect("/verify");
  }

  void recordLogin(user._id).catch((err) => {
    console.error("[login] recordLogin failed:", err);
  });

  await setSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });
  redirect("/dashboard");
}

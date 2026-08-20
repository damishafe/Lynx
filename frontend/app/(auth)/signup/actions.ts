"use server";

import { redirect } from "next/navigation";

import { setPendingVerify } from "@/lib/auth";
import {
  createUser,
  getUserByEmail,
  isDuplicateKeyError,
  issueOtp,
} from "@/lib/users";
import { sendOtpEmail } from "@/lib/email";

export type SignupState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function deriveName(email: string): string {
  return (
    email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .trim() || "there"
  );
}

export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !password || !confirm) {
    return { error: "Please fill in every field." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  let existing;
  try {
    existing = await getUserByEmail(email);
  } catch (err) {
    console.error("[signup] getUserByEmail failed:", err);
    return {
      error:
        "We couldn't reach our servers right now. Please try again in a moment.",
    };
  }
  if (existing) {
    return {
      error:
        "An account with this email already exists. Try logging in instead.",
    };
  }

  const name = deriveName(email);

  let userId: string;
  try {
    const user = await createUser({ email, password, name });
    userId = user._id.toString();
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return {
        error:
          "An account with this email already exists. Try logging in instead.",
      };
    }
    console.error("[signup] createUser failed:", err);
    return {
      error: "We couldn't create your account right now. Please try again.",
    };
  }

  // Issue OTP and email it. If the email send fails, surface a recoverable
  // error so the user can retry — the account exists but is unverified.
  try {
    const code = await issueOtp(
      (await getUserByEmail(email))!._id,
    );
    await sendOtpEmail({ to: email, name, code });
  } catch (err) {
    console.error("[signup] OTP issue/send failed:", err);
    return {
      error:
        "We created your account but couldn't send the verification email. Try logging in to receive a new code.",
    };
  }

  await setPendingVerify({ userId, email });
  redirect("/verify");
}

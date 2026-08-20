"use server";

import { redirect } from "next/navigation";
import { consumeResetToken } from "@/lib/users";

export type ResetState = { error?: string };

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) {
    return { error: "This reset link is missing its token. Request a new one." };
  }
  if (!password || !confirm) {
    return { error: "Please fill in both fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  let result;
  try {
    result = await consumeResetToken(token, password);
  } catch (err) {
    console.error("[reset-password] consumeResetToken failed:", err);
    return {
      error:
        "We couldn't reset your password right now. Please try again in a moment.",
    };
  }
  if (!result.ok) {
    if (result.reason === "expired") {
      return {
        error: "This reset link has expired. Request a new one to continue.",
      };
    }
    return {
      error:
        "This reset link is invalid or has already been used. Request a new one.",
    };
  }

  redirect("/login?reset=ok");
}

"use server";

import { issueResetToken } from "@/lib/users";
import { sendPasswordResetEmail } from "@/lib/email";

export type ForgotState = { ok?: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const result = await issueResetToken(email);
    if (result) {
      await sendPasswordResetEmail({
        to: result.user.email,
        name: result.user.name,
        token: result.token,
      });
    }
    // Always return ok — never disclose whether the email exists.
    return { ok: true };
  } catch (err) {
    console.error("[forgot-password] failed:", err);
    return {
      error:
        "We couldn't send the reset link right now. Please try again in a moment.",
    };
  }
}

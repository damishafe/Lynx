import { createHash, randomInt, randomBytes, timingSafeEqual } from "node:crypto";

/** TTL for the email-verification OTP, in milliseconds. */
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
/** TTL for the password-reset token, in milliseconds. */
export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
/** Max wrong code submissions before user must request a new OTP. */
export const OTP_MAX_ATTEMPTS = 5;

/** Generate a 6-digit numeric OTP (zero-padded). */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** SHA-256 of the input — fast and adequate for short-lived single-use secrets. */
export function hashSecret(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

/** Constant-time hex-string comparison. Returns false on length mismatch. */
export function safeEqual(aHex: string, bHex: string): boolean {
  if (aHex.length !== bHex.length) return false;
  try {
    return timingSafeEqual(Buffer.from(aHex, "hex"), Buffer.from(bHex, "hex"));
  } catch {
    return false;
  }
}

/** Generate a URL-safe random token for password reset (32 bytes / 64 hex chars). */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

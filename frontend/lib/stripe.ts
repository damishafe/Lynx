import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy Stripe client. Reading env at module load would crash the build on
 * environments that don't ship the secret (e.g., a fresh Vercel preview).
 * Callers hit `getStripe()` only when they actually need to talk to Stripe,
 * and a missing secret surfaces as a friendly error inside the action.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (test-mode key starts with sk_test_).",
    );
  }
  // Default to the SDK's pinned API version — typed against this exact
  // Stripe major. Override `apiVersion` only when intentionally testing
  // a newer one.
  cached = new Stripe(secret);
  return cached;
}

export function getProPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO;
  if (!id) {
    throw new Error(
      "STRIPE_PRICE_ID_PRO is not set. Create a Product + Price in Stripe (Test mode), copy the price_… id, and add it to env.",
    );
  }
  return id;
}

/** True if Stripe credentials are wired up. UI uses this to gate buttons. */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PRO,
  );
}

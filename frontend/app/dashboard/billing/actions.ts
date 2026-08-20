"use server";

import { ObjectId } from "mongodb";

import { getSession } from "@/lib/auth";
import { getStripe, getProPriceId } from "@/lib/stripe";

export type SubscribeState = { error?: string; url?: string };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function startSubscriptionAction(): Promise<SubscribeState> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) {
    return { error: "Your session expired. Log in again." };
  }

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      customer_email: session.email,
      // Carry our user id through the round-trip so the success handler
      // can match it against the logged-in session and prevent cross-account
      // upgrade attempts.
      client_reference_id: session.userId,
      success_url: `${siteUrl()}/dashboard/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/dashboard/billing?status=canceled`,
      allow_promotion_codes: true,
      // Telegraph the user back to themselves on the Stripe-hosted page.
      metadata: { userId: session.userId },
    });
    if (!checkout.url) {
      return { error: "Stripe didn't return a checkout URL." };
    }
    return { url: checkout.url };
  } catch (err) {
    console.error("[billing] startSubscription failed:", err);
    const msg =
      err instanceof Error ? err.message : "Stripe is not configured.";
    return { error: msg };
  }
}

/**
 * Called when the user lands back on /dashboard/billing with ?status=success.
 * Verifies the session was actually paid before flipping the user to Pro.
 *
 * Idempotent: re-running with the same session id just re-confirms the same
 * row; the user-update is a single $set.
 */
export async function verifyCheckoutOnReturn(
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!sessionId) return { ok: false, error: "Missing session id." };

  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) {
    return { ok: false, error: "Your session expired. Log in again." };
  }

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (checkout.client_reference_id !== session.userId) {
      return {
        ok: false,
        error: "This checkout doesn't match your account.",
      };
    }
    if (checkout.payment_status !== "paid") {
      return {
        ok: false,
        error: "Stripe didn't confirm payment for this checkout.",
      };
    }

    const subscription = checkout.subscription;
    const subscriptionId =
      typeof subscription === "string"
        ? subscription
        : subscription?.id;
    const customerId =
      typeof checkout.customer === "string"
        ? checkout.customer
        : checkout.customer?.id;
    if (!subscriptionId || !customerId) {
      return {
        ok: false,
        error: "Stripe didn't return a subscription id.",
      };
    }

    // The latest API typing for Subscription doesn't expose
    // current_period_end as a top-level number consistently; pull it from the
    // first item's period when present.
    let currentPeriodEnd: Date | undefined;
    if (subscription && typeof subscription !== "string") {
      const item = subscription.items?.data?.[0];
      if (item?.current_period_end) {
        currentPeriodEnd = new Date(item.current_period_end * 1000);
      }
    }

    const { setUserPro } = await import("@/lib/users");
    await setUserPro(new ObjectId(session.userId), {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodEnd,
    });
    return { ok: true };
  } catch (err) {
    console.error("[billing] verifyCheckoutOnReturn failed:", err);
    return {
      ok: false,
      error: "We couldn't verify that checkout. Refresh in a moment.",
    };
  }
}

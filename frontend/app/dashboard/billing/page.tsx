import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
  SparklesIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { isStripeConfigured } from "@/lib/stripe";
import { Topbar } from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";
import { verifyCheckoutOnReturn } from "./actions";
import { SubscribeButton } from "./subscribe-button";

type Search = Promise<{ status?: string; session_id?: string }>;

const FREE_FEATURES = [
  "Up to 3 active units",
  "Manual vendor payouts",
  "Activity feed + CSV export",
  "Email support",
];

const PRO_FEATURES = [
  "Unlimited units, vendors, and work orders",
  "Vendor portal with one-tap completion",
  "Operational email notifications",
  "Live-sync split-screen + portfolio analytics",
  "Net profit math, Reports, CSV exports",
  "Priority support",
];

function formatDate(d?: Date): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");

  const sp = await searchParams;
  let returnState:
    | { kind: "success" }
    | { kind: "canceled" }
    | { kind: "error"; message: string }
    | null = null;

  // Verify and persist if we just came back from Stripe Checkout.
  if (sp.status === "success" && sp.session_id) {
    const result = await verifyCheckoutOnReturn(sp.session_id);
    returnState = result.ok
      ? { kind: "success" }
      : { kind: "error", message: result.error ?? "Something went wrong." };
  } else if (sp.status === "canceled") {
    returnState = { kind: "canceled" };
  }

  const user = await getUserById(session.userId);
  const isPro = user?.subscriptionStatus === "pro";
  const periodEnd = formatDate(user?.subscriptionCurrentPeriodEnd);
  const stripeReady = isStripeConfigured();

  return (
    <>
      <Topbar
        title="Billing"
        user={{ name: session.name, email: session.email }}
      />

      {/* Return banners */}
      {returnState?.kind === "success" && (
        <>
          <ReturnBanner
            tone="emerald"
            icon={CheckmarkCircle01Icon}
            title="You're on Lynx Pro."
            body={
              periodEnd
                ? `Subscription active. Renews ${periodEnd}.`
                : "Subscription active. Welcome to Pro."
            }
          />
          <ReturnToWrapper />
        </>
      )}
      {returnState?.kind === "canceled" && (
        <ReturnBanner
          tone="zinc"
          icon={Cancel01Icon}
          title="Checkout canceled."
          body="No charge was made. Upgrade whenever you're ready."
        />
      )}
      {returnState?.kind === "error" && (
        <ReturnBanner
          tone="rose"
          icon={Clock01Icon}
          title="We couldn't confirm the upgrade."
          body={returnState.message}
        />
      )}

      {/* Plan grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <PlanCard
          name="Free"
          price="$0"
          cadence="/forever"
          tagline="What every operator needs to feel out the loop."
          features={FREE_FEATURES}
          current={!isPro}
        />
        <PlanCard
          name="Pro"
          price="$19"
          cadence="/month"
          tagline="The full operator stack — unlimited units, live vendor portal, operational analytics."
          features={PRO_FEATURES}
          current={isPro}
          inverted
          cta={
            isPro ? (
              <ProActiveBlock periodEnd={periodEnd} />
            ) : !stripeReady ? (
              <StripeNotConfigured />
            ) : (
              <SubscribeButton className="w-full">
                Upgrade to Pro
              </SubscribeButton>
            )
          }
        />
      </div>

      {/* Why */}
      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        <header className="mb-5">
          <h3 className="text-base font-semibold tracking-tight text-zinc-900">
            What Pro unlocks today
          </h3>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
            Subscription is verified directly with Stripe on return — no
            webhook required for the demo loop.
          </p>
        </header>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRO_FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-center gap-3 rounded-2xl bg-gray-50/70 border border-gray-100 px-4 py-3"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                <HugeiconsIcon icon={Tick01Icon} size={13} strokeWidth={2.6} />
              </span>
              <span className="text-sm font-medium tracking-tight text-zinc-900">
                {f}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// ---------- Plan card ----------

function PlanCard({
  name,
  price,
  cadence,
  tagline,
  features,
  current,
  inverted,
  cta,
}: {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  current?: boolean;
  inverted?: boolean;
  cta?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 overflow-hidden",
        inverted
          ? "bg-[#09090B] text-white border border-white/5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
          : "bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]",
      )}
    >
      {inverted && (
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      )}
      <header className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={cn(
                "text-lg font-semibold tracking-tight",
                inverted ? "text-white" : "text-zinc-900",
              )}
            >
              {name}
            </h2>
            {current && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                  inverted
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100/70",
                )}
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={10}
                  strokeWidth={2.4}
                />
                Current
              </span>
            )}
          </div>
          <p
            className={cn(
              "mt-2 text-sm font-medium max-w-sm leading-snug",
              inverted ? "text-zinc-400" : "text-gray-500",
            )}
          >
            {tagline}
          </p>
        </div>
        {inverted && (
          <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 text-white shrink-0">
            <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} />
          </span>
        )}
      </header>

      <div className="relative">
        <div className="flex items-end gap-1">
          <span
            className={cn(
              "text-5xl font-semibold tracking-tight leading-none",
              inverted ? "text-white" : "text-zinc-900",
            )}
          >
            {price}
          </span>
          <span
            className={cn(
              "pb-1 text-sm font-medium",
              inverted ? "text-zinc-400" : "text-gray-500",
            )}
          >
            {cadence}
          </span>
        </div>
      </div>

      <ul className="relative grid grid-cols-1 gap-2.5">
        {features.map((f) => (
          <li
            key={f}
            className={cn(
              "flex items-center gap-2.5 text-sm font-medium",
              inverted ? "text-zinc-200" : "text-zinc-700",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full",
                inverted
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {cta && <div className="relative mt-auto pt-2">{cta}</div>}
    </section>
  );
}

/**
 * Post-upgrade CTA card. The user just paid and Stripe escaped the iframe
 * wrapper, so they're now on Vercel directly.
 *
 * Primary action: continue to /dashboard on Vercel — that's where they
 * actually want to be after upgrading. Iframe wrappers can't deep-link
 * (their src is set once at wrapper-build time), so going "back to the
 * wrapper" reloads the configured iframe path (usually `/`, the marketing
 * landing) — wrong place after a paid upgrade.
 *
 * Secondary action: if NEXT_PUBLIC_WRAPPER_URL is set, surface a small
 * "back to wrapper" link for users who really want to return there.
 */
function ReturnToWrapper() {
  const wrapperUrl = process.env.NEXT_PUBLIC_WRAPPER_URL;
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
          <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-zinc-900">
            You&rsquo;re Pro. Keep going.
          </p>
          <p className="text-[11px] font-medium text-gray-500 truncate">
            Pick up where you left off in your dashboard.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {wrapperUrl && (
          <a
            href={wrapperUrl}
            target="_top"
            rel="noopener"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-gray-50 px-3 h-9 text-xs font-semibold transition-colors"
          >
            Back to wrapper
          </a>
        )}
        <a
          href="/dashboard"
          className={cn(
            "cursor-pointer inline-flex items-center gap-2 rounded-full",
            "bg-[#09090B] text-white px-5 h-10 text-sm font-medium",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_20px_-8px_rgba(0,0,0,0.45)]",
            "hover:bg-zinc-800 transition-colors",
          )}
        >
          Continue to dashboard
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.2} />
        </a>
      </div>
    </div>
  );
}

function ReturnBanner({
  tone,
  icon,
  title,
  body,
}: {
  tone: "emerald" | "rose" | "zinc";
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  title: string;
  body: string;
}) {
  const styles = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
    rose: "bg-rose-50 border-rose-100 text-rose-900",
    zinc: "bg-zinc-50 border-zinc-100 text-zinc-900",
  } as const;
  const iconStyles = {
    emerald: "bg-white text-emerald-700",
    rose: "bg-white text-rose-700",
    zinc: "bg-white text-zinc-700",
  } as const;
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 flex items-start gap-3",
        styles[tone],
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-xl shrink-0",
          iconStyles[tone],
        )}
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2.2} />
      </span>
      <div className="leading-snug">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        <p className="text-xs font-medium mt-0.5 opacity-80">{body}</p>
      </div>
    </div>
  );
}

function ProActiveBlock({ periodEnd }: { periodEnd: string | null }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-white">
          Subscription active
        </p>
        {periodEnd && (
          <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
            Renews {periodEnd}
          </p>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-[11px] font-semibold tracking-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Pro
      </span>
    </div>
  );
}

function StripeNotConfigured() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-medium text-zinc-300 leading-relaxed">
      Stripe keys aren&rsquo;t set yet. Add{" "}
      <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
        STRIPE_SECRET_KEY
      </code>{" "}
      and{" "}
      <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
        STRIPE_PRICE_ID_PRO
      </code>{" "}
      to your Vercel env vars and redeploy.{" "}
      <Link
        href="/dashboard/help"
        className="cursor-pointer underline hover:text-white"
      >
        How
      </Link>
    </div>
  );
}

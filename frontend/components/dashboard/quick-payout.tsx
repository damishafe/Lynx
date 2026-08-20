import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { formatUnsignedAmount, type PayoutDoc } from "@/lib/payouts";
import type { VendorDoc } from "@/lib/vendors";

const toneStyles = {
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
  ink: "bg-zinc-900 text-white",
};

function toneForName(name: string): keyof typeof toneStyles {
  const tones = Object.keys(toneStyles) as Array<keyof typeof toneStyles>;
  const sum = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[sum % tones.length];
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function QuickPayout({
  vendors,
  payouts,
}: {
  vendors: VendorDoc[];
  payouts: PayoutDoc[];
}) {
  // The "active" recipient — first in the list, ringed in emerald like the inspo.
  const recipients = vendors.slice(0, 4);
  const active = recipients[0];
  const pendingForActive = active
    ? payouts
        .filter(
          (payout) =>
            payout.status === "pending" &&
            payout.vendorId?.toString() === active._id.toString(),
        )
        .reduce((sum, payout) => sum + Math.abs(payout.amountCents), 0)
    : 0;

  if (recipients.length === 0) {
    return (
      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold tracking-tight text-zinc-900">
            Quick payout
          </h3>
        </div>
        <div className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-6 text-center">
          <span className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
            <HugeiconsIcon icon={UserAdd01Icon} size={22} strokeWidth={2} />
          </span>
          <h4 className="text-base font-semibold tracking-tight text-zinc-900">
            Add a vendor to send payouts
          </h4>
          <p className="mt-1.5 text-sm font-medium text-gray-500 leading-relaxed">
            Cleaners, maintenance teams, and suppliers will appear here once
            they are connected to your account.
          </p>
          <Link
            href="/dashboard/vendors/new"
            className={buttonClasses({
              variant: "primary",
              size: "sm",
              className: "mt-5",
            })}
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={14} strokeWidth={2.2} />
            Add vendor
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          Quick payout
        </h3>
        <button
          type="button"
          className="cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          See all
        </button>
      </div>

      {/* Recipient avatars */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {recipients.map((r, i) => {
          const tone = toneForName(r.name);
          return (
          <button
            key={r._id.toString()}
            type="button"
            className="cursor-pointer flex flex-col items-center gap-1.5 group"
          >
            <span
              className={cn(
                "flex items-center justify-center w-14 h-14 rounded-full text-lg font-semibold transition-transform duration-200 group-hover:-translate-y-0.5",
                toneStyles[tone],
                i === 0
                  ? "ring-[3px] ring-emerald-400 ring-offset-2 ring-offset-white"
                  : "",
              )}
            >
              {initialsForName(r.name)}
            </span>
            <span className="text-[11px] font-medium text-zinc-700 truncate max-w-full">
              {r.name.split(" ")[0]}
            </span>
          </button>
          );
        })}
      </div>

      {/* Pending balance */}
      <div className="rounded-2xl border border-gray-100 px-4 py-3 mb-5">
        <div className="flex items-center gap-2 mb-1">
          {active ? (
            <span
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold",
                toneStyles[toneForName(active.name)],
              )}
            >
              {initialsForName(active.name)}
            </span>
          ) : null}
          <span className="text-[11px] font-medium text-gray-500">
            Pending for{" "}
            <span className="text-zinc-900 font-semibold">
              {active?.name}
            </span>
          </span>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-zinc-900">
          {pendingForActive > 0
            ? formatUnsignedAmount(pendingForActive)
            : "No pending balance"}
        </p>
        <p className="mt-1 text-[11px] font-medium text-gray-500">
          Completed work orders create pending payouts automatically.
        </p>
      </div>

      {/* Send action */}
      <button
        type="button"
        disabled={pendingForActive === 0}
        className="cursor-pointer w-full inline-flex items-center gap-3 rounded-full bg-[#09090B] text-white pl-1.5 pr-5 py-1.5 text-sm font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_20px_-8px_rgba(0,0,0,0.45)] hover:bg-zinc-800 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-zinc-900">
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            strokeWidth={2.4}
          />
        </span>
        <span>{pendingForActive > 0 ? "Send payout" : "No payout due"}</span>
      </button>
    </section>
  );
}

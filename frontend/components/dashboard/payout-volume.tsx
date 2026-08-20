import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { PayoutDoc } from "@/lib/payouts";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildPayoutVolume(payouts: PayoutDoc[]) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const total = payouts
      .filter((p) => {
        const occurredAt = new Date(p.occurredAt);
        return occurredAt >= day && occurredAt < next;
      })
      .reduce((sum, p) => sum + Math.abs(p.amountCents), 0);

    return {
      label: days[day.getDay()],
      short: days[day.getDay()].slice(0, 1),
      total,
    };
  });
}

export function PayoutVolume({ payouts }: { payouts: PayoutDoc[] }) {
  const payoutVolume = buildPayoutVolume(payouts);
  const max = Math.max(...payoutVolume.map((b) => b.total), 1);
  const peak = payoutVolume.reduce((best, b) => (b.total > best.total ? b : best), payoutVolume[0]);

  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          Payout volume
        </h3>
        <button
          type="button"
          aria-label="Chart options"
          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-50 hover:text-zinc-700 transition-colors"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={2} />
        </button>
      </div>
      <p className="text-[11px] font-medium text-gray-400 mb-6">
        Last 7 days
      </p>

      {/* Bars */}
      <div className="grid grid-cols-7 gap-3 h-40 sm:h-44">
        {payoutVolume.map((b, i) => {
          const h = (b.total / max) * 100;
          const highlight = b.total > 0 && b === peak;
          return (
            <div key={i} className="flex flex-col items-center">
              <div className="relative w-full flex-1 flex items-end justify-center">
                {highlight && peak && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-10"
                    style={{ bottom: `calc(${h}% + 10px)` }}
                  >
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] px-3 py-1.5 whitespace-nowrap">
                      <div className="text-[10px] font-medium text-gray-400">
                        {b.label}, this week
                      </div>
                      <div className="text-sm font-semibold tracking-tight text-zinc-900">
                        ${(peak.total / 100).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "w-full rounded-t-full rounded-b-full transition-[height] duration-700",
                  )}
                  style={{
                    height: `${h}%`,
                    minHeight: "20px",
                    background: highlight
                      ? "linear-gradient(180deg, #7C3AED 0%, #A78BFA 100%)"
                      : "linear-gradient(180deg, #DDD6FE 0%, #EDE9FE 100%)",
                    boxShadow: highlight
                      ? "0 -10px 30px -8px rgba(124,58,237,0.45)"
                      : undefined,
                  }}
                />
              </div>
              <span className="mt-3 text-[11px] font-medium text-gray-500">
                {b.short}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

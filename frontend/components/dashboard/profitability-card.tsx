import { HugeiconsIcon } from "@hugeicons/react";
import { MoneyBag01Icon } from "@hugeicons/core-free-icons";

import type { Ledger } from "@/lib/ledger-math";
import { formatUnsignedAmount } from "@/lib/payouts";
import { cn } from "@/lib/utils";

/**
 * The ledger, stated exactly. Values are never abbreviated here: this card is the
 * source of truth humans and Kane read, so "$1,000.00" must say "$1,000.00".
 */
export function ProfitabilityCard({
  ledger,
  windowLabel = "Last 30 days",
}: {
  ledger: Ledger;
  windowLabel?: string;
}) {
  const negative = ledger.netCents < 0;
  const rows: { label: string; cents: number; emphasis?: boolean }[] = [
    { label: "Revenue", cents: ledger.revenueCents },
    { label: "Costs", cents: ledger.costsCents },
    { label: "Platform fee", cents: ledger.platformFeeCents },
    { label: "Net", cents: ledger.netCents, emphasis: true },
  ];

  return (
    <section
      aria-labelledby="profitability-heading"
      className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 id="profitability-heading" className="text-base font-semibold tracking-tight text-zinc-900">
            Profitability
          </h3>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Bookings minus completed vendor work · {windowLabel}
          </p>
        </div>
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#09090B] text-white">
          <HugeiconsIcon icon={MoneyBag01Icon} size={18} strokeWidth={2} />
        </span>
      </div>

      <dl className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between py-3 first:pt-0 last:pb-0">
            <dt className={cn("text-sm font-semibold tracking-tight", row.emphasis ? "text-zinc-900" : "text-gray-600")}>
              {row.label}
            </dt>
            <dd
              className={cn(
                "tabular-nums tracking-tight",
                row.emphasis ? "text-2xl font-semibold" : "text-base font-semibold",
                row.emphasis && negative ? "text-rose-700" : "text-zinc-900",
              )}
            >
              {row.label === "Net" && negative ? "-" : ""}
              {formatUnsignedAmount(row.cents)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

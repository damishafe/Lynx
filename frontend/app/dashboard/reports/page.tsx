import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  ArrowRight01Icon,
  Building01Icon,
  ChartLineData01Icon,
  DownloadIcon,
  MoneyBag01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { countUnitsByStatus } from "@/lib/units";
import { defaultProfitWindowStart, listPayouts } from "@/lib/payouts";
import { totalBookingRevenueCents } from "@/lib/bookings";
import { Topbar } from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";

type IconType = Parameters<typeof HugeiconsIcon>[0]["icon"];

function formatMoney(cents: number): string {
  const v = cents / 100;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function pct(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

const periods = ["Last 7 days", "Last 30 days", "Quarter to date", "Year to date"];

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let counts = {
    total: 0,
    ready: 0,
    occupied: 0,
    needs_cleaning: 0,
    maintenance: 0,
  };
  let revenueCents = 0;
  let payouts: Awaited<ReturnType<typeof listPayouts>> = [];

  try {
    [counts, revenueCents, payouts] = await Promise.all([
      countUnitsByStatus(ownerId),
      totalBookingRevenueCents(ownerId, { since: defaultProfitWindowStart() }),
      listPayouts(ownerId, { limit: 100 }),
    ]);
  } catch (err) {
    console.error("[reports] read failed:", err);
  }

  const latestPayoutTime = Math.max(
    0,
    ...payouts.map((p) => new Date(p.occurredAt).getTime()),
  );
  const thirtyDaysAgo = latestPayoutTime - 1000 * 60 * 60 * 24 * 30;
  const recentPayouts = payouts.filter(
    (p) => latestPayoutTime > 0 && new Date(p.occurredAt).getTime() >= thirtyDaysAgo,
  );
  const payoutSpendCents = recentPayouts.reduce(
    (sum, p) => sum + Math.abs(p.amountCents),
    0,
  );
  const failedPayouts = payouts.filter((p) => p.status === "failed").length;
  const pendingPayouts = payouts.filter((p) => p.status === "pending").length;
  const activeUnits = counts.ready + counts.occupied;
  // Period-bounded completed spend (last 30 days) drives the net-profit
  // figure used on Overview, Unit detail, and Reports — same window everywhere.
  const profitWindowStartMs = latestPayoutTime > 0 ? thirtyDaysAgo : 0;
  const completedSpendCents = payouts
    .filter(
      (p) =>
        p.status === "completed" &&
        new Date(p.occurredAt).getTime() >= profitWindowStartMs,
    )
    .reduce((sum, p) => sum + Math.abs(p.amountCents), 0);
  const netProfitCents = revenueCents - completedSpendCents;
  const operationalCards: { icon: IconType; title: string; value: string; body: string }[] = [
    {
      icon: ChartLineData01Icon,
      title: "Revenue trend",
      value: revenueCents > 0 ? formatMoney(revenueCents) : "$0",
      body: `${formatMoney(payoutSpendCents)} in vendor spend logged over the selected period.`,
    },
    {
      icon: Building01Icon,
      title: "Occupancy curves",
      value: pct(counts.occupied, counts.total),
      body: `${activeUnits} active units across ${counts.total} total, with ${counts.ready} ready for turnover.`,
    },
    {
      icon: Notification01Icon,
      title: "Anomaly log",
      value: String(counts.maintenance + failedPayouts),
      body: `${counts.maintenance} units in maintenance, ${failedPayouts} failed payouts, ${pendingPayouts} pending payouts.`,
    },
    {
      icon: DownloadIcon,
      title: "CSV exports",
      value: String(payouts.length + counts.total),
      body: "Export-ready rows from your live unit and payout records.",
    },
  ];

  return (
    <>
      <Topbar
        title="Reports"
        user={{ name: session.name, email: session.email }}
      />

      {/* Period selector — visual only for now, signals structure */}
      <div className="rounded-full bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-1.5 self-start inline-flex items-center gap-1 max-w-full overflow-x-auto">
        {periods.map((p, i) => (
          <button
            key={p}
            type="button"
            disabled={i !== 1}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight transition-colors",
              i === 1
                ? "bg-[#09090B] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)] cursor-pointer"
                : "text-gray-400 cursor-not-allowed",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Live snapshot — uses real data */}
      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        <header className="mb-5">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            Live snapshot
          </h2>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
            Pulled from your portfolio right now.
          </p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SnapshotTile
            icon={Building01Icon}
            label="Total units"
            value={String(counts.total)}
            tone="violet"
          />
          <SnapshotTile
            icon={Building01Icon}
            label="Active"
            value={String(activeUnits)}
            sub={
              counts.total
                ? `${pct(activeUnits, counts.total)} of portfolio`
                : "—"
            }
            tone="emerald"
          />
          <SnapshotTile
            icon={MoneyBag01Icon}
            label="Monthly revenue"
            value={revenueCents > 0 ? formatMoney(revenueCents) : "$0"}
            sub="from ready & occupied"
            tone="amber"
          />
          <SnapshotTile
            icon={ChartLineData01Icon}
            label="Net profit"
            value={
              revenueCents > 0
                ? (netProfitCents < 0 ? "−" : "") +
                  formatMoney(Math.abs(netProfitCents))
                : "$0"
            }
            sub={
              revenueCents > 0
                ? `${formatMoney(revenueCents)} − ${formatMoney(completedSpendCents)} costs`
                : "Set unit revenue to track"
            }
            tone={netProfitCents < 0 ? "rose" : "ink"}
            valueClassName={netProfitCents < 0 ? "text-rose-700" : undefined}
          />
        </div>
      </section>

      {/* Operational cards */}
      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        <header className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-3 py-0.5 text-[11px] font-semibold tracking-tight mb-3">
              <HugeiconsIcon icon={AnalyticsUpIcon} size={11} strokeWidth={2.2} />
              Live
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 leading-[1.1]">
              Reports are reading live records.
            </h2>
            <p className="mt-2 text-sm font-medium text-gray-500 max-w-xl">
              These cards now hydrate from units and payouts, so the same
              references powering activity can graduate into charts, alerts,
              and exports without changing the page structure.
            </p>
          </div>
          <Link
            href="/dashboard/reports/export"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-[#09090B] text-white px-4 py-2 text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            <HugeiconsIcon icon={DownloadIcon} size={14} strokeWidth={2.2} />
            Download CSV
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operationalCards.map((u) => (
            <div
              key={u.title}
              className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-5 flex flex-col gap-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-zinc-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
                <HugeiconsIcon icon={u.icon} size={18} strokeWidth={2} />
              </span>
              <div>
                <div className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none mb-2">
                  {u.value}
                </div>
                <div className="text-sm font-semibold tracking-tight text-zinc-900">
                  {u.title}
                </div>
                <p className="mt-1 text-xs font-medium text-gray-500 leading-relaxed">
                  {u.body}
                </p>
                {u.title === "CSV exports" && (
                  <Link
                    href="/dashboard/reports/export"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
                  >
                    Export records
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={11}
                      strokeWidth={2.2}
                    />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const tones: Record<
  "violet" | "emerald" | "rose" | "ink" | "amber",
  { wrap: string; iconWrap: string }
> = {
  violet: {
    wrap: "from-violet-100/60 to-violet-50/0",
    iconWrap: "bg-violet-100 text-violet-700",
  },
  emerald: {
    wrap: "from-emerald-100/60 to-emerald-50/0",
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    wrap: "from-amber-100/60 to-amber-50/0",
    iconWrap: "bg-amber-100 text-amber-700",
  },
  rose: {
    wrap: "from-rose-100/60 to-rose-50/0",
    iconWrap: "bg-rose-100 text-rose-700",
  },
  ink: {
    wrap: "from-zinc-100/70 to-zinc-50/0",
    iconWrap: "bg-[#09090B] text-white",
  },
};

function SnapshotTile({
  icon,
  label,
  value,
  sub,
  tone,
  valueClassName,
}: {
  icon: IconType;
  label: string;
  value: string;
  sub?: string;
  tone: keyof typeof tones;
  valueClassName?: string;
}) {
  const t = tones[tone];
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-5">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          t.wrap,
        )}
      />
      <div className="relative flex flex-col gap-3">
        <span className={cn("flex items-center justify-center w-9 h-9 rounded-xl", t.iconWrap)}>
          <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
        </span>
        <div>
          <div
            className={cn(
              "text-2xl font-semibold tracking-tight leading-none",
              valueClassName ?? "text-zinc-900",
            )}
          >
            {value}
          </div>
          <div className="text-[11px] font-semibold tracking-tight text-zinc-700 mt-1.5">
            {label}
          </div>
          {sub && (
            <div className="text-[10px] font-medium text-gray-500 mt-0.5">
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

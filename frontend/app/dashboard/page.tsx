import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Building01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  MoneyBag01Icon,
  Settings01Icon,
  UserIcon,
  Add01Icon,
  WorkHistoryIcon,
  Calendar03Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import {
  countUnitsByStatus,
  listUnits,
  type StatusCounts,
  type UnitDoc,
} from "@/lib/units";
import { listRecentActivity, type ActivityEvent } from "@/lib/activity";
import {
  formatWorkOrderType,
  getLatestCompletedWorkOrder,
  listWorkOrders,
  type WorkOrderDoc,
} from "@/lib/work-orders";
import {
  defaultProfitWindowStart,
  formatAmount,
  formatUnsignedAmount,
  totalOwedToVendorsCents,
} from "@/lib/payouts";
import { getLedger } from "@/lib/ledger";
import type { Ledger } from "@/lib/ledger-math";

import { Topbar } from "@/components/dashboard/topbar";
import { UnitCard } from "@/components/dashboard/unit-card";
import { CompleteWorkOrderButton } from "@/components/dashboard/complete-work-order-button";
import { LiveDashboardRefresh } from "@/components/dashboard/live-dashboard-refresh";
import { WorkOrderStatusPill } from "@/components/dashboard/work-order-status-pill";
import { ProfitabilityCard } from "@/components/dashboard/profitability-card";
import { buttonClasses } from "@/components/ui/button";
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

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function OverviewPage() {
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
  let ledger: Ledger = { revenueCents: 0, costsCents: 0, netCents: 0 };
  let recentUnits: UnitDoc[] = [];
  let activity: ActivityEvent[] = [];
  let assignedWorkOrders: WorkOrderDoc[] = [];
  let latestCompletedWorkOrder: WorkOrderDoc | null = null;
  let owedToVendorsCents = 0;
  let loadError: string | null = null;

  try {
    [
      counts,
      ledger,
      recentUnits,
      activity,
      assignedWorkOrders,
      latestCompletedWorkOrder,
      owedToVendorsCents,
    ] = await Promise.all([
      countUnitsByStatus(ownerId),
      getLedger(ownerId, { since: defaultProfitWindowStart() }),
      listUnits(ownerId, { limit: 6 }),
      listRecentActivity(ownerId, 8),
      listWorkOrders(ownerId, { status: "assigned", limit: 6 }),
      getLatestCompletedWorkOrder(ownerId),
      totalOwedToVendorsCents(ownerId),
    ]);
  } catch (err) {
    console.error("[overview] read failed:", err);
    loadError =
      "We couldn't reach our servers right now. The portfolio will appear here as soon as we're back online.";
  }

  const firstName = session.name.split(" ")[0] || "there";
  const occupancyPct = pct(counts.occupied, counts.total);
  const { revenueCents, costsCents, netCents: netProfitCents } = ledger;

  return (
    <>
      <LiveDashboardRefresh />
      <Topbar
        title={`Welcome back, ${firstName}`}
        user={{ name: session.name, email: session.email }}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Units"
          value={String(counts.total)}
          hint={counts.total === 0 ? "Add your first to get started" : "across your portfolio"}
          icon={Building01Icon}
          tone="violet"
          ctaHref={counts.total === 0 ? "/dashboard/units/new" : "/dashboard/units"}
        />
        <KpiCard
          label="Ready"
          value={String(counts.ready)}
          hint={counts.total ? `${pct(counts.ready, counts.total)} of portfolio` : "—"}
          icon={CheckmarkCircle01Icon}
          tone="emerald"
        />
        <KpiCard
          label="Occupied"
          value={String(counts.occupied)}
          hint={counts.total ? `${occupancyPct} occupancy` : "—"}
          icon={UserIcon}
          tone="amber"
        />
        <KpiCard
          label="Net profit"
          value={revenueCents > 0 ? formatMoney(netProfitCents) : "$0"}
          hint={
            revenueCents > 0
              ? `${formatMoney(revenueCents)} rev − ${formatMoney(costsCents)} costs`
              : "Add a booking to track"
          }
          icon={MoneyBag01Icon}
          tone={netProfitCents < 0 ? "rose" : "ink"}
          valueClassName={netProfitCents < 0 ? "text-rose-700" : undefined}
        />
      </div>

      {loadError ? (
        <section className="rounded-[2rem] bg-white border border-rose-100 p-8 text-center">
          <p className="text-sm font-medium text-gray-500">{loadError}</p>
        </section>
      ) : (
        <>
          <ProfitabilityCard ledger={ledger} />

          <OperationsPanel
            assignedWorkOrders={assignedWorkOrders}
            latestCompletedWorkOrder={latestCompletedWorkOrder}
            owedToVendorsCents={owedToVendorsCents}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Status grid */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <StatusBreakdownCard counts={counts} />
              <RecentUnitsCard units={recentUnits} totalUnits={counts.total} />
            </div>

            {/* Activity preview */}
            <div className="lg:col-span-4">
              <ActivityPreviewCard events={activity} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ---------- KPI Card ----------

const toneStyles: Record<
  "violet" | "emerald" | "amber" | "ink" | "rose",
  { wrapper: string; iconWrap: string }
> = {
  violet: {
    wrapper:
      "from-violet-100/60 to-violet-50/0 hover:from-violet-100/80",
    iconWrap: "bg-violet-100 text-violet-700",
  },
  emerald: {
    wrapper:
      "from-emerald-100/60 to-emerald-50/0 hover:from-emerald-100/80",
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    wrapper:
      "from-amber-100/60 to-amber-50/0 hover:from-amber-100/80",
    iconWrap: "bg-amber-100 text-amber-700",
  },
  ink: {
    wrapper: "from-zinc-100/60 to-zinc-50/0 hover:from-zinc-100/80",
    iconWrap: "bg-[#09090B] text-white",
  },
  rose: {
    wrapper: "from-rose-100/60 to-rose-50/0 hover:from-rose-100/80",
    iconWrap: "bg-rose-100 text-rose-700",
  },
};

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
  ctaHref,
  valueClassName,
}: {
  label: string;
  value: string;
  hint: string;
  icon: IconType;
  tone: "violet" | "emerald" | "amber" | "ink" | "rose";
  ctaHref?: string;
  valueClassName?: string;
}) {
  const t = toneStyles[tone];
  const inner = (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex items-center justify-center w-10 h-10 rounded-xl", t.iconWrap)}>
          <HugeiconsIcon icon={icon} size={18} strokeWidth={2} />
        </span>
        {ctaHref && (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/80 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.4} />
          </span>
        )}
      </div>
      <div>
        <div
          className={cn(
            "text-3xl font-semibold tracking-tight leading-none",
            valueClassName ?? "text-zinc-900",
          )}
        >
          {value}
        </div>
        <div className="text-sm font-semibold tracking-tight text-zinc-700 mt-2">
          {label}
        </div>
        <div className="text-[11px] font-medium text-gray-500 mt-1">{hint}</div>
      </div>
    </div>
  );

  const wrap = cn(
    "group relative overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white p-5 sm:p-6 transition-all duration-300",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]",
    "hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_14px_36px_-10px_rgba(0,0,0,0.08)]",
  );

  if (ctaHref) {
    return (
      <Link href={ctaHref} className={cn(wrap, "cursor-pointer")}>
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none transition-opacity",
            t.wrapper,
          )}
        />
        <div className="relative">{inner}</div>
      </Link>
    );
  }
  return (
    <div className={wrap}>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          t.wrapper,
        )}
      />
      <div className="relative">{inner}</div>
    </div>
  );
}

// ---------- Operations panel ----------

function OperationsPanel({
  assignedWorkOrders,
  latestCompletedWorkOrder,
  owedToVendorsCents,
}: {
  assignedWorkOrders: WorkOrderDoc[];
  latestCompletedWorkOrder: WorkOrderDoc | null;
  owedToVendorsCents: number;
}) {
  const totalOpenCost = assignedWorkOrders.reduce(
    (sum, job) => sum + Math.abs(job.costCents),
    0,
  );

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
      <div className="xl:col-span-8 h-full flex flex-col rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-900">
              Operations queue
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Vendor jobs that can change unit status and payout totals.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-3 py-1 text-[11px] font-semibold tracking-tight">
              <HugeiconsIcon icon={RefreshIcon} size={11} strokeWidth={2.2} />
              Live sync
            </span>
            <Link
              href="/dashboard/work-orders"
              className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 transition-colors"
            >
              View all
              <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
            </Link>
          </div>
        </div>

        {assignedWorkOrders.length === 0 ? (
          <div className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-8 text-center">
            <span className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
              <HugeiconsIcon icon={WorkHistoryIcon} size={22} strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold tracking-tight text-zinc-900">
              No assigned jobs
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Create a work order to see vendor completion update the manager view.
            </p>
            <Link
              href="/dashboard/work-orders/new"
              className={buttonClasses({
                variant: "primary",
                size: "sm",
                className: "mt-5",
              })}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
              New work order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_100px_112px] gap-4 rounded-xl bg-gray-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                <span>Job</span>
                <span>Unit</span>
                <span>Vendor</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Action</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {assignedWorkOrders.map((job) => (
                  <li
                    key={job._id.toString()}
                    className="grid grid-cols-[1.4fr_1fr_1fr_100px_112px] gap-4 px-4 py-4 items-center hover:bg-gray-50/60 transition-colors rounded-xl"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                          {job.title}
                        </span>
                        <WorkOrderStatusPill
                          status={job.status}
                          className="shrink-0"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
                        {formatWorkOrderType(job.type)} · due {formatDueDate(job.dueAt)}
                      </p>
                    </div>
                    <TableCellMeta icon={Building01Icon} label={job.unitName} />
                    <TableCellMeta icon={UserIcon} label={job.vendorName} />
                    <span className="text-right text-sm font-semibold tracking-tight text-zinc-900">
                      {formatAmount(-Math.abs(job.costCents))}
                    </span>
                    <div className="flex justify-end">
                      <CompleteWorkOrderButton
                        workOrderId={job._id.toString()}
                        compact
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-5">
        <OpsSummaryCard
          label="Owed to vendors"
          value={formatUnsignedAmount(owedToVendorsCents)}
          hint={`${formatUnsignedAmount(totalOpenCost)} still assigned`}
          icon={MoneyBag01Icon}
          tone="ink"
        />
        <LatestCompletionCard workOrder={latestCompletedWorkOrder} />
      </div>
    </section>
  );
}

function OpsSummaryCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: IconType;
  tone: "ink" | "emerald";
}) {
  const toneClass =
    tone === "ink"
      ? "bg-[#09090B] text-white"
      : "bg-emerald-100 text-emerald-700";
  return (
    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6">
      <span className={cn("flex items-center justify-center w-10 h-10 rounded-xl mb-5", toneClass)}>
        <HugeiconsIcon icon={icon} size={18} strokeWidth={2} />
      </span>
      <div className="text-3xl font-semibold tracking-tight text-zinc-900 leading-none">
        {value}
      </div>
      <div className="text-sm font-semibold tracking-tight text-zinc-700 mt-2">
        {label}
      </div>
      <div className="text-[11px] font-medium text-gray-500 mt-1">{hint}</div>
    </div>
  );
}

function LatestCompletionCard({
  workOrder,
}: {
  workOrder: WorkOrderDoc | null;
}) {
  return (
    <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} />
        </span>
        <Link
          href="/dashboard/activity"
          className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 transition-colors"
        >
          Activity
          <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
        </Link>
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-zinc-700">
        Latest completed job
      </h3>
      {workOrder ? (
        <>
          <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 leading-snug">
            {workOrder.title}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-500 leading-relaxed">
            {workOrder.vendorName} · {workOrder.unitName}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-3 py-1 text-[11px] font-semibold tracking-tight">
            <HugeiconsIcon icon={Calendar03Icon} size={11} strokeWidth={2.2} />
            {formatRelative(new Date(workOrder.completedAt ?? workOrder.createdAt))}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">
          Completed vendor jobs will appear here the moment a job is marked done.
        </p>
      )}
    </div>
  );
}

function TableCellMeta({
  icon,
  label,
}: {
  icon: IconType;
  label: string;
}) {
  return (
    <div className="min-w-0 flex items-center gap-2 text-sm font-medium text-gray-600">
      <HugeiconsIcon
        icon={icon}
        size={14}
        strokeWidth={2}
        className="text-gray-400 shrink-0"
      />
      <span className="truncate">{label}</span>
    </div>
  );
}

function formatDueDate(d?: Date): string {
  if (!d) return "unscheduled";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------- Status breakdown card ----------

function StatusBreakdownCard({ counts }: { counts: StatusCounts }) {
  const segments = [
    { key: "ready" as const, label: "Ready", value: counts.ready, color: "#10B981" },
    { key: "occupied" as const, label: "Occupied", value: counts.occupied, color: "#F59E0B" },
    { key: "needs_cleaning" as const, label: "Needs cleaning", value: counts.needs_cleaning, color: "#0EA5E9" },
    { key: "maintenance" as const, label: "Maintenance", value: counts.maintenance, color: "#F43F5E" },
  ];
  const total = counts.total || 1;

  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          Portfolio status
        </h3>
        <Link
          href="/dashboard/units"
          className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 transition-colors"
        >
          View all
          <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
        </Link>
      </div>

      {counts.total === 0 ? (
        <p className="text-sm font-medium text-gray-500">
          Add a unit to see your portfolio breakdown here.
        </p>
      ) : (
        <>
          {/* Stacked horizontal bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-5">
            {segments.map((s) =>
              s.value === 0 ? null : (
                <div
                  key={s.key}
                  style={{
                    width: `${(s.value / total) * 100}%`,
                    backgroundColor: s.color,
                  }}
                  title={`${s.label}: ${s.value}`}
                />
              ),
            )}
          </div>

          {/* Legend rows */}
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {segments.map((s) => (
              <li
                key={s.key}
                className="flex items-center justify-between rounded-2xl bg-gray-50/70 border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm font-medium text-zinc-700 truncate">
                    {s.label}
                  </span>
                </div>
                <span className="text-sm font-semibold tracking-tight text-zinc-900">
                  {s.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// ---------- Recent units ----------

function RecentUnitsCard({
  units,
  totalUnits,
}: {
  units: UnitDoc[];
  totalUnits: number;
}) {
  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          Recent units
        </h3>
        {totalUnits > 0 && (
          <Link
            href="/dashboard/units"
            className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 transition-colors"
          >
            View all {totalUnits}
            <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
          </Link>
        )}
      </div>

      {units.length === 0 ? (
        <div className="rounded-2xl bg-gray-50/70 border border-gray-100 p-8 text-center">
          <p className="text-sm font-medium text-gray-500 mb-4">
            Your portfolio is empty.
          </p>
          <Link
            href="/dashboard/units/new"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
            Add your first unit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {units.slice(0, 6).map((u) => (
            <UnitCard key={u._id.toString()} unit={u} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- Activity preview ----------

const activityIcon: Record<ActivityEvent["type"], IconType> = {
  "unit.created": Building01Icon,
  "unit.updated": Settings01Icon,
  "unit.status_changed": CheckmarkCircle01Icon,
  "unit.deleted": Settings01Icon,
  "work_order.created": Settings01Icon,
  "work_order.completed": CheckmarkCircle01Icon,
  "work_order.cancelled": Clock01Icon,
  "vendor.created": MoneyBag01Icon,
  "vendor.deleted": Settings01Icon,
  "payout.created": MoneyBag01Icon,
  "payout.completed": CheckmarkCircle01Icon,
  "payout.failed": Clock01Icon,
  "booking.created": Calendar03Icon,
  "booking.checked_out": CheckmarkCircle01Icon,
};

function ActivityPreviewCard({ events }: { events: ActivityEvent[] }) {
  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          Recent activity
        </h3>
        <Link
          href="/dashboard/activity"
          className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 transition-colors"
        >
          View all
          <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-sm font-medium text-gray-500">
          Nothing yet. As you add units and flip statuses, the latest events
          will land here.
        </p>
      ) : (
        <ul className="flex flex-col">
          {events.map((e, i) => (
            <li
              key={e._id.toString()}
              className={cn(
                "flex items-start gap-3 py-3.5",
                i !== events.length - 1 && "border-b border-gray-100",
              )}
            >
              <span className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-zinc-700 shrink-0">
                <HugeiconsIcon
                  icon={activityIcon[e.type] ?? Clock01Icon}
                  size={14}
                  strokeWidth={2}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold tracking-tight text-zinc-900 leading-snug">
                  {e.summary}
                </div>
                <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                  {formatRelative(new Date(e.occurredAt))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

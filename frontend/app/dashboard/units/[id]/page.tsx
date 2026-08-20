import { ObjectId } from "mongodb";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  Note01Icon,
  Clock01Icon,
  MoneyBag01Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getUnitById } from "@/lib/units";
import { listActivityForEntity } from "@/lib/activity";
import {
  defaultProfitWindowStart,
  formatAmount,
  formatUnsignedAmount,
  listPayoutsForUnit,
  type PayoutDoc,
} from "@/lib/payouts";
import { getLedger } from "@/lib/ledger";
import {
  formatWorkOrderType,
  listWorkOrders,
  type WorkOrderDoc,
} from "@/lib/work-orders";

import { Topbar } from "@/components/dashboard/topbar";
import { UnitStatusPill } from "@/components/dashboard/unit-status-pill";
import { UnitStatusSwitcher } from "@/components/dashboard/unit-status-switcher";
import { DeleteUnitButton } from "@/components/dashboard/delete-unit-button";

type Params = Promise<{ id: string }>;

function formatRevenue(cents?: number): string {
  if (typeof cents !== "number") return "Not set";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatNet(cents: number): string {
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (cents < 0) return `−$${formatted}`;
  return `$${formatted}`;
}

function ProfitRow({
  label,
  value,
  sub,
  positive,
  negative,
}: {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-gray-50/70 border border-gray-100 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-semibold tracking-tight",
          positive && "text-emerald-700",
          negative && "text-rose-700",
          !positive && !negative && "text-zinc-900",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRelative(d: Date): string {
  const now = Date.now();
  const diffMs = now - d.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDateTime(d);
}

type TimelineItem =
  | {
      kind: "activity";
      id: string;
      summary: string;
      occurredAt: Date;
    }
  | {
      kind: "payout";
      id: string;
      payout: PayoutDoc;
      occurredAt: Date;
    }
  | {
      kind: "work_order";
      id: string;
      workOrder: WorkOrderDoc;
      occurredAt: Date;
    };

export default async function UnitDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  if (!ObjectId.isValid(id)) notFound();

  const ownerId = new ObjectId(session.userId);
  const unitObjectId = new ObjectId(id);

  const unit = await getUnitById(ownerId, unitObjectId);
  if (!unit) notFound();

  const [events, payouts, workOrders] = await Promise.all([
    listActivityForEntity(ownerId, "unit", id, 25),
    listPayoutsForUnit(ownerId, unitObjectId, 25),
    listWorkOrders(ownerId, { unitId: unitObjectId, limit: 25 }),
  ]);

  const openCleaning = workOrders.some(
    (w) => w.type === "cleaning" && w.status === "assigned",
  );

  const unitLedger = await getLedger(ownerId, {
    since: defaultProfitWindowStart(),
    unitId: unitObjectId,
  });
  const periodCostsCents = unitLedger.costsCents;
  const monthlyRevenueCents = unitLedger.revenueCents;
  const netProfitCents = unitLedger.netCents;
  const showProfit = monthlyRevenueCents > 0 || periodCostsCents > 0;

  const timeline: TimelineItem[] = [
    ...events.map((event) => ({
      kind: "activity" as const,
      id: event._id.toString(),
      summary: event.summary,
      occurredAt: new Date(event.occurredAt),
    })),
    ...payouts.map((payout) => ({
      kind: "payout" as const,
      id: payout._id.toString(),
      payout,
      occurredAt: new Date(payout.occurredAt),
    })),
    ...workOrders.map((workOrder) => ({
      kind: "work_order" as const,
      id: workOrder._id.toString(),
      workOrder,
      occurredAt: new Date(workOrder.completedAt ?? workOrder.createdAt),
    })),
  ]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 25);

  return (
    <>
      <Topbar
        title={unit.name}
        user={{ name: session.name, email: session.email }}
      />

      <nav className="text-sm font-medium text-gray-500 -mt-2">
        <Link
          href="/dashboard/units"
          className="hover:text-zinc-900 transition-colors"
        >
          Units
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-zinc-900 truncate inline-block max-w-[20rem] align-bottom">
          {unit.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: hero + status switcher */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <UnitStatusPill status={unit.status} size="md" />
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
                  {unit.name}
                </h2>
                <p className="mt-1.5 text-sm font-medium text-gray-500">
                  {unit.type}
                </p>
              </div>
              {unit.isDemo && (
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Demo unit
                </span>
              )}
            </div>

            {unit.address && (
              <div className="mt-6 flex items-start gap-2 text-sm font-medium text-gray-600">
                <HugeiconsIcon
                  icon={Location01Icon}
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 text-gray-400 shrink-0"
                />
                <span>{unit.address}</span>
              </div>
            )}

            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-3">
                Status
              </p>
              <UnitStatusSwitcher
                unitId={id}
                current={unit.status}
                blockedStatuses={openCleaning ? ["ready"] : []}
                blockedReason={`${unit.name} has an open cleaning job. Complete it before marking the unit Ready.`}
              />
              <p className="mt-3 text-[11px] font-medium text-gray-400">
                Last changed {formatRelative(new Date(unit.lastStatusChangeAt))}
              </p>
            </div>
          </section>

          {/* Activity timeline */}
          <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900">
                Activity
              </h3>
              <span className="text-[11px] font-medium text-gray-400">
                {timeline.length} {timeline.length === 1 ? "event" : "events"}
              </span>
            </div>
            {timeline.length === 0 ? (
              <div className="text-sm font-medium text-gray-500">
                Nothing happened yet. As you flip statuses, log payouts, and
                edit this unit, the events will land here.
              </div>
            ) : (
              <ul className="flex flex-col">
                {timeline.map((item, i) => (
                  <li
                    key={`${item.kind}:${item.id}`}
                    className="flex items-start gap-4 py-3.5 border-b border-gray-100 last:border-b-0"
                  >
                    <span
                      className={
                        i === 0
                          ? "mt-1 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 shrink-0"
                          : "mt-1 flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-gray-500 shrink-0"
                      }
                    >
                      <HugeiconsIcon
                        icon={
                          item.kind === "payout"
                            ? MoneyBag01Icon
                            : item.kind === "work_order"
                              ? WorkHistoryIcon
                              : Clock01Icon
                        }
                        size={13}
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold tracking-tight text-zinc-900">
                        {item.kind === "payout"
                          ? `${item.payout.vendorName} ${item.payout.status} payout ${formatAmount(item.payout.amountCents)}`
                          : item.kind === "work_order"
                            ? `${item.workOrder.title} ${item.workOrder.status} (${formatWorkOrderType(item.workOrder.type)})`
                            : item.summary}
                      </div>
                      <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                        {formatRelative(item.occurredAt)} &middot;{" "}
                        {formatDateTime(item.occurredAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: details + danger zone */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {showProfit && (
            <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col gap-4">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Net profit
                  </p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                    Last 30 days
                  </p>
                </div>
                <span
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl",
                    netProfitCents < 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  <HugeiconsIcon
                    icon={MoneyBag01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                </span>
              </header>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight leading-none",
                  netProfitCents < 0 ? "text-rose-700" : "text-zinc-900",
                )}
              >
                {formatNet(netProfitCents)}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <ProfitRow
                  label="Revenue"
                  value={formatUnsignedAmount(monthlyRevenueCents)}
                  sub="per month"
                  positive
                />
                <ProfitRow
                  label="Costs"
                  value={
                    periodCostsCents > 0
                      ? `−${formatRevenue(periodCostsCents)}`
                      : "$0"
                  }
                  sub="last 30 days"
                  negative
                />
              </div>
            </section>
          )}

          <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">
                Monthly revenue
              </p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900">
                {formatRevenue(unit.monthlyRevenueCents)}
                {typeof unit.monthlyRevenueCents === "number" && (
                  <span className="ml-1 text-xs font-medium text-gray-400">
                    /mo
                  </span>
                )}
              </p>
            </div>
            <div className="border-t border-gray-100" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">
                Created
              </p>
              <p className="text-sm font-medium text-zinc-700">
                {formatDateTime(new Date(unit.createdAt))}
              </p>
            </div>
            {unit.notes && (
              <>
                <div className="border-t border-gray-100" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2 inline-flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Note01Icon}
                      size={11}
                      strokeWidth={2}
                    />
                    Notes
                  </p>
                  <p className="text-sm font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {unit.notes}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Danger zone */}
          <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
              Danger zone
            </h3>
            <p className="text-xs font-medium text-gray-500 leading-relaxed">
              Archives the unit and hides it from your portfolio. History is
              kept and can be restored later.
            </p>
            <DeleteUnitButton unitId={id} unitName={unit.name} />
          </section>
        </div>
      </div>
    </>
  );
}

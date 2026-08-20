import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Building01Icon,
  Calendar03Icon,
  MoneyBag01Icon,
  UserMultipleIcon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { formatAmount } from "@/lib/payouts";
import {
  formatWorkOrderType,
  listWorkOrders,
  type WorkOrderDoc,
} from "@/lib/work-orders";
import { Topbar } from "@/components/dashboard/topbar";
import { buttonClasses } from "@/components/ui/button";
import { CompleteWorkOrderButton } from "@/components/dashboard/complete-work-order-button";
import { WorkOrderStatusPill } from "@/components/dashboard/work-order-status-pill";
import { cn } from "@/lib/utils";

function formatDate(d?: Date): string {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stats(workOrders: WorkOrderDoc[]) {
  const assigned = workOrders.filter((w) => w.status === "assigned").length;
  const completed = workOrders.filter((w) => w.status === "completed").length;
  const pendingCost = workOrders
    .filter((w) => w.status === "assigned")
    .reduce((sum, w) => sum + Math.abs(w.costCents), 0);
  return { assigned, completed, pendingCost };
}

export default async function WorkOrdersPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let workOrders: WorkOrderDoc[] = [];
  let error: string | null = null;

  try {
    workOrders = await listWorkOrders(ownerId, { limit: 200 });
  } catch (err) {
    console.error("[work orders page] read failed:", err);
    error = "We couldn't load work orders right now. Refresh in a moment.";
  }

  const s = stats(workOrders);

  return (
    <>
      <Topbar
        title="Work orders"
        user={{ name: session.name, email: session.email }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={WorkHistoryIcon}
          label="Assigned"
          value={String(s.assigned)}
          tone="amber"
        />
        <MetricCard
          icon={MoneyBag01Icon}
          label="Open cost"
          value={formatAmount(-s.pendingCost)}
          tone="ink"
        />
        <MetricCard
          icon={WorkHistoryIcon}
          label="Completed"
          value={String(s.completed)}
          tone="emerald"
        />
      </div>

      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Operations queue
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Assigned jobs, vendor costs, and completion status in one place.
            </p>
          </div>
          <Link
            href="/dashboard/work-orders/new"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
            New work order
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : workOrders.length === 0 ? (
          <div className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-10 text-center">
            <span className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
              <HugeiconsIcon
                icon={WorkHistoryIcon}
                size={24}
                strokeWidth={2}
              />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
              No work orders yet
            </h3>
            <p className="mt-2 text-sm font-medium text-gray-500 max-w-md mx-auto leading-relaxed">
              Create a cleaning or maintenance job to assign a vendor, track
              cost, and generate a payout when it is completed.
            </p>
            <Link
              href="/dashboard/work-orders/new"
              className={buttonClasses({
                variant: "primary",
                size: "md",
                className: "mt-6",
              })}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
              Create first work order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_110px_140px_120px] gap-4 rounded-xl bg-gray-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                <span>Job</span>
                <span>Unit</span>
                <span>Vendor</span>
                <span className="text-right">Cost</span>
                <span>Due</span>
                <span className="text-right">Action</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {workOrders.map((workOrder) => (
                  <li
                    key={workOrder._id.toString()}
                    className="grid grid-cols-[1.5fr_1fr_1fr_110px_140px_120px] gap-4 px-4 py-4 items-center hover:bg-gray-50/60 transition-colors rounded-xl"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                          {workOrder.title}
                        </span>
                        <WorkOrderStatusPill
                          status={workOrder.status}
                          className="shrink-0"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
                        {formatWorkOrderType(workOrder.type)}
                      </p>
                    </div>
                    <TableMeta icon={Building01Icon} label={workOrder.unitName} />
                    <TableMeta icon={UserMultipleIcon} label={workOrder.vendorName} />
                    <span className="text-right text-sm font-semibold tracking-tight text-zinc-900">
                      {formatAmount(-Math.abs(workOrder.costCents))}
                    </span>
                    <TableMeta icon={Calendar03Icon} label={formatDate(workOrder.dueAt)} />
                    <div className="flex justify-end">
                      {workOrder.status === "assigned" ? (
                        <CompleteWorkOrderButton
                          workOrderId={workOrder._id.toString()}
                          compact
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-400">
                          Done
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

const metricTones = {
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  ink: "bg-[#09090B] text-white",
};

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  label: string;
  value: string;
  tone: keyof typeof metricTones;
}) {
  return (
    <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
      <span
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl mb-4",
          metricTones[tone],
        )}
      >
        <HugeiconsIcon icon={icon} size={18} strokeWidth={2} />
      </span>
      <div className="text-3xl font-semibold tracking-tight text-zinc-900 leading-none">
        {value}
      </div>
      <div className="text-sm font-semibold tracking-tight text-zinc-700 mt-2">
        {label}
      </div>
    </div>
  );
}

function TableMeta({
  icon,
  label,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
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

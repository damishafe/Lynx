import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  FilterIcon,
  UnfoldMoreIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import {
  formatAmount,
  formatDate,
  type PayoutDoc,
} from "@/lib/payouts";
import { StatusPill } from "./status-pill";

const toneStyles = {
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
  ink: "bg-zinc-900 text-white",
};

const columns = [
  { key: "vendor", label: "Vendor", sortable: true, width: "flex-1 min-w-0" },
  { key: "date", label: "Date", sortable: true, width: "w-44 hidden md:flex" },
  { key: "amount", label: "Amount", sortable: true, width: "w-32 hidden sm:flex justify-end" },
  { key: "status", label: "Status", sortable: false, width: "w-32 hidden sm:flex" },
];

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

export function ActivityTable({ payouts }: { payouts: PayoutDoc[] }) {
  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          Activity
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            className="cursor-pointer flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:bg-gray-50 hover:text-zinc-900 transition-colors"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-gray-50 transition-colors"
          >
            Filters
            <HugeiconsIcon
              icon={FilterIcon}
              size={12}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-gray-50/70 mb-1.5">
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            disabled={!col.sortable}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500",
              col.sortable && "cursor-pointer hover:text-zinc-700",
              col.width,
            )}
          >
            {col.label}
            {col.sortable && (
              <HugeiconsIcon
                icon={UnfoldMoreIcon}
                size={11}
                strokeWidth={2.2}
              />
            )}
          </button>
        ))}
        <span className="w-8" aria-hidden />
      </div>

      {/* Rows */}
      {payouts.length === 0 ? (
        <div className="rounded-2xl bg-gray-50/70 border border-gray-100 p-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            No payouts yet. Vendor payments will land here as soon as they are logged.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
        {payouts.map((p) => (
          <li
            key={p._id.toString()}
            className="flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-gray-50/60 transition-colors group"
          >
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-2xl text-sm font-semibold shrink-0",
                  toneStyles[toneForName(p.vendorName)],
                )}
              >
                {initialsForName(p.vendorName)}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                  {p.vendorName}
                </div>
                <div className="text-[11px] font-medium text-gray-500 truncate">
                  {p.category}
                </div>
              </div>
            </div>
            <div className="w-44 hidden md:flex text-sm font-medium text-gray-500">
              {formatDate(new Date(p.occurredAt))}
            </div>
            <div
              className={cn(
                "w-auto sm:w-32 flex justify-end text-sm font-semibold tracking-tight tabular-nums",
                p.amountCents < 0 ? "text-zinc-900" : "text-emerald-600",
                p.status === "failed" && "text-rose-600",
              )}
            >
              {formatAmount(p.amountCents)}
            </div>
            <div className="w-32 hidden sm:flex">
              <StatusPill status={p.status} />
            </div>
            <button
              type="button"
              aria-label="Row options"
              className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-white hover:text-zinc-700 transition-colors"
            >
              <HugeiconsIcon
                icon={MoreVerticalIcon}
                size={14}
                strokeWidth={2}
              />
            </button>
          </li>
        ))}
        </ul>
      )}
    </section>
  );
}

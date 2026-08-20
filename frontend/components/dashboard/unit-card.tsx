import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { UnitDoc } from "@/lib/units";
import { UnitStatusPill } from "./unit-status-pill";

const toneByStatus: Record<UnitDoc["status"], string> = {
  ready: "from-emerald-100/70 to-emerald-50/0",
  occupied: "from-amber-100/70 to-amber-50/0",
  needs_cleaning: "from-sky-100/70 to-sky-50/0",
  maintenance: "from-rose-100/70 to-rose-50/0",
};

function formatRevenue(cents?: number): string | null {
  if (typeof cents !== "number") return null;
  return `$${(cents / 100).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export function UnitCard({ unit }: { unit: UnitDoc }) {
  const id = unit._id.toString();
  const revenue = formatRevenue(unit.monthlyRevenueCents);
  return (
    <Link
      href={`/dashboard/units/${id}`}
      className={cn(
        "group cursor-pointer relative flex flex-col overflow-hidden",
        "rounded-[1.75rem] bg-white border border-gray-100",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]",
        "transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        "hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_14px_36px_-10px_rgba(0,0,0,0.08)]",
      )}
    >
      {/* Status-tinted hero strip */}
      <div className="relative h-28 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            toneByStatus[unit.status],
          )}
        />
        <div className="absolute top-4 left-4">
          <UnitStatusPill status={unit.status} variant="dot" size="sm" />
        </div>
        {unit.isDemo && (
          <div className="absolute top-4 right-4 inline-flex items-center rounded-full bg-white/80 backdrop-blur border border-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Demo
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 p-5">
        <div>
          <div className="text-base font-semibold tracking-tight text-zinc-900 truncate">
            {unit.name}
          </div>
          <div className="text-[11px] font-medium tracking-tight text-gray-500 mt-0.5 truncate">
            {unit.type}
          </div>
        </div>

        {unit.address && (
          <div className="flex items-start gap-1.5 text-xs text-gray-500 font-medium leading-snug min-h-[1.25rem]">
            <HugeiconsIcon
              icon={Location01Icon}
              size={12}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-gray-400"
            />
            <span className="line-clamp-2">{unit.address}</span>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight text-zinc-900">
            {revenue ?? "—"}
            {revenue && (
              <span className="ml-0.5 text-[11px] font-medium text-gray-400">
                /mo
              </span>
            )}
          </div>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={12}
              strokeWidth={2.4}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

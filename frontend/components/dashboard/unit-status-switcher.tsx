"use client";

import * as React from "react";
import { useOptimistic, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  UserIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { setUnitStatusAction } from "@/app/dashboard/units/actions";
import { UNIT_STATUSES, type UnitStatus } from "@/lib/unit-status";

const config: Record<
  UnitStatus,
  {
    label: string;
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
    active: string;
    inactive: string;
  }
> = {
  ready: {
    label: "Ready",
    icon: CheckmarkCircle01Icon,
    active:
      "bg-emerald-500 text-white border-emerald-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(16,185,129,0.55)]",
    inactive:
      "bg-emerald-50 text-emerald-700 border-emerald-100/70 hover:bg-emerald-100/60",
  },
  occupied: {
    label: "Occupied",
    icon: UserIcon,
    active:
      "bg-amber-500 text-white border-amber-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(245,158,11,0.55)]",
    inactive:
      "bg-amber-50 text-amber-700 border-amber-100/70 hover:bg-amber-100/60",
  },
  maintenance: {
    label: "Maintenance",
    icon: Settings01Icon,
    active:
      "bg-rose-500 text-white border-rose-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(244,63,94,0.55)]",
    inactive:
      "bg-rose-50 text-rose-700 border-rose-100/70 hover:bg-rose-100/60",
  },
};

export function UnitStatusSwitcher({
  unitId,
  current,
}: {
  unitId: string;
  current: UnitStatus;
}) {
  const [optimistic, setOptimistic] = useOptimistic(
    current,
    (_state: UnitStatus, next: UnitStatus) => next,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onPick = (next: UnitStatus) => {
    if (next === optimistic) return;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const res = await setUnitStatusAction(unitId, next);
      if (res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {UNIT_STATUSES.map((s) => {
          const c = config[s];
          const active = optimistic === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              aria-pressed={active}
              className={cn(
                "cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200",
                active ? c.active : c.inactive,
              )}
            >
              <HugeiconsIcon icon={c.icon} size={14} strokeWidth={2.2} />
              {c.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-100/60 px-3 py-2 text-xs font-medium text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

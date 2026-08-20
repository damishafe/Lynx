"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { UNIT_STATUSES, type UnitStatus } from "@/lib/unit-status";

const statusLabels: Record<UnitStatus, string> = {
  ready: "Ready",
  occupied: "Occupied",
  needs_cleaning: "Needs cleaning",
  maintenance: "Maintenance",
};

const statusTones: Record<UnitStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
  occupied: "bg-amber-50 text-amber-700 border-amber-100/70",
  needs_cleaning: "bg-sky-50 text-sky-700 border-sky-100/70",
  maintenance: "bg-rose-50 text-rose-700 border-rose-100/70",
};

export function UnitsToolbar({
  counts,
}: {
  counts: {
    total: number;
    ready: number;
    occupied: number;
    needs_cleaning: number;
    maintenance: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/units";
  const params = useSearchParams();
  const currentStatus = (params.get("status") as UnitStatus | null) ?? null;
  const currentQ = params.get("q") ?? "";
  const [q, setQ] = React.useState(currentQ);

  // Push search to URL with debounce
  React.useEffect(() => {
    if (q === currentQ) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setStatus = (s: UnitStatus | null) => {
    const next = new URLSearchParams(params.toString());
    if (s) next.set("status", s);
    else next.delete("status");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          strokeWidth={2}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search units by name, type, or address"
          className={cn(
            "w-full h-11 pl-11 pr-4 rounded-full bg-gray-50/70 border border-gray-100",
            "text-sm font-medium text-zinc-900 placeholder:text-gray-400",
            "outline-none focus:bg-white focus:border-zinc-300 transition-colors",
          )}
        />
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
        <FilterPill
          active={!currentStatus}
          onClick={() => setStatus(null)}
          label="All"
          count={counts.total}
        />
        {UNIT_STATUSES.map((s) => (
          <FilterPill
            key={s}
            active={currentStatus === s}
            onClick={() => setStatus(s)}
            label={statusLabels[s]}
            count={counts[s]}
            tone={statusTones[s]}
          />
        ))}
      </div>

      <Link
        href="/dashboard/units/new"
        className={buttonClasses({ variant: "primary", size: "md" })}
      >
        <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
        Add unit
      </Link>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200",
        active
          ? "bg-[#09090B] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_4px_14px_-4px_rgba(0,0,0,0.4)]"
          : tone
            ? `${tone} border hover:brightness-95`
            : "bg-gray-50 text-zinc-700 border border-gray-100 hover:bg-gray-100",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold",
          active ? "bg-white/15 text-white" : "bg-white/70 text-zinc-700",
        )}
      >
        {count}
      </span>
    </button>
  );
}

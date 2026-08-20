"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UNIT_STATUSES, type UnitStatus } from "@/lib/unit-status";
import { createUnitAction, type CreateUnitState } from "../actions";

const initialState: CreateUnitState = {};

const statusLabels: Record<UnitStatus, string> = {
  ready: "Ready",
  occupied: "Occupied",
  maintenance: "Maintenance",
};

const statusStyles: Record<UnitStatus, { active: string; inactive: string }> = {
  ready: {
    active:
      "bg-emerald-500 text-white border-emerald-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(16,185,129,0.55)]",
    inactive:
      "bg-emerald-50 text-emerald-700 border-emerald-100/70 hover:bg-emerald-100/60",
  },
  occupied: {
    active:
      "bg-amber-500 text-white border-amber-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(245,158,11,0.55)]",
    inactive:
      "bg-amber-50 text-amber-700 border-amber-100/70 hover:bg-amber-100/60",
  },
  maintenance: {
    active:
      "bg-rose-500 text-white border-rose-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(244,63,94,0.55)]",
    inactive:
      "bg-rose-50 text-rose-700 border-rose-100/70 hover:bg-rose-100/60",
  },
};

const TYPE_SUGGESTIONS = [
  "Short-term rental",
  "Long-term rental",
  "Hotel room",
  "Coworking suite",
  "Retail store",
  "Coffee shop",
  "Studio",
];

export function NewUnitForm() {
  const [state, formAction, pending] = useActionState(
    createUnitAction,
    initialState,
  );
  const [status, setStatus] = React.useState<UnitStatus>("ready");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="status" value={status} />

      {/* Identity */}
      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            What&apos;s the unit?
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Give it a name you&apos;ll recognize at a glance, and a type so you can
            filter later.
          </p>
        </div>
        <Input
          name="name"
          required
          autoFocus
          maxLength={80}
          label="Name"
          placeholder="e.g., Studio · Riverside"
        />
        <div className="flex flex-col gap-2">
          <Input
            name="type"
            required
            list="unit-type-suggestions"
            label="Type"
            placeholder="e.g., Short-term rental"
          />
          <datalist id="unit-type-suggestions">
            {TYPE_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Starting status
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            You can flip it any time from the unit page.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {UNIT_STATUSES.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "cursor-pointer rounded-2xl border px-4 py-4 text-sm font-semibold tracking-tight transition-all duration-200",
                  active ? statusStyles[s].active : statusStyles[s].inactive,
                )}
                aria-pressed={active}
              >
                {statusLabels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Details
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            All optional — fill what you have and add the rest later.
          </p>
        </div>
        <Input
          name="address"
          label="Address"
          placeholder="Street, city, region"
        />
        <Input
          name="monthlyRevenue"
          type="text"
          inputMode="decimal"
          label="Monthly revenue (USD)"
          placeholder="e.g., 2,850"
          hint="Used for your portfolio totals. You can always edit later."
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="notes"
            className="text-[11px] font-medium tracking-tight text-gray-500"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="Anything that matters about this unit"
            className={cn(
              "w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm font-medium text-zinc-900",
              "placeholder:text-gray-400 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)]",
              "outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-colors",
            )}
          />
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending}
          className="min-w-[12rem]"
        >
          {pending ? "Saving…" : "Add unit"}
          {!pending && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={2}
            />
          )}
        </Button>
        <Link
          href="/dashboard/units"
          className="text-sm font-medium text-gray-500 hover:text-zinc-900 px-3 py-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

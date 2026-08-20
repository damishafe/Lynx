"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createWorkOrderAction,
  type CreateWorkOrderState,
} from "../actions";

type Option = {
  id: string;
  label: string;
  sub?: string;
};

const initialState: CreateWorkOrderState = {};

const types = [
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "repair", label: "Repair" },
  { value: "other", label: "Other" },
];

export function NewWorkOrderForm({
  units,
  vendors,
}: {
  units: Option[];
  vendors: Option[];
}) {
  const [state, formAction, pending] = useActionState(
    createWorkOrderAction,
    initialState,
  );
  const missingData = units.length === 0 || vendors.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {missingData && (
        <div className="rounded-[2rem] bg-amber-50 border border-amber-100/70 p-5 text-sm font-medium text-amber-800">
          Add at least one unit and one vendor before creating work orders.
        </div>
      )}

      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Assignment
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Pick the unit, vendor, and job type. The queue stays readable even
            as the portfolio grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Unit" name="unitId" options={units} />
          <SelectField label="Vendor" name="vendorId" options={vendors} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="type"
            className="text-[11px] font-medium tracking-tight text-gray-500"
          >
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue="cleaning"
            className={selectClasses}
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Job details
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Costs become vendor payouts when the job is marked complete.
          </p>
        </div>

        <Input
          name="title"
          required
          maxLength={100}
          label="Title"
          placeholder="e.g., Turnover clean after checkout"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="cost"
            required
            inputMode="decimal"
            label="Cost (USD)"
            placeholder="85"
          />
          <Input
            name="dueAt"
            type="date"
            label="Due date"
          />
        </div>

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
            placeholder="Door code, checklist, or special instructions"
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
          disabled={pending || missingData}
          className="min-w-[13rem]"
        >
          {pending ? "Creating..." : "Create work order"}
          {!pending && (
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          )}
        </Button>
        <Link
          href="/dashboard/work-orders"
          className="text-sm font-medium text-gray-500 hover:text-zinc-900 px-3 py-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const selectClasses = cn(
  "h-12 rounded-2xl bg-white border border-gray-200 px-4 text-sm font-medium text-zinc-900",
  "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)] outline-none",
  "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
);

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Option[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[11px] font-medium tracking-tight text-gray-500"
      >
        {label}
      </label>
      <select id={name} name={name} className={selectClasses} required>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.sub ? `${option.label} - ${option.sub}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createVendorAction, type CreateVendorState } from "../actions";

const initialState: CreateVendorState = {};

const roles = [
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
];

export function NewVendorForm() {
  const [state, formAction, pending] = useActionState(
    createVendorAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Who gets paid?
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Add cleaners, maintenance teams, suppliers, or software vendors.
          </p>
        </div>
        <Input
          name="name"
          required
          autoFocus
          maxLength={80}
          label="Vendor name"
          placeholder="e.g., BrightTurn Cleaning"
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="role"
            className="text-[11px] font-medium tracking-tight text-gray-500"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="cleaning"
            className={cn(
              "h-12 rounded-2xl bg-white border border-gray-200 px-4 text-sm font-medium text-zinc-900",
              "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)] outline-none",
              "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
            )}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Contact details
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Optional for now, useful once vendor assignments go live.
          </p>
        </div>
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="vendor@example.com"
        />
        <Input
          name="phone"
          type="tel"
          label="Phone"
          placeholder="+1 555 0147"
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
            placeholder="Preferred rate, coverage area, or payout notes"
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
          {pending ? "Saving..." : "Add vendor"}
          {!pending && (
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          )}
        </Button>
        <Link
          href="/dashboard/vendors"
          className="text-sm font-medium text-gray-500 hover:text-zinc-900 px-3 py-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createBookingAction, type CreateBookingState } from "../actions";

type Option = { id: string; label: string };

const initialState: CreateBookingState = {};

function isoToday(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function NewBookingForm({ units }: { units: Option[] }) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);
  const noUnits = units.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {noUnits && (
        <div className="rounded-[2rem] bg-amber-50 border border-amber-100/70 p-5 text-sm font-medium text-amber-800">
          Add a unit before creating bookings.
        </div>
      )}

      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Reservation</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Creating a booking marks the unit occupied and recognises the revenue.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="unitId" className="text-[11px] font-medium tracking-tight text-gray-500">
            Unit
          </label>
          <select
            id="unitId"
            name="unitId"
            required
            className={cn(
              "h-12 rounded-2xl bg-white border border-gray-200 px-4 text-sm font-medium text-zinc-900",
              "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)] outline-none",
              "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
            )}
          >
            <option value="">Select unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <Input name="guestName" required maxLength={80} label="Guest name" placeholder="Sarah Johnson" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="checkIn" type="date" required label="Check-in" defaultValue={isoToday(0)} />
          <Input name="checkOut" type="date" required label="Check-out" defaultValue={isoToday(3)} />
        </div>

        <Input
          name="amount"
          required
          inputMode="decimal"
          label="Booking value (USD)"
          placeholder="1000"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={pending || noUnits} className="min-w-[13rem]">
          {pending ? "Creating..." : "Create booking"}
          {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />}
        </Button>
        <Link href="/dashboard/bookings" className="text-sm font-medium text-gray-500 hover:text-zinc-900 px-3 py-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}

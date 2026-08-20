"use client";

import * as React from "react";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { checkoutBookingAction } from "@/app/dashboard/bookings/actions";
import { cn } from "@/lib/utils";

export function CheckoutBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await checkoutBookingAction(bookingId);
            if (res.error) setError(res.error);
          });
        }}
        className={cn(
          "cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-[#09090B] text-white font-medium h-9 px-3 text-xs",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_20px_-8px_rgba(0,0,0,0.45)] hover:bg-zinc-800 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {pending ? "Checking out" : "Check out"}
        {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.2} />}
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

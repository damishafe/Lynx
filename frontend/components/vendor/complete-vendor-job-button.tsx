"use client";

import * as React from "react";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

import { completeVendorJobAction } from "@/app/vendor/[id]/actions";

export function CompleteVendorJobButton({
  vendorId,
  workOrderId,
}: {
  vendorId: string;
  workOrderId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await completeVendorJobAction(vendorId, workOrderId);
            if (res.error) setError(res.error);
          });
        }}
        className="cursor-pointer h-12 rounded-full bg-[#09090B] text-white inline-flex items-center justify-center gap-2 text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_20px_-8px_rgba(0,0,0,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2.2} />
        {pending ? "Completing..." : "Mark complete"}
      </button>
      {error && (
        <p className="text-xs font-medium text-rose-600 text-center">{error}</p>
      )}
    </div>
  );
}

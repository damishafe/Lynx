"use client";

import * as React from "react";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

import { completeWorkOrderAction } from "@/app/dashboard/work-orders/actions";
import { cn } from "@/lib/utils";

export function CompleteWorkOrderButton({
  workOrderId,
  compact = false,
}: {
  workOrderId: string;
  compact?: boolean;
}) {
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
            const res = await completeWorkOrderAction(workOrderId);
            if (res.error) setError(res.error);
          });
        }}
        className={cn(
          "cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-[#09090B] text-white font-medium",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_20px_-8px_rgba(0,0,0,0.45)] hover:bg-zinc-800 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm",
        )}
      >
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} strokeWidth={2.2} />
        {pending ? "Completing" : "Complete"}
      </button>
      {error && (
        <p className="max-w-44 text-right text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

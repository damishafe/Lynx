"use client";

import * as React from "react";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { deleteUnitAction } from "@/app/dashboard/units/actions";

export function DeleteUnitButton({
  unitId,
  unitName,
}: {
  unitId: string;
  unitName: string;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = useTransition();

  React.useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  const onClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(() => {
      deleteUnitAction(unitId);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "cursor-pointer inline-flex items-center gap-2 rounded-full border px-4 h-10 text-sm font-medium transition-all duration-200",
        confirming
          ? "bg-rose-500 text-white border-rose-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_20px_-8px_rgba(244,63,94,0.55)]"
          : "bg-white text-zinc-700 border-gray-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
      {pending
        ? "Archiving…"
        : confirming
          ? `Confirm: archive ${unitName}`
          : "Archive unit"}
    </button>
  );
}

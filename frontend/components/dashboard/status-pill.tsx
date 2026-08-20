import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { PayoutStatus } from "@/lib/payouts";

const config: Record<
  PayoutStatus,
  {
    label: string;
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
    classes: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: CheckmarkCircle01Icon,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
  },
  failed: {
    label: "Failed",
    icon: Cancel01Icon,
    classes: "bg-rose-50 text-rose-700 border-rose-100/70",
  },
  pending: {
    label: "Pending",
    icon: Clock01Icon,
    classes: "bg-amber-50 text-amber-700 border-amber-100/70",
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: PayoutStatus;
  className?: string;
}) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-tight",
        c.classes,
        className,
      )}
    >
      <HugeiconsIcon icon={c.icon} size={13} strokeWidth={2.2} />
      {c.label}
    </span>
  );
}

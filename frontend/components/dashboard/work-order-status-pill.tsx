import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/lib/work-orders";

const config: Record<
  WorkOrderStatus,
  {
    label: string;
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
    classes: string;
  }
> = {
  assigned: {
    label: "Assigned",
    icon: Clock01Icon,
    classes: "bg-amber-50 text-amber-700 border-amber-100/70",
  },
  completed: {
    label: "Completed",
    icon: CheckmarkCircle01Icon,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
  },
  cancelled: {
    label: "Cancelled",
    icon: Cancel01Icon,
    classes: "bg-gray-50 text-gray-600 border-gray-100",
  },
};

export function WorkOrderStatusPill({
  status,
  className,
}: {
  status: WorkOrderStatus;
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

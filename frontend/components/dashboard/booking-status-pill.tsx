import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/bookings";

const config: Record<
  BookingStatus,
  { label: string; icon: Parameters<typeof HugeiconsIcon>[0]["icon"]; classes: string }
> = {
  upcoming: {
    label: "Upcoming",
    icon: Calendar03Icon,
    classes: "bg-violet-50 text-violet-700 border-violet-100/70",
  },
  checked_in: {
    label: "Checked in",
    icon: UserIcon,
    classes: "bg-amber-50 text-amber-700 border-amber-100/70",
  },
  checked_out: {
    label: "Checked out",
    icon: CheckmarkCircle01Icon,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
  },
};

export function BookingStatusPill({
  status,
  className,
}: {
  status: BookingStatus;
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

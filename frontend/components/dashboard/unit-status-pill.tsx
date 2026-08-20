import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  UserIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { UnitStatus } from "@/lib/unit-status";

const config: Record<
  UnitStatus,
  {
    label: string;
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
    classes: string;
    dotClass: string;
  }
> = {
  ready: {
    label: "Ready",
    icon: CheckmarkCircle01Icon,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
    dotClass: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    icon: UserIcon,
    classes: "bg-amber-50 text-amber-700 border-amber-100/70",
    dotClass: "bg-amber-500",
  },
  maintenance: {
    label: "Maintenance",
    icon: Settings01Icon,
    classes: "bg-rose-50 text-rose-700 border-rose-100/70",
    dotClass: "bg-rose-500",
  },
};

type Size = "sm" | "md" | "lg";
type Variant = "icon" | "dot";

const sizeStyles: Record<Size, string> = {
  sm: "px-2.5 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
  lg: "px-3.5 py-1.5 text-sm",
};

const iconSizes: Record<Size, number> = {
  sm: 12,
  md: 13,
  lg: 14,
};

export function UnitStatusPill({
  status,
  size = "md",
  variant = "icon",
  className,
}: {
  status: UnitStatus;
  size?: Size;
  variant?: Variant;
  className?: string;
}) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight",
        sizeStyles[size],
        c.classes,
        className,
      )}
    >
      {variant === "dot" ? (
        <span className={cn("w-1.5 h-1.5 rounded-full", c.dotClass)} />
      ) : (
        <HugeiconsIcon icon={c.icon} size={iconSizes[size]} strokeWidth={2.2} />
      )}
      {c.label}
    </span>
  );
}

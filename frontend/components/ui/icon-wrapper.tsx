import * as React from "react";
import { cn } from "@/lib/utils";

type IconWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
  tone?: "neutral" | "emerald" | "violet" | "amber" | "rose" | "sky" | "ink";
};

const sizeStyles = {
  sm: "w-9 h-9 rounded-[0.75rem]",
  md: "w-12 h-12 rounded-[1rem]",
  lg: "w-14 h-14 rounded-[1.25rem]",
};

const toneStyles = {
  neutral: "bg-gray-50 text-zinc-900",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
  ink: "bg-[#09090B] text-white",
};

const IconWrapper = React.forwardRef<HTMLDivElement, IconWrapperProps>(
  ({ className, size = "md", tone = "neutral", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center shrink-0",
        sizeStyles[size],
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  ),
);
IconWrapper.displayName = "IconWrapper";

export { IconWrapper };

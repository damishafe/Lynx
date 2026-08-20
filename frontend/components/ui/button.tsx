import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-[#09090B] text-white",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_1px_2px_0_rgba(0,0,0,0.18),0_8px_20px_-8px_rgba(0,0,0,0.45)]",
    "hover:bg-zinc-800",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_2px_4px_0_rgba(0,0,0,0.22),0_14px_30px_-10px_rgba(0,0,0,0.55)]",
    "active:translate-y-[0.5px] active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_1px_0_rgba(0,0,0,0.2)]",
  ),
  secondary: cn(
    "bg-white text-zinc-900",
    "border border-gray-200/80",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_1px_2px_0_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.06)]",
    "hover:bg-gray-50 hover:border-gray-300/70",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_4px_0_rgba(0,0,0,0.06),0_8px_18px_-6px_rgba(0,0,0,0.10)]",
    "active:translate-y-[0.5px]",
  ),
  ghost: cn(
    "text-zinc-700 hover:text-zinc-900 hover:bg-gray-100/70",
    "active:translate-y-[0.5px]",
  ),
  accent: cn(
    "bg-[#F97316] text-white",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_2px_0_rgba(180,55,0,0.25),0_10px_24px_-8px_rgba(249,115,22,0.55)]",
    "hover:bg-[#EA580C]",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_2px_4px_0_rgba(180,55,0,0.3),0_14px_32px_-10px_rgba(249,115,22,0.65)]",
    "active:translate-y-[0.5px]",
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

const baseStyles = cn(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium cursor-pointer select-none",
  "transition-[background-color,box-shadow,transform,border-color,color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none",
  "focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:ring-offset-2",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button };

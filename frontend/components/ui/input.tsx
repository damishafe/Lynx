"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  trailing?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, trailing, id, type = "text", ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? `input-${reactId}`;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium tracking-tight text-gray-500"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "w-full h-12 rounded-2xl bg-white border border-gray-200 px-4 text-sm font-medium text-zinc-900",
              "placeholder:text-gray-400",
              "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)]",
              "transition-colors duration-150",
              "outline-none",
              "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              trailing && "pr-12",
              className,
            )}
            {...props}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              {trailing}
            </div>
          )}
        </div>
        {hint && (
          <p className="text-[11px] font-medium text-gray-500">{hint}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };

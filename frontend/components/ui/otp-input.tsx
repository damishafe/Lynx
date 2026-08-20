"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  /** Number of digits. Default 6. */
  length?: number;
  /** Hidden form field name (combined value). */
  name?: string;
  /** Called whenever the value changes. */
  onChange?: (value: string) => void;
  /** Disable when pending. */
  disabled?: boolean;
  /** Auto-focus the first box on mount. */
  autoFocus?: boolean;
  className?: string;
  /** Error styling toggle. */
  invalid?: boolean;
};

export function OtpInput({
  length = 6,
  name = "code",
  onChange,
  disabled,
  autoFocus = true,
  className,
  invalid,
}: OtpInputProps) {
  const [digits, setDigits] = React.useState<string[]>(() =>
    Array.from({ length }, () => ""),
  );
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const value = digits.join("");

  React.useEffect(() => {
    onChange?.(value);
  }, [value, onChange]);

  React.useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (idx: number, v: string) => {
    setDigits((d) => {
      const next = [...d];
      next[idx] = v;
      return next;
    });
  };

  const handleChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setAt(idx, "");
      return;
    }
    if (cleaned.length === 1) {
      setAt(idx, cleaned);
      // advance to next box
      if (idx < length - 1) refs.current[idx + 1]?.focus();
    } else {
      // user typed/pasted multiple chars into one box — distribute
      const chars = cleaned.slice(0, length - idx).split("");
      setDigits((d) => {
        const next = [...d];
        chars.forEach((c, i) => (next[idx + i] = c));
        return next;
      });
      const last = Math.min(idx + chars.length, length - 1);
      refs.current[last]?.focus();
    }
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setAt(idx, "");
      } else if (idx > 0) {
        setAt(idx - 1, "");
        refs.current[idx - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (
    idx: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const chars = text.slice(0, length - idx).split("");
    setDigits((d) => {
      const next = [...d];
      chars.forEach((c, i) => (next[idx + i] = c));
      return next;
    });
    const last = Math.min(idx + chars.length, length - 1);
    refs.current[last]?.focus();
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-2 sm:gap-3 justify-between">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "w-11 h-14 sm:w-12 sm:h-16 rounded-2xl bg-white border text-center text-2xl font-semibold tracking-tight text-zinc-900",
              "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)]",
              "outline-none transition-colors duration-150",
              "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              invalid
                ? "border-rose-300 ring-2 ring-rose-100"
                : "border-gray-200",
            )}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

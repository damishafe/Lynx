"use client";

import * as React from "react";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { startSubscriptionAction } from "./actions";

export function SubscribeButton({
  disabled,
  children,
  className,
}: {
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const onClick = () => {
    if (pending || disabled) return;
    setError(null);
    startTransition(async () => {
      const result = await startSubscriptionAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.url) {
        setError("Stripe didn't return a checkout URL.");
        return;
      }
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = result.url;
          return;
        }
      } catch {
        // top is cross-origin and locked down; fall through.
      }
      window.location.href = result.url;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || disabled}
        className={cn(
          "cursor-pointer inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
          "bg-[#09090B] text-white px-6 h-12 text-sm",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_20px_-8px_rgba(0,0,0,0.45)]",
          "hover:bg-zinc-800",
          "active:translate-y-[0.5px]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
      >
        {pending ? "Opening Stripe…" : (children ?? "Upgrade to Pro")}
        {!pending && (
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.2} />
        )}
      </button>
      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2 text-xs font-medium text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

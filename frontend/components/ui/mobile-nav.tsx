"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { buttonClasses } from "./button";

type Item = { label: string; href: string; active?: boolean };

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = React.useState(false);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="cursor-pointer md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_1px_2px_0_rgba(0,0,0,0.04)] hover:bg-gray-50 transition-colors"
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={2} />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={cn(
          "fixed top-3 right-3 bottom-3 z-50 w-[min(22rem,calc(100vw-1.5rem))]",
          "rounded-[2rem] bg-white border border-gray-100 p-6",
          "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]",
          "flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:hidden",
          open
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-4 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-zinc-700 hover:bg-gray-100 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.2} />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "cursor-pointer rounded-2xl px-4 py-3.5 text-base font-medium transition-colors",
                item.active
                  ? "bg-gray-50 text-zinc-900"
                  : "text-zinc-700 hover:bg-gray-50 hover:text-zinc-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-gray-100">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={buttonClasses({
              variant: "secondary",
              size: "md",
              className: "w-full",
            })}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className={buttonClasses({
              variant: "primary",
              size: "md",
              className: "w-full",
            })}
          >
            Sign up
          </Link>
        </div>
      </aside>
    </>
  );
}

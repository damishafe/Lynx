"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  CreditCardIcon,
  Logout02Icon,
  Settings01Icon,
  SparklesIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { logout } from "@/app/dashboard/actions";

type UserMenuProps = {
  name: string;
  email: string;
  role?: string;
  /** "pro" shows the Pro badge in the topbar pill + an upgrade CTA in the dropdown. */
  tier?: "free" | "pro";
};

export function UserMenu({
  name,
  email,
  role = "Operator",
  tier = "free",
}: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click + Esc
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "cursor-pointer inline-flex items-center gap-2.5 rounded-full bg-white border border-gray-100 pl-1 pr-3 py-1 transition-all duration-200",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]",
          "hover:bg-gray-50",
        )}
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#09090B] text-white text-xs font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
          <HugeiconsIcon icon={UserIcon} size={15} strokeWidth={2.2} />
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 max-w-[160px] truncate">
            {name}
          </span>
          <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-gray-400">
            {role}
          </span>
        </span>
        {tier === "pro" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
            <HugeiconsIcon icon={SparklesIcon} size={9} strokeWidth={2.4} />
            Pro
          </span>
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={14}
          strokeWidth={2}
          className={cn(
            "text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-[calc(100%+8px)] z-50 w-64",
            "rounded-2xl bg-white border border-gray-100 p-2",
            "shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)]",
            "animate-fade-up",
          )}
        >
          <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                {name}
              </div>
              {tier === "pro" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase shrink-0">
                  Pro
                </span>
              )}
            </div>
            <div className="text-[11px] font-medium text-gray-500 truncate">
              {email}
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="cursor-pointer w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-gray-50 hover:text-zinc-900 transition-colors"
          >
            <HugeiconsIcon
              icon={Settings01Icon}
              size={15}
              strokeWidth={2}
              className="text-gray-400"
            />
            Account settings
          </Link>
          <Link
            href="/dashboard/billing"
            onClick={() => setOpen(false)}
            className="cursor-pointer w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-gray-50 hover:text-zinc-900 transition-colors"
          >
            <HugeiconsIcon
              icon={CreditCardIcon}
              size={15}
              strokeWidth={2}
              className="text-gray-400"
            />
            {tier === "pro" ? "Manage subscription" : "Billing & plans"}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="cursor-pointer w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <HugeiconsIcon
                icon={Logout02Icon}
                size={15}
                strokeWidth={2}
              />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

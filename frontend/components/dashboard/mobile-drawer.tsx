"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isNavActive,
  type NavItem,
} from "./nav-items";

export function MobileNavDrawer() {
  const pathname = usePathname() ?? "/dashboard";
  const [open, setOpen] = React.useState(false);

  // Lock body scroll while drawer is open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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

  // Close when route changes (after navigation)
  React.useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="cursor-pointer lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors"
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={2} />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        className={cn(
          "fixed top-3 left-3 bottom-3 z-50 w-[min(20rem,calc(100vw-1.5rem))]",
          "rounded-[2rem] bg-white border border-gray-100 p-5",
          "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]",
          "flex flex-col gap-5 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:hidden",
          open
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-4 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="cursor-pointer inline-flex items-center gap-2.5"
            aria-label="Lynx home"
          >
            <Image
              src="/img/logo.png"
              alt=""
              width={32}
              height={32}
              className="rounded-[8px]"
              priority
            />
            <span className="text-base font-semibold tracking-tight text-zinc-900">
              Lynx
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="cursor-pointer inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 border border-gray-100 text-zinc-700 hover:bg-gray-100 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2.2} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <DrawerRow
              key={item.label}
              item={item}
              active={isNavActive(item, pathname)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-1">
          {SECONDARY_NAV.map((item) => (
            <DrawerRow
              key={item.label}
              item={item}
              active={isNavActive(item, pathname)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

function DrawerRow({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "cursor-pointer flex items-center gap-3 h-12 px-3 rounded-2xl text-sm font-semibold tracking-tight transition-colors",
        active
          ? "bg-emerald-400 text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_24px_-8px_rgba(16,185,129,0.55)]"
          : "text-zinc-700 hover:bg-gray-50 hover:text-zinc-900",
      )}
    >
      <span className="flex items-center justify-center w-6 h-6 shrink-0">
        <HugeiconsIcon icon={item.icon} size={18} strokeWidth={2} />
      </span>
      {item.label}
    </Link>
  );
}

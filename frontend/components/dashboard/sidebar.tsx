"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeft01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isNavActive,
  type NavItem,
} from "./nav-items";

const STORAGE_KEY = "lynx:sidebar-expanded";

function NavRow({
  item,
  active,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      aria-label={item.label}
      className={cn(
        "cursor-pointer relative flex items-center h-12 rounded-2xl",
        "transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        expanded ? "w-full px-3 gap-3" : "w-12 justify-center",
        active
          ? "bg-emerald-400 text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_24px_-8px_rgba(16,185,129,0.55)]"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-gray-50",
      )}
    >
      <span className="flex items-center justify-center w-6 h-6 shrink-0">
        <HugeiconsIcon icon={item.icon} size={20} strokeWidth={2} />
      </span>
      {expanded && (
        <span
          className={cn(
            "text-sm font-semibold tracking-tight whitespace-nowrap",
            active ? "text-zinc-900" : "text-zinc-700",
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname() ?? "/dashboard";
  const [expanded, setExpanded] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === "1") setExpanded(true);
      } catch {
        // ignore — private mode etc.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <aside
      data-expanded={expanded ? "true" : "false"}
      className={cn(
        // Hidden on small screens — the topbar exposes a drawer instead.
        "hidden lg:flex",
        "shrink-0 rounded-[2rem] bg-white border border-gray-100",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]",
        "py-6 px-4 flex-col justify-between",
        "sticky top-5 self-start h-[calc(100vh-2.5rem)]",
        "transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        hydrated ? "" : "transition-none",
        expanded ? "w-[240px]" : "w-[88px]",
      )}
      aria-label="Primary navigation"
    >
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard"
          className={cn(
            "cursor-pointer flex items-center h-12 rounded-2xl",
            expanded ? "px-3 gap-3" : "justify-center",
          )}
          aria-label="Lynx home"
        >
          <Image
            src="/img/logo.png"
            alt="Lynx"
            width={36}
            height={36}
            className="rounded-[10px] shrink-0"
            priority
          />
          {expanded && (
            <span className="text-base font-semibold tracking-tight text-zinc-900 whitespace-nowrap">
              Lynx
            </span>
          )}
        </Link>

        <nav className="flex flex-col gap-1.5">
          {PRIMARY_NAV.map((item) => (
            <NavRow
              key={item.label}
              item={item}
              active={isNavActive(item, pathname)}
              expanded={expanded}
            />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1.5">
        {SECONDARY_NAV.map((item) => (
          <NavRow
            key={item.label}
            item={item}
            active={isNavActive(item, pathname)}
            expanded={expanded}
          />
        ))}
        <button
          type="button"
          onClick={toggle}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={expanded}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "cursor-pointer mt-2 flex items-center h-10 rounded-2xl text-zinc-500",
            "hover:text-zinc-900 hover:bg-gray-50 transition-colors",
            expanded ? "w-full px-3 gap-3 justify-start" : "w-12 justify-center",
          )}
        >
          <span className="flex items-center justify-center w-6 h-6 shrink-0">
            <HugeiconsIcon
              icon={SidebarLeft01Icon}
              size={18}
              strokeWidth={2}
              className={cn(
                "transition-transform duration-300",
                expanded ? "" : "rotate-180",
              )}
            />
          </span>
          {expanded && (
            <span className="text-xs font-medium tracking-tight whitespace-nowrap text-gray-400">
              Collapse
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

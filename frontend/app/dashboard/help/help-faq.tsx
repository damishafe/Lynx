"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, MinusSignIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

const faqs: { q: string; a: string }[] = [
  {
    q: "What's a 'unit'?",
    a: "A unit is whatever the operational thing you're running is — a short-term rental, a hotel room, a coworking suite, a retail store, a coffee shop. Lynx is type-agnostic; you set the type label per unit.",
  },
  {
    q: "How does the vendor completion demo work?",
    a: "Create or open an assigned work order, then open that vendor's portal from Vendors. When the vendor taps Mark complete, the manager dashboard live-syncs: the job disappears from assigned work, the unit becomes Ready, and owed-to-vendors increases.",
  },
  {
    q: "What does Mark complete change?",
    a: "It completes the work order, creates a pending payout for the vendor, records activity, and flips the related unit to Ready.",
  },
  {
    q: "Does CSV export work?",
    a: "Yes. Reports downloads a CSV containing units, vendors, work orders, and payouts from your live account data.",
  },
  {
    q: "Can I delete the demo units?",
    a: "Yes. Open the unit, scroll to the danger zone, and archive it. Demo units are tagged so you can spot them at a glance.",
  },
  {
    q: "Is my data really mine?",
    a: "Yes. Account deletion in Settings wipes your account, units, vendors, work orders, payouts, and activity history.",
  },
  {
    q: "What integrations matter next?",
    a: "Stripe Connect is the natural next production integration for paying pending vendor balances. Airbnb or calendar sync can come after the operational loop is stable.",
  },
];

export function HelpFaq() {
  const [open, setOpen] = React.useState<number>(0);

  return (
    <ul className="flex flex-col gap-3">
      {faqs.map((item, i) => {
        const expanded = open === i;
        return (
          <li
            key={item.q}
            className={cn(
              "rounded-2xl border transition-all duration-300",
              expanded
                ? "bg-[#09090B] text-white border-white/5 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.3)]"
                : "bg-white text-zinc-900 border-gray-100",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(expanded ? -1 : i)}
              className={cn(
                "cursor-pointer w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors",
                expanded ? "" : "hover:bg-gray-50/70",
              )}
              aria-expanded={expanded}
            >
              <span className="text-sm sm:text-base font-semibold tracking-tight">
                {item.q}
              </span>
              <span
                className={cn(
                  "shrink-0 flex items-center justify-center w-7 h-7 rounded-full border",
                  expanded
                    ? "border-white/15 text-white"
                    : "border-gray-200 text-zinc-700",
                )}
              >
                <HugeiconsIcon
                  icon={expanded ? MinusSignIcon : PlusSignIcon}
                  size={13}
                  strokeWidth={2.5}
                />
              </span>
            </button>
            {expanded && (
              <div className="px-5 pb-5 -mt-1 text-sm font-medium leading-relaxed text-zinc-300 max-w-3xl">
                {item.a}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Shield01Icon,
  HeadsetIcon,
  JusticeScale01Icon,
  CreditCardIcon,
  PlusSignIcon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons";

import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";

type IconType = Parameters<typeof HugeiconsIcon>[0]["icon"];

const tabs: { id: string; label: string; icon: IconType }[] = [
  { id: "getting-started", label: "Getting started", icon: Edit02Icon },
  { id: "security", label: "Security", icon: Shield01Icon },
  { id: "support", label: "Technical Support", icon: HeadsetIcon },
  { id: "legal", label: "Legal and Compliance", icon: JusticeScale01Icon },
  { id: "payments", label: "Payments", icon: CreditCardIcon },
];

const faqs: Record<string, { q: string; a: string }[]> = {
  "getting-started": [
    {
      q: "How do I create my Lynx account?",
      a: "Sign up, confirm your email, and add your first unit. Most operators are looking at live data inside 10 minutes — no implementation team required.",
    },
    {
      q: "How does the onboarding process work?",
      a: "A guided setup walks you through adding units, importing your historical data, choosing the dashboards that matter, and inviting your team. Solo operators are usually live in an afternoon; larger portfolios get a CSM-led rollout.",
    },
    {
      q: "How do I import my unit and location data?",
      a: "Lynx works with the tools you already run on — Square, Toast, Lightspeed, Mews, Hostfully, plus 12,000+ other systems via bank-grade integrations. Pick yours and we backfill your history automatically.",
    },
    {
      q: "How long does it take to set up the platform?",
      a: "Most teams are live within an afternoon. Larger multi-unit deployments with custom roles, vendor rules, and SSO typically take 2–3 days end-to-end.",
    },
    {
      q: "Can I use Lynx without integrations?",
      a: "Yes. You can import historical data via CSV or push events through our public REST API from any system you already operate. Native integrations are there when you're ready.",
    },
  ],
  security: [
    {
      q: "How is my data protected?",
      a: "All data is encrypted at rest with AES-256 and in transit via TLS 1.3. Lynx is SOC 2 Type II certified, and access is governed by role-based permissions you control per unit, per site, per team.",
    },
    {
      q: "Where is data stored?",
      a: "Data is hosted in US-East and EU-Central regions. You choose the region during onboarding; data does not leave it.",
    },
  ],
  support: [
    {
      q: "How do I reach support?",
      a: "Live chat in-app for all plans. Advanced plans include a dedicated Slack channel, a named CSM, and a 1-hour response SLA during your business hours.",
    },
  ],
  legal: [
    {
      q: "Are you GDPR compliant?",
      a: "Yes. Our DPA is available on request and is signed automatically with every Advanced plan. We also support per-region data residency for operators with regulatory exposure.",
    },
  ],
  payments: [
    {
      q: "What payment methods do you support?",
      a: "All major cards, Apple Pay, Google Pay, and ACH for annual contracts. Multi-unit rollouts can be invoiced and paid via wire on net-30 terms.",
    },
  ],
};

export function Faq() {
  const [tab, setTab] = useState("getting-started");
  const [open, setOpen] = useState<number>(0);

  const items = faqs[tab] ?? [];

  return (
    <BentoCard className="p-6 sm:p-10">
      <h2 className="text-center text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.05] mb-8">
        Frequently Asked Questions
      </h2>

      {/* Tabs: scroll horizontally on mobile, wrap on larger screens */}
      <div className="-mx-6 sm:mx-0 mb-8 overflow-x-auto sm:overflow-visible">
        <div className="flex sm:flex-wrap sm:justify-center gap-2 px-6 sm:px-0 w-max sm:w-auto">
          {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setOpen(0);
            }}
            className={cn(
              "cursor-pointer shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              tab === t.id
                ? "bg-[#F97316] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_2px_4px_0_rgba(180,55,0,0.25),0_10px_24px_-8px_rgba(249,115,22,0.55)]"
                : "bg-white border border-gray-100 text-zinc-700 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_1px_2px_0_rgba(0,0,0,0.03)]",
            )}
          >
            <HugeiconsIcon icon={t.icon} size={16} strokeWidth={2} />
            {t.label}
          </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((item, i) => {
          const expanded = open === i;
          return (
            <div
              key={item.q}
              className={cn(
                "rounded-[1.5rem] transition-all duration-300 overflow-hidden",
                expanded
                  ? "bg-[#09090B] text-white border border-white/5 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.3)]"
                  : "bg-[#F3F4F6] text-zinc-900 border border-gray-100/80",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : i)}
                className="cursor-pointer w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-black/[0.02]"
              >
                <span className="text-base font-semibold tracking-tight">
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
                    size={14}
                    strokeWidth={2.5}
                  />
                </span>
              </button>
              {expanded && (
                <div className="px-6 pb-6 -mt-1 text-sm font-medium leading-relaxed text-zinc-300 max-w-2xl animate-fade-up">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}

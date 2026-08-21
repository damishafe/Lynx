import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

import { BentoCard } from "@/components/ui/bento-card";
import { buttonClasses } from "@/components/ui/button";

// The four business flows Kane CLI replays in a real browser before any
// AI-written change to Lynx is allowed to ship. Mirrors kane/*_test.md.
const flows = [
  {
    title: "Booking lifecycle",
    body: "A booking makes the unit Occupied and recognises its revenue.",
    file: "booking-lifecycle_test.md",
  },
  {
    title: "Cleaning lifecycle",
    body: "Checkout schedules exactly one turnover clean and refuses Ready.",
    file: "cleaning-lifecycle_test.md",
  },
  {
    title: "Unit readiness",
    body: "Completing the clean pays the vendor once and frees the unit.",
    file: "unit-readiness_test.md",
  },
  {
    title: "Profitability invariant",
    body: "Revenue, platform fee, costs and net always add up.",
    file: "profit-invariant_test.md",
  },
];

const loop = [
  { icon: RefreshIcon, label: "Claude Code changes Lynx", tone: "bg-zinc-900 text-white" },
  { icon: Alert02Icon, label: "Kane CLI fails the flow in real Chrome", tone: "bg-rose-100 text-rose-700" },
  { icon: RefreshIcon, label: "The failure is fed straight back to the agent", tone: "bg-amber-100 text-amber-700" },
  { icon: CheckmarkCircle01Icon, label: "Kane re-verifies. Only then can it ship.", tone: "bg-emerald-100 text-emerald-700" },
];

export function ProofLoop() {
  return (
    <BentoCard className="p-6 sm:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-end">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-3 py-1 text-[11px] font-semibold tracking-tight mb-5">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} strokeWidth={2.2} />
            Verified with Kane CLI
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
            Every change proves itself
            <br />
            in a real browser.
          </h2>
        </div>
        <p className="lg:col-span-5 text-sm sm:text-base font-medium text-gray-500 leading-relaxed max-w-md">
          Lynx is built by an AI coding agent. ProofLoop is the layer that makes
          that safe to ship: when Claude Code tries to finish a change, Kane CLI
          replays the affected business flows in real Chrome and blocks the
          agent with the failure until the flow passes. The agent doesn&apos;t
          decide when it&apos;s done — the browser evidence does.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loop.map((step, i) => (
          <li
            key={step.label}
            className="rounded-[1.75rem] bg-white border border-gray-100 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${step.tone}`}>
                <HugeiconsIcon icon={step.icon} size={18} strokeWidth={2} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Step {i + 1}
              </span>
            </div>
            <p className="text-sm font-semibold tracking-tight text-zinc-900 leading-snug">
              {step.label}
            </p>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flows.map((flow) => (
            <div
              key={flow.file}
              className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={14}
                  strokeWidth={2.2}
                  className="text-emerald-600"
                />
                <span className="text-sm font-semibold tracking-tight text-zinc-900">
                  {flow.title}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">{flow.body}</p>
              <p className="mt-3 font-mono text-[11px] text-gray-400">kane/{flow.file}</p>
            </div>
          ))}
        </div>
        <div className="lg:col-span-4 rounded-[1.5rem] bg-[#09090B] text-white p-6 flex flex-col gap-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            Live verification status
          </div>
          <p className="text-sm font-medium text-white/80 leading-relaxed">
            Watch the last Kane verdicts, the evidence screenshots and the
            repair history for this very codebase.
          </p>
          <Link
            href="/proofloop"
            className={buttonClasses({ variant: "accent", size: "md", className: "self-start" })}
          >
            Open ProofLoop
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </BentoCard>
  );
}

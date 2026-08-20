import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  SparklesIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";

const advancedFeatures = [
  "Multi-unit performance analytics",
  "Roles, sites & team permissions",
  "AI anomaly detection across units",
  "Custom operational reports",
  "Real-time portfolio monitoring",
  "Priority support and dedicated CSM",
];

const essentialFeatures = [
  "Single-portfolio dashboard",
  "Expense & vendor tracking",
  "Unit-level P&L reports",
  "Performance & utilization tracking",
];

export function Pricing() {
  return (
    <BentoCard className="p-6 sm:p-10">
      <div className="max-w-2xl mb-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
          Find the right plan
          <br />
          for your team.
        </h2>
        <p className="mt-5 text-sm sm:text-base font-medium text-gray-500 max-w-md">
          From solo operators to multi-unit teams — pick what fits and grow into
          the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Advanced — dark */}
        <div className="relative rounded-[2rem] bg-[#09090B] text-white border border-white/5 p-7 sm:p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Advanced for multi-unit teams
                </h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-xs">
                  For teams running multiple locations who need
                  cross-portfolio analytics, role-based access, and operational
                  depth.
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 mb-7">
              {advancedFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm font-medium text-zinc-200"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400">
                    <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4 flex items-end justify-between gap-4">
              <div className="text-5xl font-semibold tracking-tight">
                $129
                <span className="text-sm font-medium text-zinc-400">/month</span>
              </div>
              <Button variant="accent" size="md">
                Get Started
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.5),transparent_60%)]" />
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    size={18}
                    strokeWidth={2}
                    className="relative text-blue-300"
                  />
                </div>
                <span className="text-sm font-medium">
                  Cross-portfolio AI anomaly detection
                </span>
              </div>
              <div
                role="switch"
                aria-checked="true"
                className="cursor-pointer relative inline-flex h-6 w-11 rounded-full bg-emerald-500 items-center shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.18),0_0_18px_-4px_rgba(16,185,129,0.6)]"
              >
                <span className="absolute right-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.2)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Essential — light */}
        <div className="relative rounded-[2rem] bg-white border border-gray-100 p-7 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="absolute -top-10 right-6 w-20 h-20 pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-amber-100/40 blur-2xl" />
            <Image
              src="/img/logo.png"
              alt=""
              width={64}
              height={64}
              className="relative rotate-[-12deg] drop-shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
            />
          </div>
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
              Essential for solo operators
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs font-medium">
              For one or two units. Get clarity without the overhead of an
              enterprise rollout.
            </p>

            <div className="mt-6 mb-6">
              <div className="text-5xl font-semibold tracking-tight text-zinc-900">
                $19
                <span className="text-sm font-medium text-gray-500">/month</span>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 mb-7">
              {essentialFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm font-medium text-zinc-700"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700">
                    <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

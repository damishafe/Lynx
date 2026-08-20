import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  AnalyticsUpIcon,
  ChartLineData01Icon,
  PieChart01Icon,
  Wallet01Icon,
  ChartUpIcon,
} from "@hugeicons/core-free-icons";

import { BentoCard, BentoCardTitle } from "@/components/ui/bento-card";
import { IconWrapper } from "@/components/ui/icon-wrapper";
import { SpendingBreakdownChart } from "@/components/charts/spending-breakdown";

const features = [
  {
    label: "Live unit utilization",
    icon: SparklesIcon,
    tone: "violet" as const,
  },
  {
    label: "Automated vendor payouts",
    icon: AnalyticsUpIcon,
    tone: "emerald" as const,
  },
  {
    label: "Real-time portfolio P&L",
    icon: ChartLineData01Icon,
    tone: "amber" as const,
  },
];

const overview = [
  { icon: PieChart01Icon, tone: "emerald" as const },
  { icon: Wallet01Icon, tone: "violet" as const },
  { icon: ChartUpIcon, tone: "amber" as const },
];

export function Insights() {
  return (
    <BentoCard className="relative overflow-hidden p-6 sm:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-stretch">
        {/* LEFT — content & story; spread vertically to align bottoms with right column */}
        <div className="flex flex-col justify-between h-full gap-6">
          <div className="flex flex-col gap-6">
            <BentoCardTitle className="text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
              Operations clarity,
              <br />
              made simple.
            </BentoCardTitle>

            <p className="max-w-md text-base sm:text-lg leading-relaxed text-gray-500 font-medium">
              Lynx replaces your 15-tab spreadsheet. Track unit performance,
              automate vendor payouts, and see your true ROI in real-time.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-5 w-full max-w-md hover:shadow-md transition-shadow"
              >
                <IconWrapper size="sm" tone={f.tone}>
                  <HugeiconsIcon icon={f.icon} size={18} strokeWidth={2} />
                </IconWrapper>
                <span className="text-sm font-semibold tracking-tight text-zinc-900">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — bento visuals only */}
        <div className="flex flex-col gap-6">
          {/* Framed image header */}
          <div className="w-full h-40 md:h-48 rounded-[2rem] overflow-hidden bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 relative">
            {/* Soft halo wash inside the frame for premium glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(167,139,250,0.18) 0%, rgba(16,185,129,0.10) 45%, rgba(255,255,255,0) 75%)",
              }}
            />
            <Image
              src="/img/empthy_state_Feature_Graphic.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-center"
            />
          </div>

          <SpendingBreakdownChart />

          <div className="rounded-[1.5rem] bg-white border border-gray-100 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              {overview.map((o, i) => (
                <IconWrapper key={i} size="sm" tone={o.tone}>
                  <HugeiconsIcon icon={o.icon} size={18} strokeWidth={2} />
                </IconWrapper>
              ))}
              <div className="ml-auto text-right">
                <div className="text-sm font-semibold tracking-tight text-zinc-900">
                  Portfolio overview
                </div>
                <div className="text-[11px] font-medium text-gray-400">
                  Updated just now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

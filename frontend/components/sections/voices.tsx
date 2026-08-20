import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { QuoteUpIcon, SparklesIcon } from "@hugeicons/core-free-icons";

import {
  BentoCard,
  BentoCardTitle,
  BentoCardDescription,
} from "@/components/ui/bento-card";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "We replaced three dashboards with Lynx in a weekend. The ROI math finally adds up.",
    name: "Sasha M.",
    role: "Director of Ops, Gravity Studios",
    avatar: "/img/avatar2.webp",
  },
  {
    quote:
      "Real-time visibility across 14 stores. Our weekly close went from six hours to twenty minutes.",
    name: "Marcus L.",
    role: "CFO, Northbeam Coffee",
    avatar: "/img/avatar4.webp",
  },
  {
    quote:
      "The vendor payout automation alone paid for the year-one license.",
    name: "Priya R.",
    role: "COO, Halo Group",
    avatar: "/img/avatar3.webp",
  },
  {
    quote:
      "Finally, one source of truth I trust enough to make calls on at 11pm.",
    name: "Daniel K.",
    role: "Founder, Atlas Logistics",
    avatar: "/img/avatar1.webp",
  },
];

export function Voices() {
  return (
    <BentoCard className="p-6 sm:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* LEFT — dark "wow" feature spotlight */}
        <div className="lg:col-span-5 relative rounded-[2rem] overflow-hidden bg-[#09090B] text-white border border-white/5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] min-h-[22rem] flex flex-col justify-end p-7 sm:p-8">
          {/* Hero accent image as moody backdrop */}
          <div className="absolute inset-0">
            <Image
              src="/img/drk_mode_bento_card_accent_for_wow.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/80 to-[#09090B]/10" />
          </div>

          <div className="relative flex flex-col gap-5 max-w-md">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white/90">
              <HugeiconsIcon icon={SparklesIcon} size={12} strokeWidth={2.2} />
              Always on
            </span>
            <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.05]">
              Your numbers don&apos;t sleep.
              <br />
              Neither does Lynx.
            </h3>
            <p className="text-sm font-medium text-white/70 leading-relaxed">
              Anomaly detection runs around the clock. By the time the morning
              standup starts, you already know where the variance lives.
            </p>
          </div>
        </div>

        {/* RIGHT — testimonials grid */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="mb-6">
            <BentoCardTitle className="text-3xl sm:text-4xl lg:text-5xl leading-[1.05]">
              Operators talk.
              <br />
              We listened.
            </BentoCardTitle>
            <BentoCardDescription className="mt-3 text-base max-w-md">
              From multi-unit retail to creator-led studios — teams running on
              Lynx move quicker, close faster, and sleep better.
            </BentoCardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="relative rounded-[1.5rem] bg-white border border-gray-100 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_12px_30px_-8px_rgba(0,0,0,0.08)] flex flex-col justify-between gap-4"
              >
                <HugeiconsIcon
                  icon={QuoteUpIcon}
                  size={20}
                  strokeWidth={2}
                  className="text-emerald-500/70"
                />
                <blockquote className="text-sm sm:text-[15px] leading-relaxed font-medium text-zinc-800">
                  {t.quote}
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <Image
                    src={t.avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded-full ring-2 ring-white object-cover shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                      {t.name}
                    </div>
                    <div className="text-[11px] font-medium text-gray-500 truncate">
                      {t.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import Link from "next/link";

import { BentoCard } from "@/components/ui/bento-card";
import { buttonClasses } from "@/components/ui/button";
import { Header } from "./header";
import { Reveal } from "@/components/ui/reveal";
import { LaunchDemoButton } from "@/components/demo/launch-demo-button";

const avatars = [
  "/img/avatar1.webp",
  "/img/avatar2.webp",
  "/img/avatar3.webp",
  "/img/avatar4.webp",
];

export function Hero() {
  return (
    <BentoCard className="relative overflow-hidden p-6 sm:p-10">
      {/* === Subtle decorative background layer === */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Dot grid — barely visible texture, masked toward title area */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.07) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 30%, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 50% at 50% 30%, black 30%, transparent 70%)",
          }}
        />
        {/* Soft emerald wash — bottom-left */}
        <div
          className="absolute -bottom-40 -left-32 w-[34rem] h-[34rem] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0) 60%)",
          }}
        />
        {/* Soft violet wash — bottom-right */}
        <div
          className="absolute -bottom-40 -right-32 w-[34rem] h-[34rem] rounded-full opacity-45"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(139,92,246,0) 60%)",
          }}
        />
      </div>

      <div className="relative">
        <Header />

        {/* Centered hero copy */}
        <div className="mt-20 sm:mt-28 flex flex-col items-center text-center">
          <Reveal>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-900 leading-[1.02] max-w-4xl">
              Run every unit like
              <br className="hidden sm:block" />
              {" "}it&rsquo;s your only one.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className={buttonClasses({ variant: "primary", size: "md" })}
                >
                  Get Started
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                </Link>
                <LaunchDemoButton
                  variant="secondary"
                  label="Launch Demo"
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bento sub-grid */}
        <div className="mt-12 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left col: avatar pill stacked over organic image */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <Reveal delay={120}>
              <div className="rounded-[1.5rem] bg-white border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_14px_40px_rgb(0,0,0,0.06)]">
                <div className="flex -space-x-2.5">
                  {avatars.map((src, i) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full ring-2 ring-white object-cover"
                      style={{ zIndex: avatars.length - i }}
                    />
                  ))}
                </div>
                <div>
                  <div className="text-base font-semibold tracking-tight text-zinc-900">
                    60k+
                  </div>
                  <div className="text-[11px] font-medium text-gray-500 -mt-0.5">
                    Operators worldwide
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200} className="flex-1">
              <div className="relative rounded-[1.5rem] overflow-hidden h-full min-h-[14rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <Image
                  src="/img/bg_hero_img.webp"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 30vw, 100vw"
                  className="object-cover"
                  priority
                />
                {/* Gentle vignette so it sits like a card, not a flat photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent" />
              </div>
            </Reveal>
          </div>

          {/* Right col: Balance Trend chart — pre-rendered card image */}
          <Reveal delay={280} className="lg:col-span-8">
            <div className="relative h-full min-h-[14rem] rounded-[1.5rem] overflow-hidden border border-gray-100 bg-white shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_18px_50px_rgb(0,0,0,0.06)]">
              <Image
                src="/img/chart.webp"
                alt="Portfolio balance trend showing month-over-month growth peaking at $14,562 in September"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover object-center"
                priority
              />
            </div>
          </Reveal>
        </div>
      </div>
    </BentoCard>
  );
}

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  NewTwitterIcon,
  LinkedinIcon,
  YoutubeIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { buttonClasses } from "@/components/ui/button";

const aboutLinks = [
  { label: "Home", href: "#" },
  { label: "Who we are", href: "#who" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contacts", href: "#contact" },
];

const platformLinks = [
  { label: "Unit performance", href: "#" },
  { label: "Vendor payouts", href: "#" },
  { label: "Team & roles", href: "#" },
  { label: "Portfolio analytics", href: "#" },
];

const socials = [
  { icon: InstagramIcon, href: "#", label: "Instagram" },
  { icon: NewTwitterIcon, href: "#", label: "Twitter" },
  { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  { icon: YoutubeIcon, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* CTA card */}
      <div className="lg:col-span-4 rounded-[2rem] bg-white border border-gray-100 p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[20rem]">
        <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
          Start today
          <br />
          with free 14
          <br />
          day trial
        </h3>
        <div className="mt-8">
          <Link
            href="/signup"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Start Free Trial
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Links + bottom row */}
      <div className="lg:col-span-6 rounded-[2rem] bg-white border border-gray-100 p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[20rem]">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 mb-4 uppercase">
              About us
            </p>
            <ul className="space-y-3">
              {aboutLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 mb-4 uppercase">
              Platform
            </p>
            <ul className="space-y-3">
              {platformLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-medium text-zinc-700">
          <Link href="#terms" className="hover:text-zinc-900 cursor-pointer">
            Terms of Use
          </Link>
          <Link href="#privacy" className="hover:text-zinc-900 cursor-pointer">
            Privacy Policy
          </Link>
          <Link href="#cookies" className="hover:text-zinc-900 cursor-pointer">
            Cookie Policy
          </Link>
          <span className="ml-auto text-xs text-gray-400">
            © {new Date().getFullYear()} Lynx, Inc.
          </span>
        </div>
      </div>

      {/* Socials column */}
      <div className="lg:col-span-2 rounded-[2rem] bg-white border border-gray-100 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center gap-4 min-h-[20rem]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
          Socials
        </p>
        <div className="flex flex-col gap-3">
          {socials.map((s) => (
            <Link
              key={s.label}
              aria-label={s.label}
              href={s.href}
              className="cursor-pointer flex items-center justify-center w-11 h-11 rounded-2xl bg-[#09090B] text-white transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_2px_8px_-2px_rgba(0,0,0,0.2),0_10px_24px_-12px_rgba(0,0,0,0.4)] hover:bg-zinc-800 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_2px_10px_-1px_rgba(0,0,0,0.3),0_16px_30px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <HugeiconsIcon icon={s.icon} size={18} strokeWidth={2} />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

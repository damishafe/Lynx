import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  HelpCircleIcon,
  MailIcon,
  MessageMultiple01Icon,
  RocketIcon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { HelpFaq } from "./help-faq";

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@lynx.app";

export default async function HelpPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");

  return (
    <>
      <Topbar
        title="Help & support"
        user={{ name: session.name, email: session.email }}
      />

      {/* Quick links row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <QuickLink
          href={`mailto:${supportEmail}?subject=Lynx%20support`}
          icon={MailIcon}
          eyebrow="Reach a human"
          title="Email support"
          body={`We reply within a few hours during business days at ${supportEmail}.`}
        />
        <QuickLink
          href="/#faq"
          icon={MessageMultiple01Icon}
          eyebrow="Common questions"
          title="Browse FAQs"
          body="Setup, security, billing, integrations — the questions other operators ask the most."
        />
        <QuickLink
          href="/dashboard/work-orders/new"
          icon={RocketIcon}
          eyebrow="Get started"
          title="Create a work order"
          body="Assign a vendor job, open the vendor portal, and watch the manager dashboard update."
        />
      </div>

      {/* Getting started checklist */}
      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        <header className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Getting started in 4 steps
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Most operators can run the demo loop end-to-end in a few minutes.
          </p>
        </header>
        <ol className="flex flex-col gap-3">
          <Step
            n={1}
            title="Add or review your units"
            body={
              <>
                Demo accounts are seeded with units already. You can add real
                units or open one to watch status history change.{" "}
                <Link
                  href="/dashboard/units"
                  className="cursor-pointer font-semibold text-zinc-900 hover:underline"
                >
                  Open Units
                </Link>
                .
              </>
            }
          />
          <Step
            n={2}
            title="Add vendors"
            body={
              <>
                Vendors receive assigned work and expose a mobile portal.{" "}
                <Link
                  href="/dashboard/vendors"
                  className="cursor-pointer font-semibold text-zinc-900 hover:underline"
                >
                  Open Vendors
                </Link>
                .
              </>
            }
          />
          <Step
            n={3}
            title="Create work orders"
            body="Assign a cleaning or maintenance job to a vendor and unit. Completion creates a pending payout and marks the unit Ready."
          />
          <Step
            n={4}
            title="Export your records"
            body={
              <>
                Reports includes a live CSV export for units, vendors, work
                orders, and payouts.{" "}
                <Link
                  href="/dashboard/reports/export"
                  className="cursor-pointer font-semibold text-zinc-900 hover:underline"
                >
                  Download CSV
                </Link>
                .
              </>
            }
          />
        </ol>
      </section>

      {/* FAQs */}
      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        <header className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              Frequently asked
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Don&rsquo;t see your question? Email{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="cursor-pointer font-semibold text-zinc-900 hover:underline"
              >
                {supportEmail}
              </a>
              .
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-[11px] font-semibold tracking-tight text-zinc-700">
            <HugeiconsIcon icon={HelpCircleIcon} size={12} strokeWidth={2.2} />
            Live answers
          </span>
        </header>
        <HelpFaq />
      </section>
    </>
  );
}

type IconType = Parameters<typeof HugeiconsIcon>[0]["icon"];

function QuickLink({
  href,
  icon,
  eyebrow,
  title,
  body,
}: {
  href: string;
  icon: IconType;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group cursor-pointer rounded-[1.75rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_14px_36px_-10px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-zinc-700">
          <HugeiconsIcon icon={icon} size={18} strokeWidth={2} />
        </span>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.4} />
        </span>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        <p className="mt-1.5 text-sm font-medium text-gray-500 leading-snug">
          {body}
        </p>
      </div>
    </Link>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-4 rounded-2xl bg-gray-50/70 border border-gray-100 px-5 py-4">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-100 text-zinc-900 text-sm font-semibold tracking-tight shrink-0">
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-tight text-zinc-900">
          {title}
        </div>
        <div className="mt-0.5 text-xs sm:text-sm font-medium text-gray-500 leading-relaxed">
          {body}
        </div>
      </div>
    </li>
  );
}

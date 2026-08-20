import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";

import { LaunchDemoButton } from "@/components/demo/launch-demo-button";
import { buttonClasses } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#F3F4F6] p-4 sm:p-6 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-[2rem] bg-white border border-gray-100 p-8 sm:p-10 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_20px_40px_-15px_rgba(0,0,0,0.08)]">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-[#09090B] text-white">
          <HugeiconsIcon icon={PlayIcon} size={24} strokeWidth={2} />
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
          Launch Lynx demo
        </h1>
        <p className="mt-3 text-sm font-medium text-gray-500 leading-relaxed max-w-md mx-auto">
          Opens a seeded operator account with three units and two vendors.
          &quot;Reset &amp; launch demo&quot; wipes the account first so every
          run starts from the same state.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LaunchDemoButton label="Enter demo account" />
          <LaunchDemoButton mode="reset" variant="secondary" label="Reset & launch demo" />
          <Link
            href="/"
            className={buttonClasses({ variant: "secondary", size: "md" })}
          >
            Back home
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}

import { Hero } from "@/components/sections/hero";
import { Insights } from "@/components/sections/insights";
import { ProofLoop } from "@/components/sections/proofloop";
import { Voices } from "@/components/sections/voices";
import { Stats } from "@/components/sections/stats";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";
import { Reveal } from "@/components/ui/reveal";

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[88rem] flex flex-col gap-5 sm:gap-6">
        <Hero />
        <Reveal>
          <ProofLoop />
        </Reveal>
        <Reveal>
          <Insights />
        </Reveal>
        <Reveal>
          <Voices />
        </Reveal>
        <Reveal>
          <Stats />
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <Footer />
        </Reveal>
      </div>
    </main>
  );
}

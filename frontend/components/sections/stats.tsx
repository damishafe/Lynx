import { BentoCard } from "@/components/ui/bento-card";

const stats = [
  {
    value: "4x",
    title: "Faster decisions",
    body: "Operators make calls on live unit-level data — not Monday-morning recaps.",
    gradient: "from-emerald-400/40 to-emerald-200/0",
    halo: "shadow-[0_0_60px_-15px_rgba(16,185,129,0.45)]",
  },
  {
    value: "98%",
    title: "Operator retention",
    body: "Multi-unit teams stick with Lynx because the truth lives in one place — across every shift, every site.",
    gradient: "from-violet-400/40 to-violet-200/0",
    halo: "shadow-[0_0_60px_-15px_rgba(139,92,246,0.45)]",
  },
  {
    value: "$2.3B",
    title: "Revenue tracked",
    body: "Total GMV moving through Lynx across every unit, every location, every day.",
    gradient: "from-orange-400/40 to-orange-200/0",
    halo: "shadow-[0_0_60px_-15px_rgba(249,115,22,0.45)]",
  },
];

export function Stats() {
  return (
    <BentoCard className="p-6 sm:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-end">
        <h2 className="lg:col-span-7 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
          The numbers
          <br />
          operators trust.
        </h2>
        <p className="lg:col-span-5 text-sm sm:text-base font-medium text-gray-500 leading-relaxed max-w-md">
          Lynx helps multi-unit operators gain clarity, optimize utilization,
          and make decisions they can defend across every location — not just
          the one in front of them.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.title} className="group space-y-4">
            <div
              className={`relative aspect-[4/3] rounded-[1.75rem] overflow-hidden ${s.halo} flex items-center justify-center bg-white border border-gray-100 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-1`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`}
              />
              <div className="absolute inset-3 rounded-[1.5rem] bg-white/85 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,1)]" />
              <span className="relative text-5xl sm:text-6xl font-semibold tracking-tight text-zinc-900 transition-transform duration-500 group-hover:scale-105">
                {s.value}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="text-base font-semibold tracking-tight text-zinc-900">
                {s.title}
              </div>
              <p className="text-sm font-medium text-gray-500 leading-snug">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

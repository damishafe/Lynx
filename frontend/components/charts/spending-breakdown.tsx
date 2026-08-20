import { cn } from "@/lib/utils";

const bars = [
  { label: "16%", value: 16, sub: "48,210", highlight: false },
  { label: "20%", value: 20, sub: "64,320", highlight: false },
  { label: "40%", value: 40, sub: "112,100", highlight: true },
  { label: "24%", value: 24, sub: "82,540", highlight: false },
];

export function SpendingBreakdownChart({ className }: { className?: string }) {
  const max = 50;
  return (
    <div
      className={cn(
        "relative rounded-[1.5rem] bg-white border border-gray-100 p-5 sm:p-6",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_8px_30px_rgb(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-semibold tracking-tight text-zinc-900">
          Revenue by Unit
        </p>
        <span className="text-[10px] font-medium text-gray-400 rounded-full bg-gray-50 border border-gray-100 px-2 py-0.5">
          Quarterly
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4 h-40">
        {bars.map((b, i) => {
          const heightPct = (b.value / max) * 100;
          return (
            <div key={i} className="flex flex-col">
              {/* Bar zone — reserves vertical space; top label rendered above bar peak */}
              <div className="relative flex-1 w-full">
                {/* Top label / pill, anchored just above the bar's top edge */}
                <div
                  className="absolute left-0 right-0 flex items-center justify-center"
                  style={{ bottom: `calc(${heightPct}% + 6px)` }}
                >
                  {b.highlight ? (
                    <span className="rounded-full bg-violet-600 text-white text-[10px] font-semibold px-2 py-0.5 shadow-[0_8px_20px_-6px_rgba(124,58,237,0.55)]">
                      {b.label}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-zinc-500">
                      {b.label}
                    </span>
                  )}
                </div>
                {/* Bar — absolute, full column width, anchored to bottom */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 rounded-t-lg",
                    b.highlight &&
                      "shadow-[0_-8px_30px_-4px_rgba(124,58,237,0.35)]",
                  )}
                  style={{
                    height: `${heightPct}%`,
                    minHeight: "20px",
                    background: b.highlight
                      ? "linear-gradient(180deg, #7C3AED 0%, #A78BFA 100%)"
                      : "linear-gradient(180deg, #C4B5FD 0%, #DDD6FE 100%)",
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-500 mt-3 text-center">
                {b.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

import { LiveDashboardRefresh } from "@/components/dashboard/live-dashboard-refresh";
import { Logo } from "@/components/ui/logo";
import { evidenceUrl, readHistory, readLatestReport, type FlowResult, type VerifyReport } from "@/lib/proofloop";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const card =
  "rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]";

function verdictStyle(v: VerifyReport["verdict"] | "none") {
  switch (v) {
    case "verified":
      return { label: "VERIFIED", classes: "bg-emerald-500 text-white", icon: CheckmarkCircle01Icon, sub: "Every impacted flow held in a real browser." };
    case "failed":
      return { label: "FAILED", classes: "bg-rose-500 text-white", icon: Alert02Icon, sub: "Kane found a flow that does not hold. The agent has been told." };
    case "error":
      return { label: "UNVERIFIED", classes: "bg-amber-500 text-white", icon: Alert02Icon, sub: "ProofLoop could not run Kane." };
    default:
      return { label: "NO RUNS YET", classes: "bg-zinc-900 text-white", icon: Clock01Icon, sub: "Run: node proofloop/src/cli.ts verify --all" };
  }
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ProofLoopPage() {
  const latest = readLatestReport();
  const history = readHistory(20);
  const repairs = history.filter((h) => h.trigger === "hook" && h.verdict === "failed").length;
  const v = verdictStyle(latest?.verdict ?? "none");

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-8 sm:px-8">
      <LiveDashboardRefresh intervalMs={4000} />
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-sm font-semibold tracking-tight text-gray-500">/ ProofLoop</span>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1">
            Open Lynx <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.2} />
          </Link>
        </header>

        {/* Ship banner */}
        <section className={cn(card, "p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6")}>
          <div className={cn("flex items-center gap-4 rounded-[1.5rem] px-6 py-5", v.classes)}>
            <HugeiconsIcon icon={v.icon} size={28} strokeWidth={2} />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Ship status</div>
              <div className="text-3xl font-semibold tracking-tight leading-none mt-1">{v.label}</div>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Every AI-written change must prove itself in a real browser.
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">{v.sub}</p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <Stat label="Flows" value={String(latest?.results.length ?? 0)} />
            <Stat label="Verified" value={String(latest?.results.filter((r) => r.status === "passed").length ?? 0)} />
            <Stat label="Repairs" value={String(repairs)} />
          </dl>
        </section>

        {latest && (
          <section className={cn(card, "p-6 sm:p-8")}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">Latest verification</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {fmtTime(latest.startedAt)} · trigger {latest.trigger} · attempt {latest.attempt}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-3 py-1 text-[11px] font-semibold">
                <HugeiconsIcon icon={RefreshIcon} size={11} strokeWidth={2.2} /> Live
              </span>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Stage title="Change" body={latest.changedFiles.length ? latest.changedFiles.join("\n") : "No mapped changes"} />
              <Stage title="Impact" body={latest.flows.length ? latest.flows.join(" · ") : "—"} hint={latest.unmapped.length ? `Unmapped: ${latest.unmapped.join(", ")}` : undefined} />
              <Stage title="Verify" body={`${latest.results.length} Kane run(s) in real Chrome`} hint={latest.preflight && !latest.preflight.ok ? latest.preflight.message : undefined} />
            </ol>

            <ul className="flex flex-col gap-3">
              {latest.results.map((r) => (
                <FlowRow key={r.flow} r={r} />
              ))}
            </ul>
          </section>
        )}

        <section className={cn(card, "p-6 sm:p-8")}>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-sm font-medium text-gray-500">No verifications recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((h) => (
                <li key={h.id} className="grid grid-cols-[120px_110px_1fr_auto] gap-4 py-3 items-center text-sm">
                  <span className="font-medium text-gray-500">{fmtTime(h.startedAt)}</span>
                  <VerdictPill verdict={h.verdict} />
                  <span className="font-medium text-gray-600 truncate">{h.flows.join(", ") || "—"}</span>
                  <span className="text-xs font-medium text-gray-400">{h.trigger} · #{h.attempt}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50/70 border border-gray-100 px-4 py-3">
      <dd className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">{value}</dd>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 mt-1">{label}</dt>
    </div>
  );
}

function Stage({ title, body, hint }: { title: string; body: string; hint?: string }) {
  return (
    <li className="rounded-2xl bg-gray-50/70 border border-gray-100 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{title}</div>
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm font-semibold tracking-tight text-zinc-900">{body}</pre>
      {hint && <p className="mt-1 text-xs font-medium text-amber-700">{hint}</p>}
    </li>
  );
}

function VerdictPill({ verdict }: { verdict: VerifyReport["verdict"] }) {
  const classes =
    verdict === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100/70"
    : verdict === "failed" ? "bg-rose-50 text-rose-700 border-rose-100/70"
    : "bg-amber-50 text-amber-700 border-amber-100/70";
  return (
    <span className={cn("inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", classes)}>
      {verdict}
    </span>
  );
}

function FlowRow({ r }: { r: FlowResult }) {
  const shot = evidenceUrl(r.evidence.screenshot);
  const ok = r.status === "passed";
  return (
    <li className={cn("rounded-2xl border p-4 sm:p-5", ok ? "bg-emerald-50/40 border-emerald-100/70" : "bg-rose-50/40 border-rose-100/70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("flex items-center justify-center w-8 h-8 rounded-xl text-white", ok ? "bg-emerald-500" : "bg-rose-500")}>
            <HugeiconsIcon icon={ok ? CheckmarkCircle01Icon : Alert02Icon} size={16} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">{r.title}</div>
            <div className="text-[11px] font-medium text-gray-500">{r.test} · {r.durationS}s · {r.replayed ? "replayed" : `${r.credits} credits`}</div>
          </div>
        </div>
        {r.testUrl && (
          <a href={r.testUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-zinc-900 inline-flex items-center gap-1">
            Kane run <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
          </a>
        )}
      </div>
      {!ok && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="text-sm">
            <p className="font-semibold text-rose-700">Kane: {r.reason || r.summary}</p>
            {r.failedStep && <p className="mt-1 font-medium text-gray-600">Step {r.failedStep.step}: {r.failedStep.remark}</p>}
            {Object.keys(r.finalState).length > 0 && (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {Object.entries(r.finalState).map(([k, val]) => (
                  <div key={k} className="contents">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{k}</dt>
                    <dd className="font-semibold tabular-nums text-zinc-900">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt={`Browser at the failing step of ${r.flow}`} className="w-full rounded-xl border border-gray-200" />
          )}
        </div>
      )}
    </li>
  );
}

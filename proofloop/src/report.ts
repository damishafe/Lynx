import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";

export type FlowStatus = "passed" | "failed" | "error";
export type Verdict = "verified" | "failed" | "error" | "nothing-to-verify";

export type FlowResult = {
  flow: string;
  title: string;
  test: string;
  status: FlowStatus;
  exitCode: number;
  reason: string;
  summary: string;
  oneLiner: string;
  finalState: Record<string, unknown>;
  failedStep: { step: number; remark: string } | null;
  stepsTotal: number;
  durationS: number;
  credits: number | null;
  /** credits === 0 means Kane replayed cached recordings; null means credits were never reported. */
  replayed: boolean;
  runDir: string | null;
  testUrl: string | null;
  evidence: { screenshot: string | null; actions: string | null };
};

export type VerifyReport = {
  id: string;
  startedAt: string;
  finishedAt: string;
  trigger: "hook" | "cli";
  attempt: number;
  changedFiles: string[];
  unmapped: string[];
  ignored: string[];
  flows: string[];
  results: FlowResult[];
  verdict: Verdict;
  preflight?: { ok: boolean; message: string };
};

export function proofloopDir(root: string): string {
  return join(root, ".proofloop");
}

export function reportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function writeReport(root: string, report: VerifyReport): void {
  const dir = proofloopDir(root);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "latest.json"), JSON.stringify(report, null, 2));
  appendFileSync(join(dir, "history.jsonl"), `${JSON.stringify(report)}\n`);
}

export function readLatest(root: string): VerifyReport | null {
  const file = join(proofloopDir(root), "latest.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as VerifyReport;
}

export function readHistory(root: string, limit = 20): VerifyReport[] {
  const file = join(proofloopDir(root), "history.jsonl");
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").split("\n").filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l) as VerifyReport).reverse();
}

function expandHome(p: string): string {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

function newestPng(dir: string, depth = 0): string | null {
  if (depth > 4 || !existsSync(dir)) return null;
  let best: { file: string; mtime: number } | null = null;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      const inner = newestPng(full, depth + 1);
      if (inner) {
        const m = statSync(inner).mtimeMs;
        if (!best || m > best.mtime) best = { file: inner, mtime: m };
      }
    } else if (entry.toLowerCase().endsWith(".png")) {
      if (!best || st.mtimeMs > best.mtime) best = { file: full, mtime: st.mtimeMs };
    }
  }
  return best?.file ?? null;
}

/** Copy the failing step's screenshot and the action log into .proofloop/evidence/. */
export function collectEvidence(
  root: string,
  id: string,
  flow: string,
  runDir: string | null,
): FlowResult["evidence"] {
  const out: FlowResult["evidence"] = { screenshot: null, actions: null };
  if (!runDir) return out;
  const src = resolve(root, expandHome(runDir));
  if (!existsSync(src)) return out;
  const dest = join(proofloopDir(root), "evidence", id, flow);
  mkdirSync(dest, { recursive: true });
  const png = newestPng(src);
  if (png) {
    const target = join(dest, "failure.png");
    copyFileSync(png, target);
    out.screenshot = relative(root, target);
  }
  const actions = join(src, "run-test", "actions.ndjson");
  if (existsSync(actions)) {
    const target = join(dest, "actions.ndjson");
    copyFileSync(actions, target);
    out.actions = relative(root, target);
  }
  return out;
}

const ICON: Record<FlowStatus, string> = { passed: "✓", failed: "✗", error: "!" };

function fmtState(state: Record<string, unknown>): string {
  const entries = Object.entries(state);
  if (entries.length === 0) return "(none)";
  return entries.map(([k, v]) => `${k}=${String(v)}`).join(" ");
}

export function formatConsole(report: VerifyReport): string {
  const lines: string[] = [];
  lines.push(`ProofLoop ${report.id} · trigger=${report.trigger} · attempt=${report.attempt}`);
  lines.push(`Changed: ${report.changedFiles.length ? report.changedFiles.join(", ") : "(none)"}`);
  if (report.unmapped.length) lines.push(`Unmapped (ran fallback): ${report.unmapped.join(", ")}`);
  if (report.preflight && !report.preflight.ok) lines.push(`Preflight: ${report.preflight.message}`);
  lines.push("");
  for (const r of report.results) {
    lines.push(`${ICON[r.status]} ${r.flow.padEnd(10)} ${r.status.padEnd(7)} ${r.durationS}s ${r.replayed ? "replay" : `${r.credits ?? "?"} credits`}  ${r.test}`);
    if (r.status !== "passed") {
      lines.push(`    reason: ${r.reason || "(none)"}`);
      if (r.failedStep) lines.push(`    step ${r.failedStep.step}: ${r.failedStep.remark}`);
      lines.push(`    observed: ${fmtState(r.finalState)}`);
      if (r.evidence.screenshot) lines.push(`    screenshot: ${r.evidence.screenshot}`);
      if (r.testUrl) lines.push(`    kane: ${r.testUrl}`);
    }
  }
  lines.push("");
  const passed = report.results.filter((r) => r.status === "passed").length;
  const banner =
    report.verdict === "verified" ? `VERIFIED — ${passed}/${report.results.length} flows proven in a real browser`
    : report.verdict === "failed" ? `FAILED — ${report.results.length - passed} of ${report.results.length} flows did not hold`
    : report.verdict === "error" ? "UNVERIFIED — ProofLoop could not run Kane"
    : "NOTHING TO VERIFY — no mapped frontend changes";
  lines.push(banner);
  return lines.join("\n");
}

/** Plain text an agent can act on. Fed to Claude as the Stop-hook block reason. */
export function buildBlockReason(report: VerifyReport, attempt: number, maxAttempts: number): string {
  const failed = report.results.filter((r) => r.status !== "passed");
  const lines: string[] = [];
  lines.push(
    `ProofLoop: ${failed.length} of ${report.results.length} impacted flow(s) FAILED in a real browser (Kane CLI). You may not finish yet.`,
  );
  lines.push("");
  for (const r of report.results) {
    if (r.status === "passed") {
      lines.push(`✓ ${r.flow} — passed (${r.replayed ? "replayed, 0 credits" : `${r.credits ?? "?"} credits`})`);
      continue;
    }
    lines.push(`✗ ${r.flow} — ${r.test}`);
    lines.push(`  Kane: "${r.reason || r.summary || "no reason reported"}"`);
    lines.push(`  Observed final_state: ${fmtState(r.finalState)}`);
    if (r.failedStep) lines.push(`  Failed at step ${r.failedStep.step}: "${r.failedStep.remark}"`);
    if (r.evidence.screenshot) lines.push(`  Screenshot: ${r.evidence.screenshot}`);
    if (r.evidence.actions) lines.push(`  Action log: ${r.evidence.actions}`);
    if (r.testUrl) lines.push(`  Kane run: ${r.testUrl}`);
    lines.push("");
  }
  lines.push(`Changed files: ${report.changedFiles.join(", ") || "(none)"}`);
  lines.push(
    "Fix the application code so the flow passes. Do not edit kane/*_test.md to make it pass unless the requirement itself changed.",
  );
  lines.push(`Then end your turn again; ProofLoop will re-run Kane. Attempt ${attempt} of ${maxAttempts}.`);
  return lines.join("\n");
}

export function buildAllowMessage(report: VerifyReport): string {
  const total = report.results.length;
  const secs = report.results.reduce((s, r) => s + r.durationS, 0);
  const replayed = report.results.filter((r) => r.replayed).length;
  return `✅ ProofLoop: ${total}/${total} impacted flow(s) verified in a real browser by Kane CLI (${Math.round(secs)}s, ${replayed} replayed). Flows: ${report.flows.join(", ")}.`;
}

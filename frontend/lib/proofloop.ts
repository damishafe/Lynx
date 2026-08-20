import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Mirror of proofloop/src/report.ts types (kept in sync by hand). */
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

/** `.proofloop/` lives at the repo root, one level above `frontend/` (override with PROOFLOOP_DIR). */
export function proofloopDir(): string {
  return process.env.PROOFLOOP_DIR ?? resolve(process.cwd(), "..", ".proofloop");
}

export function readLatestReport(): VerifyReport | null {
  const file = join(proofloopDir(), "latest.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as VerifyReport;
  } catch {
    return null;
  }
}

export function readHistory(limit = 20): VerifyReport[] {
  const file = join(proofloopDir(), "history.jsonl");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .slice(-limit)
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as VerifyReport];
      } catch {
        return [];
      }
    })
    .reverse();
}

/** Turn a report-relative evidence path (".proofloop/evidence/<id>/<flow>/failure.png") into a route URL. */
export function evidenceUrl(relPath: string | null): string | null {
  if (!relPath) return null;
  const prefix = ".proofloop/evidence/";
  if (!relPath.startsWith(prefix)) return null;
  return `/api/proofloop/evidence/${relPath.slice(prefix.length)}`;
}

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildAllowMessage, buildBlockReason, proofloopDir, type VerifyReport } from "./report.ts";
import { runVerify } from "./verify.ts";

export const MAX_ATTEMPTS = 3;

export type HookPayload = {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
  last_assistant_message?: string;
};

export type HookDecision = {
  action: "allow" | "block";
  /** Block: fed to Claude as the reason. Allow: shown as a systemMessage (may be empty). */
  message: string;
  exitCode: 0 | 2;
};

export type HookDeps = {
  verify: (attempt: number) => Promise<VerifyReport>;
};

function attemptsFile(root: string, sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(proofloopDir(root), `session-${safe}.json`);
}

export function readAttempts(root: string, sessionId: string): number {
  const file = attemptsFile(root, sessionId);
  if (!existsSync(file)) return 0;
  try {
    return Number((JSON.parse(readFileSync(file, "utf8")) as { attempts?: number }).attempts ?? 0);
  } catch {
    return 0;
  }
}

function writeAttempts(root: string, sessionId: string, attempts: number): void {
  mkdirSync(proofloopDir(root), { recursive: true });
  writeFileSync(attemptsFile(root, sessionId), JSON.stringify({ attempts, updatedAt: new Date().toISOString() }));
}

function clearAttempts(root: string, sessionId: string): void {
  const file = attemptsFile(root, sessionId);
  if (existsSync(file)) unlinkSync(file);
}

/**
 * Policy table (spec §5.2):
 *   nothing-to-verify → allow silently
 *   verified          → allow + proof message
 *   failed, n < max   → BLOCK with the structured reason
 *   failed, n ≥ max   → allow + "human needed"
 *   error             → allow + warning (an unreachable app is not a code failure)
 */
export function decide(report: VerifyReport, attemptsAfter: number, max: number): HookDecision {
  switch (report.verdict) {
    case "nothing-to-verify":
      return { action: "allow", message: "", exitCode: 0 };
    case "verified":
      return { action: "allow", message: buildAllowMessage(report), exitCode: 0 };
    case "error":
      return {
        action: "allow",
        message: `⚠️ ProofLoop could not verify this change: ${report.preflight?.message ?? report.results.map((r) => r.reason).filter(Boolean).join("; ") ?? "unknown error"}. Fix the environment and run: node proofloop/src/cli.ts verify --changed`,
        exitCode: 0,
      };
    case "failed":
      if (attemptsAfter >= max) {
        return {
          action: "allow",
          message: `⛔ ProofLoop: ${max} attempts exhausted and Kane still reports a failure — a human needs to look. See .proofloop/latest.json and the evidence under .proofloop/evidence/.`,
          exitCode: 0,
        };
      }
      return { action: "block", message: buildBlockReason(report, attemptsAfter, max), exitCode: 2 };
  }
}

export function parsePayload(text: string): HookPayload {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as HookPayload;
  } catch {
    return {};
  }
}

export async function runHook(stdinText: string, root: string, overrides: Partial<HookDeps> = {}): Promise<HookDecision> {
  if (process.env.PROOFLOOP_DISABLED === "1") {
    return { action: "allow", message: "", exitCode: 0 };
  }
  const payload = parsePayload(stdinText);
  const sessionId = payload.session_id ?? "unknown";
  const deps: HookDeps = {
    verify: (attempt) => runVerify({ root, mode: "changed", trigger: "hook", attempt }),
    ...overrides,
  };

  const previous = readAttempts(root, sessionId);
  const report = await deps.verify(previous + 1);

  let attemptsAfter = previous;
  if (report.verdict === "failed") {
    attemptsAfter = previous + 1;
    writeAttempts(root, sessionId, attemptsAfter);
  } else if (report.verdict === "verified") {
    clearAttempts(root, sessionId);
    attemptsAfter = 0;
  }
  return decide(report, attemptsAfter, MAX_ATTEMPTS);
}

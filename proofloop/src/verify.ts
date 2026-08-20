import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getChangedFiles as gitChangedFiles } from "./diff.ts";
import { computeImpact, loadFlowMap } from "./impact.ts";
import { kaneVersion, runKaneTest, type KaneRunOptions, type KaneRunResult } from "./kane.ts";
import { deriveOutcome } from "./ndjson.ts";
import { collectEvidence, reportId, writeReport, type FlowResult, type VerifyReport } from "./report.ts";

export type VerifyOptions = {
  root: string;
  mode: "changed" | "all" | "flow";
  flow?: string;
  trigger: "hook" | "cli";
  attempt: number;
  timeoutS?: number; // per test, default 300
  budgetS?: number; // wall-clock budget across all tests, default 1250
};

export type VerifyDeps = {
  getChangedFiles: (cwd: string) => string[];
  runTest: (opts: KaneRunOptions) => Promise<KaneRunResult>;
  checkApp: (url: string) => Promise<boolean>;
  checkKane: () => string | null;
  now: () => Date;
  log: (message: string) => void;
};

export const VARIABLES_FILE = ".testmuai/variables/local.json";

export function readAppUrl(root: string): string {
  const file = join(root, VARIABLES_FILE);
  if (!existsSync(file)) return "http://localhost:3000";
  try {
    const vars = JSON.parse(readFileSync(file, "utf8")) as Record<string, { value?: string }>;
    return vars.app_url?.value ?? "http://localhost:3000";
  } catch {
    return "http://localhost:3000";
  }
}

async function defaultCheckApp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "manual" });
    return res.status < 500;
  } catch {
    return false;
  }
}

function defaultDeps(): VerifyDeps {
  return {
    getChangedFiles: gitChangedFiles,
    runTest: runKaneTest,
    checkApp: defaultCheckApp,
    checkKane: () => kaneVersion(),
    now: () => new Date(),
    log: (m) => process.stderr.write(`${m}\n`),
  };
}

export async function runVerify(opts: VerifyOptions, overrides: Partial<VerifyDeps> = {}): Promise<VerifyReport> {
  const deps: VerifyDeps = { ...defaultDeps(), ...overrides };
  const startedAt = deps.now();
  const id = reportId(startedAt);
  const map = loadFlowMap(opts.root);
  const changedFiles = deps.getChangedFiles(opts.root);
  const impact = computeImpact(changedFiles, map);

  let flows: string[];
  if (opts.mode === "all") flows = Object.keys(map.flows);
  else if (opts.mode === "flow") {
    if (!opts.flow || !map.flows[opts.flow]) throw new Error(`Unknown flow "${opts.flow}". Known: ${Object.keys(map.flows).join(", ")}`);
    flows = [opts.flow];
  } else flows = impact.flows;

  const base: VerifyReport = {
    id,
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
    trigger: opts.trigger,
    attempt: opts.attempt,
    changedFiles,
    unmapped: impact.unmapped,
    ignored: impact.ignored,
    flows,
    results: [],
    verdict: "nothing-to-verify",
  };

  if (flows.length === 0) {
    deps.log("ProofLoop: no mapped frontend changes — nothing to verify.");
    return base; // not persisted: a no-op must not overwrite the last real verdict
  }

  // Preflight: Kane present, app reachable, tests exist.
  const appUrl = readAppUrl(opts.root);
  const kane = deps.checkKane();
  const problems: string[] = [];
  if (!kane) problems.push("kane-cli not found on PATH — npm install -g @testmuai/kane-cli && kane-cli login");
  if (!(await deps.checkApp(appUrl))) problems.push(`Lynx is not reachable at ${appUrl} — start it with: cd frontend && npm run dev`);
  for (const flow of flows) for (const t of map.flows[flow].tests) if (!existsSync(join(opts.root, t))) problems.push(`missing test file ${t}`);
  if (problems.length) {
    const report: VerifyReport = { ...base, verdict: "error", preflight: { ok: false, message: problems.join("; ") }, finishedAt: deps.now().toISOString() };
    writeReport(opts.root, report);
    return report;
  }

  deps.log(`ProofLoop: ${changedFiles.length} changed file(s) → ${flows.length} flow(s): ${flows.join(", ")}`);
  if (impact.unmapped.length) deps.log(`ProofLoop: unmapped changes (running fallback): ${impact.unmapped.join(", ")}`);

  const budgetS = opts.budgetS ?? 1250;
  const results: FlowResult[] = [];
  const seenTests = new Set<string>();
  for (const flow of flows) {
    const def = map.flows[flow];
    for (const test of def.tests) {
      if (seenTests.has(test)) continue;
      seenTests.add(test);

      const elapsedS = (deps.now().getTime() - startedAt.getTime()) / 1000;
      if (elapsedS > budgetS) {
        const reason = "skipped: ProofLoop time budget exhausted before this flow could run";
        deps.log(`⚠ ${flow} — ${reason}`);
        results.push({
          flow,
          title: def.title ?? flow,
          test,
          status: "error",
          exitCode: 3,
          reason,
          summary: "",
          oneLiner: "",
          finalState: {},
          failedStep: null,
          stepsTotal: 0,
          durationS: 0,
          credits: null,
          replayed: false,
          runDir: null,
          testUrl: null,
          evidence: { screenshot: null, actions: null },
        });
        continue;
      }

      deps.log(`▶ ${flow} — ${test}`);
      const stderrTail: string[] = [];
      const run = await deps.runTest({
        testPath: test,
        cwd: opts.root,
        variablesFile: VARIABLES_FILE,
        timeoutS: opts.timeoutS ?? 300,
        onStep: (s) => deps.log(`  [${flow}] step ${s.step} ${s.status === "passed" ? "✓" : "✗"} ${s.remark}`),
        onStderr: (chunk) => {
          for (const l of chunk.split("\n")) {
            if (l.trim()) {
              stderrTail.push(l.trimEnd());
              if (stderrTail.length > 20) stderrTail.shift();
            }
          }
        },
      });
      const status = deriveOutcome(run.parsed, run.exitCode);
      const end = run.parsed.runEnd;
      const credits = typeof end?.credits === "number" ? end.credits : null;
      const errorReason =
        status === "error"
          ? `kane-cli exited ${run.exitCode} without a run_end event` +
            (stderrTail.length ? ` — stderr: ${stderrTail.slice(-5).join(" | ")}` : "")
          : "";
      const result: FlowResult = {
        flow,
        title: def.title ?? flow,
        test,
        status,
        exitCode: run.exitCode,
        reason: end?.reason ?? errorReason,
        summary: end?.summary ?? "",
        oneLiner: end?.one_liner ?? "",
        finalState: (end?.final_state as Record<string, unknown> | undefined) ?? {},
        failedStep: run.parsed.failedStep ? { step: run.parsed.failedStep.step, remark: run.parsed.failedStep.remark } : null,
        stepsTotal: run.parsed.steps.length,
        durationS: typeof end?.duration === "number" ? end.duration : run.durationS,
        credits,
        replayed: credits === 0 && status !== "error",
        runDir: end?.run_dir ?? null,
        testUrl: end?.test_url ?? null,
        evidence: { screenshot: null, actions: null },
      };
      if (status !== "passed") result.evidence = collectEvidence(opts.root, id, flow, result.runDir);
      deps.log(`${status === "passed" ? "✓" : "✗"} ${flow} ${status} (${result.durationS}s)`);
      results.push(result);
    }
  }

  const verdict: VerifyReport["verdict"] = results.some((r) => r.status === "error")
    ? "error"
    : results.every((r) => r.status === "passed")
      ? "verified"
      : "failed";
  const report: VerifyReport = { ...base, results, verdict, finishedAt: deps.now().toISOString() };
  writeReport(opts.root, report);
  return report;
}

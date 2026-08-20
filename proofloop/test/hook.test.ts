import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { decide, MAX_ATTEMPTS, readAttempts, runHook } from "../src/hook.ts";
import type { VerifyReport } from "../src/report.ts";

function report(verdict: VerifyReport["verdict"]): VerifyReport {
  return {
    id: "x", startedAt: "", finishedAt: "", trigger: "hook", attempt: 1,
    changedFiles: ["frontend/lib/ledger.ts"], unmapped: [], ignored: [], flows: ["profit"],
    results: verdict === "nothing-to-verify" ? [] : [{
      flow: "profit", title: "Profit", test: "kane/profit-invariant_test.md",
      status: verdict === "verified" ? "passed" : verdict === "failed" ? "failed" : "error",
      exitCode: verdict === "verified" ? 0 : 1, reason: "Net showed $680.00, expected $780.00", summary: "", oneLiner: "",
      finalState: { net: "$680.00" }, failedStep: { step: 3, remark: "net mismatch" }, stepsTotal: 3,
      durationS: 10, credits: 0, replayed: true, runDir: null, testUrl: null, evidence: { screenshot: null, actions: null },
    }],
    verdict,
    preflight: verdict === "error" ? { ok: false, message: "Lynx is not reachable at http://localhost:3000" } : undefined,
  };
}

test("nothing to verify → allow silently", () => {
  const d = decide(report("nothing-to-verify"), 0, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.equal(d.exitCode, 0);
  assert.equal(d.message, "");
});

test("verified → allow with a visible proof message", () => {
  const d = decide(report("verified"), 0, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.match(d.message, /✅ ProofLoop: 1\/1/);
});

test("failed under the cap → block with exit 2 and the structured reason", () => {
  const d = decide(report("failed"), 1, MAX_ATTEMPTS);
  assert.equal(d.action, "block");
  assert.equal(d.exitCode, 2);
  assert.match(d.message, /You may not finish yet/);
  assert.match(d.message, /Attempt 1 of 3/);
});

test("failed at the cap → allow with a human-needed message", () => {
  const d = decide(report("failed"), 3, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.match(d.message, /⛔ ProofLoop: 3 attempts exhausted/);
});

test("error → allow with a warning, never block", () => {
  const d = decide(report("error"), 0, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.match(d.message, /⚠️ ProofLoop could not verify/);
  assert.match(d.message, /not reachable/);
});

test("runHook counts attempts per session and clears them on success", async () => {
  const root = mkdtempSync(join(tmpdir(), "proofloop-hook-"));
  const payload = JSON.stringify({ session_id: "s1", cwd: root, hook_event_name: "Stop" });
  let verdict: VerifyReport["verdict"] = "failed";
  const deps = { verify: async () => report(verdict) };

  const first = await runHook(payload, root, deps);
  assert.equal(first.action, "block");
  assert.equal(readAttempts(root, "s1"), 1);

  const second = await runHook(payload, root, deps);
  assert.equal(second.action, "block");
  assert.equal(readAttempts(root, "s1"), 2);

  verdict = "verified";
  const third = await runHook(payload, root, deps);
  assert.equal(third.action, "allow");
  assert.equal(readAttempts(root, "s1"), 0);
});

test("PROOFLOOP_DISABLED=1 allows immediately without verifying", async () => {
  const root = mkdtempSync(join(tmpdir(), "proofloop-hook-"));
  process.env.PROOFLOOP_DISABLED = "1";
  try {
    const d = await runHook("{}", root, { verify: async () => { throw new Error("must not run"); } });
    assert.equal(d.action, "allow");
  } finally {
    delete process.env.PROOFLOOP_DISABLED;
  }
});

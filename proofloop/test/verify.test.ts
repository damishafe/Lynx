import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { runVerify } from "../src/verify.ts";
import { buildBlockReason, readLatest } from "../src/report.ts";
import { createRunParser } from "../src/ndjson.ts";
import type { KaneRunResult } from "../src/kane.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (n: string) => readFileSync(join(here, "fixtures", n), "utf8");

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "proofloop-"));
  mkdirSync(join(root, "proofloop"), { recursive: true });
  mkdirSync(join(root, ".testmuai", "variables"), { recursive: true });
  mkdirSync(join(root, "kane"), { recursive: true });
  writeFileSync(
    join(root, "proofloop", "proofloop.map.json"),
    JSON.stringify({
      flows: {
        booking: { tests: ["kane/booking_test.md"], paths: ["frontend/lib/bookings.ts"] },
        profit: { tests: ["kane/profit_test.md"], paths: ["frontend/lib/ledger.ts", "frontend/lib/bookings.ts"] },
      },
      fallback: ["profit"],
    }),
  );
  writeFileSync(join(root, ".testmuai", "variables", "local.json"), JSON.stringify({ app_url: { value: "http://localhost:3000" } }));
  writeFileSync(join(root, "kane", "booking_test.md"), "# t\n## s\nx\n");
  writeFileSync(join(root, "kane", "profit_test.md"), "# t\n## s\nx\n");
  return root;
}

function fakeRun(fixtureName: string, exitCode: number): KaneRunResult {
  const p = createRunParser();
  p.push(fixture(fixtureName));
  return { exitCode, parsed: p.end(), durationS: 1.5, command: "stub" };
}

const okDeps = {
  checkApp: async () => true,
  checkKane: () => "kane-cli 0.8.4",
  now: () => new Date("2026-08-20T15:00:00Z"),
  log: () => {},
};

test("nothing to verify when no mapped files changed", async () => {
  const root = makeRoot();
  const r = await runVerify({ root, mode: "changed", trigger: "cli", attempt: 1 }, { ...okDeps, getChangedFiles: () => ["README.md"], runTest: async () => { throw new Error("must not run"); } });
  assert.equal(r.verdict, "nothing-to-verify");
  assert.deepEqual(r.flows, []);
});

test("runs each impacted flow once and records a verified report", async () => {
  const root = makeRoot();
  const ran: string[] = [];
  const r = await runVerify(
    { root, mode: "changed", trigger: "cli", attempt: 1 },
    { ...okDeps, getChangedFiles: () => ["frontend/lib/bookings.ts"], runTest: async (o) => { ran.push(o.testPath); return fakeRun("run-passed.ndjson", 0); } },
  );
  assert.deepEqual(ran, ["kane/booking_test.md", "kane/profit_test.md"]);
  assert.equal(r.verdict, "verified");
  assert.equal(r.results[0].status, "passed");
  assert.equal(r.results[0].finalState.revenue, "$1,000.00");
  const latest = readLatest(root);
  assert.equal(latest?.id, r.id);
  assert.ok(existsSync(join(root, ".proofloop", "history.jsonl")));
});

test("a failed flow yields a failed verdict with the failing step and values", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "flow", flow: "profit", trigger: "hook", attempt: 1 },
    { ...okDeps, getChangedFiles: () => ["frontend/lib/ledger.ts"], runTest: async () => fakeRun("run-failed.ndjson", 1) },
  );
  assert.equal(r.verdict, "failed");
  assert.equal(r.results[0].reason, "Net showed $680.00, expected $780.00");
  assert.equal(r.results[0].failedStep?.step, 3);
  const reason = buildBlockReason(r, 1, 3);
  assert.match(reason, /FAILED in a real browser/);
  assert.match(reason, /net=\$680\.00/);
  assert.match(reason, /Attempt 1 of 3/);
  assert.match(reason, /Do not edit kane\//);
});

test("missing run_end or exit 2 is an error, not a failure", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "all", trigger: "cli", attempt: 1 },
    { ...okDeps, getChangedFiles: () => [], runTest: async () => fakeRun("run-no-end.ndjson", 2) },
  );
  assert.equal(r.verdict, "error");
  assert.equal(r.results[0].status, "error");
});

test("preflight failure short-circuits with an error verdict", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "all", trigger: "cli", attempt: 1 },
    { ...okDeps, checkApp: async () => false, getChangedFiles: () => [], runTest: async () => { throw new Error("must not run"); } },
  );
  assert.equal(r.verdict, "error");
  assert.match(r.preflight?.message ?? "", /http:\/\/localhost:3000/);
});

test("unmapped files are reported and trigger the fallback flow", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "changed", trigger: "cli", attempt: 1 },
    { ...okDeps, getChangedFiles: () => ["frontend/lib/vendors.ts"], runTest: async () => fakeRun("run-passed.ndjson", 0) },
  );
  assert.deepEqual(r.unmapped, ["frontend/lib/vendors.ts"]);
  assert.deepEqual(r.flows, ["profit"]);
});

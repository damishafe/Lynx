import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createRunParser, deriveOutcome } from "../src/ndjson.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(here, "fixtures", name), "utf8");

test("captures run_end, steps and typed events from a passing run", () => {
  const p = createRunParser();
  p.push(fixture("run-passed.ndjson"));
  const r = p.end();
  assert.equal(r.runEnd?.status, "passed");
  assert.equal(r.runEnd?.final_state?.revenue, "$1,000.00");
  assert.equal(r.steps.length, 3);
  assert.equal(r.events.length, 1);
  assert.equal(r.events[0].type, "bifurcation");
  assert.equal(r.failedStep, null);
  assert.equal(r.malformedLines, 0);
});

test("records the failed step and tolerates non-JSON noise", () => {
  const p = createRunParser();
  p.push(fixture("run-failed.ndjson"));
  const r = p.end();
  assert.equal(r.runEnd?.status, "failed");
  assert.equal(r.runEnd?.reason, "Net showed $680.00, expected $780.00");
  assert.deepEqual(r.failedStep, { step: 3, status: "failed", remark: "Asserted Net equals $780.00 — found $680.00" });
  assert.equal(r.malformedLines, 0); // plain-text noise is ignored, not counted as malformed
});

test("missing run_end yields null and counts broken JSON objects", () => {
  const p = createRunParser();
  p.push(fixture("run-no-end.ndjson"));
  const r = p.end();
  assert.equal(r.runEnd, null);
  assert.equal(r.malformedLines, 1);
  assert.equal(r.events[0].type, "error");
});

test("handles chunks split mid-line", () => {
  const p = createRunParser();
  const text = fixture("run-passed.ndjson");
  for (let i = 0; i < text.length; i += 7) p.push(text.slice(i, i + 7));
  const r = p.end();
  assert.equal(r.steps.length, 3);
  assert.equal(r.runEnd?.status, "passed");
});

test("lines after run_end are ignored", () => {
  const p = createRunParser();
  p.line('{"type":"run_end","status":"passed"}');
  p.line('{"step":9,"status":"failed","remark":"late"}');
  const r = p.end();
  assert.equal(r.steps.length, 0);
});

test("deriveOutcome combines run_end with the exit code", () => {
  const passed = createRunParser();
  passed.line('{"type":"run_end","status":"passed"}');
  assert.equal(deriveOutcome(passed.end(), 0), "passed");

  const failed = createRunParser();
  failed.line('{"type":"run_end","status":"failed"}');
  assert.equal(deriveOutcome(failed.end(), 1), "failed");

  const noEnd = createRunParser();
  assert.equal(deriveOutcome(noEnd.end(), 0), "error");

  const infra = createRunParser();
  infra.line('{"type":"run_end","status":"passed"}');
  assert.equal(deriveOutcome(infra.end(), 2), "error");
  assert.equal(deriveOutcome(infra.end(), 3), "error");
});

test("a final line without a trailing newline is flushed by end()", () => {
  const p = createRunParser();
  p.push('{"step":1,"status":"passed","remark":"a"}\n{"type":"run_end","status":"passed","final_state":{"k":"v"}}');
  const r = p.end();
  assert.equal(r.steps.length, 1);
  assert.equal(r.runEnd?.status, "passed");
  assert.equal(r.runEnd?.final_state?.k, "v");
});

test("runCredits reads kane-cli's credits_consumed as well as the documented credits field", async () => {
  const { runCredits, stepGlyph } = await import("../src/ndjson.ts");
  assert.equal(runCredits(null), null);
  assert.equal(runCredits({ type: "run_end", status: "passed" }), null);
  assert.equal(runCredits({ type: "run_end", status: "passed", credits: 0 }), 0);
  assert.equal(runCredits({ type: "run_end", status: "passed", credits_consumed: 5.56 }), 5.56);
  assert.equal(stepGlyph("done"), "✓");
  assert.equal(stepGlyph("running"), "…");
  assert.equal(stepGlyph("failed"), "✗");
});

test("a progress event with status 'error' counts as the failed step", () => {
  const p = createRunParser();
  p.line('{"step":4,"status":"error","remark":"assert: Net equals $780.00 — found $680.00"}');
  p.line('{"type":"run_end","status":"failed","reason":"assertion failed"}');
  assert.equal(p.end().failedStep?.step, 4);
});

test("testmd mode: aggregates per-step run_ends and keys the verdict off test_md_summary (passed)", () => {
  const p = createRunParser();
  p.push(fixture("testmd-passed.ndjson"));
  const r = p.end();
  assert.equal(r.runEnds.length, 6);
  assert.equal(r.mdSteps.length, 6);
  assert.equal(r.mdSteps[0].heading, "Reset the demo account");
  assert.equal(r.mdSummary?.overall_status, "passed");
  assert.equal(r.mdSummary?.steps?.author_decisions, 6);
  assert.equal(r.finalState.revenue, "$1,000.00");
  assert.equal(r.failedMdStep, null);
  assert.equal(deriveOutcome(r, 0), "passed");
});

test("testmd mode: a failing step is surfaced with its own run_end reason", async () => {
  const { failureReason, totalCredits, wasReplayed } = await import("../src/ndjson.ts");
  const p = createRunParser();
  p.push(fixture("testmd-failed.ndjson"));
  const r = p.end();
  assert.equal(deriveOutcome(r, 1), "failed");
  assert.equal(r.failedMdStep?.index, 6);
  assert.match(failureReason(r), /^Step 6 "Revenue is recognised": Assertion failed: Revenue showed \$0\.00/);
  assert.equal(r.finalState.revenue, "$0.00");
  assert.ok((totalCredits(r) ?? 0) > 0);
  assert.equal(wasReplayed(r), false);
});

test("testmd mode: a run_end is not terminal — later steps are still parsed", () => {
  const p = createRunParser();
  p.line('{"type":"test_md_step_start","step_index":1,"heading":"a"}');
  p.line('{"type":"run_end","status":"passed","credits_consumed":1}');
  p.line('{"type":"test_md_step_end","step_index":1,"status":"passed","duration_s":1}');
  p.line('{"type":"test_md_step_start","step_index":2,"heading":"b"}');
  p.line('{"type":"run_end","status":"failed","reason":"nope","credits_consumed":0}');
  p.line('{"type":"test_md_step_end","step_index":2,"status":"failed","duration_s":1}');
  p.line('{"type":"test_md_summary","overall_status":"failed","steps":{"total":2,"passed":1,"failed":1,"replay_decisions":2,"author_decisions":0}}');
  p.line('{"type":"test_md_done","overall_status":"failed"}');
  p.line('{"type":"run_end","status":"passed"}'); // trailing noise after done must be ignored
  const r = p.end();
  assert.equal(r.runEnds.length, 2);
  assert.equal(r.failedMdStep?.heading, "b");
  assert.equal(deriveOutcome(r, 1), "failed");
});

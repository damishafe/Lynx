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

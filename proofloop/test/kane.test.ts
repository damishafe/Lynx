import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { buildKaneArgs, kaneVersion, runKaneTest } from "../src/kane.ts";

const here = dirname(fileURLToPath(import.meta.url));
const stub = join(here, "fixtures", "bin", "kane-cli");
const fixture = (n: string) => join(here, "fixtures", n);

test("buildKaneArgs produces the documented testmd invocation", () => {
  assert.deepEqual(
    buildKaneArgs({ testPath: "kane/x_test.md", cwd: "/r", variablesFile: ".testmuai/variables/local.json", timeoutS: 420 }),
    ["testmd", "run", "kane/x_test.md", "--agent", "--headless", "--timeout", "420", "--variables-file", ".testmuai/variables/local.json"],
  );
  assert.ok(buildKaneArgs({ testPath: "kane/x_test.md", cwd: "/r", retry: true }).includes("--retry"));
});

test("runs the stub, streams steps, captures run_end and exit code (pass)", async () => {
  process.env.KANE_STUB_FIXTURE = fixture("run-passed.ndjson");
  process.env.KANE_STUB_EXIT = "0";
  const seen: number[] = [];
  const r = await runKaneTest({ testPath: "kane/x_test.md", cwd: here, kaneBin: stub, onStep: (s) => seen.push(s.step) });
  assert.equal(r.exitCode, 0);
  assert.deepEqual(seen, [1, 2, 3]);
  assert.equal(r.parsed.runEnd?.status, "passed");
  assert.ok(r.durationS >= 0);
  assert.match(r.command, /testmd run kane\/x_test.md --agent/);
});

test("captures a failed run with its failed step", async () => {
  process.env.KANE_STUB_FIXTURE = fixture("run-failed.ndjson");
  process.env.KANE_STUB_EXIT = "1";
  const r = await runKaneTest({ testPath: "kane/x_test.md", cwd: here, kaneBin: stub });
  assert.equal(r.exitCode, 1);
  assert.equal(r.parsed.failedStep?.step, 3);
  assert.equal(r.parsed.runEnd?.final_state?.net, "$680.00");
});

test("kaneVersion returns null for a missing binary and a string for the stub", () => {
  assert.equal(kaneVersion("/definitely/not/here/kane-cli"), null);
  assert.equal(kaneVersion(stub), "kane-cli-stub 0.0.0");
});

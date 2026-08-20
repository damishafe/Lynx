import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runInit } from "../src/init.ts";

function mkGitRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "proofloop-init-"));
  execFileSync("git", ["init", "-q"], { cwd: dir, stdio: "ignore" });
  return dir;
}

const HOOK_MARKER = "proofloop/src/cli.ts\" hook";

function hasProofloopHook(settings: { hooks?: { Stop?: { hooks?: { command?: string }[] }[] } }): boolean {
  return (settings.hooks?.Stop ?? []).some((entry) => (entry.hooks ?? []).some((h) => h.command?.includes(HOOK_MARKER)));
}

test("fresh repo: creates all five files, valid settings JSON with the hook, map has roots", () => {
  const root = mkGitRoot();
  const r = runInit({ cwd: root, appUrl: "http://localhost:5173" });
  assert.equal(r.code, 0);

  const settingsPath = join(root, ".claude", "settings.json");
  const mapPath = join(root, "proofloop", "proofloop.map.json");
  const varsPath = join(root, ".testmuai", "variables", "local.json");
  const contextPath = join(root, ".testmuai", "context.md");
  const smokePath = join(root, "kane", "smoke_test.md");
  for (const p of [settingsPath, mapPath, varsPath, contextPath, smokePath]) assert.ok(existsSync(p), `expected ${p} to exist`);

  const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  assert.ok(hasProofloopHook(settings), "settings.json should contain the ProofLoop Stop hook");

  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  assert.deepEqual(map.roots, ["src/", "app/", "frontend/"]);
  assert.deepEqual(map.flows.smoke.tests, ["kane/smoke_test.md"]);
  assert.deepEqual(map.fallback, ["smoke"]);

  const vars = JSON.parse(readFileSync(varsPath, "utf8"));
  assert.equal(vars.app_url.value, "http://localhost:5173");
  assert.equal(vars.app_url.secret, false);

  const smoke = readFileSync(smokePath, "utf8");
  assert.match(smoke, /mode: testing/);
  assert.match(smoke, /headless: true/);
  assert.match(smoke, /max_steps: 30/);
  assert.match(smoke, /Smoke — the app loads/);
  assert.match(smoke, /\{\{app_url\}\}/);
});

test("no --app-url defaults to http://localhost:3000", () => {
  const root = mkGitRoot();
  runInit({ cwd: root });
  const vars = JSON.parse(readFileSync(join(root, ".testmuai", "variables", "local.json"), "utf8"));
  assert.equal(vars.app_url.value, "http://localhost:3000");
});

test("running twice: second run skips everything, an edit to context.md survives", () => {
  const root = mkGitRoot();
  const first = runInit({ cwd: root });
  assert.equal(first.code, 0);

  const contextPath = join(root, ".testmuai", "context.md");
  const sentinel = "SENTINEL — do not overwrite\n";
  writeFileSync(contextPath, sentinel);

  const second = runInit({ cwd: root });
  assert.equal(second.code, 0);
  assert.equal(readFileSync(contextPath, "utf8"), sentinel);
  assert.ok(second.lines.some((l) => /already wired/i.test(l)));
  assert.ok(!second.lines.some((l) => /^created/i.test(l)));
});

test("existing .claude/settings.json with a different Stop hook is merged, not replaced", () => {
  const root = mkGitRoot();
  mkdirSync(join(root, ".claude"), { recursive: true });
  const existing = { hooks: { Stop: [{ hooks: [{ type: "command", command: "echo some-other-hook", timeout: 5000 }] }] } };
  writeFileSync(join(root, ".claude", "settings.json"), JSON.stringify(existing, null, 2));

  const r = runInit({ cwd: root });
  assert.equal(r.code, 0);

  const settings = JSON.parse(readFileSync(join(root, ".claude", "settings.json"), "utf8"));
  assert.equal(settings.hooks.Stop.length, 2);
  assert.ok(settings.hooks.Stop.some((e: { hooks: { command: string }[] }) => e.hooks.some((h) => h.command === "echo some-other-hook")));
  assert.ok(hasProofloopHook(settings));
});

test("existing settings that already contain the ProofLoop hook are left untouched byte-for-byte", () => {
  const root = mkGitRoot();
  mkdirSync(join(root, ".claude"), { recursive: true });
  const content = `${JSON.stringify(
    {
      hooks: {
        Stop: [
          {
            hooks: [
              {
                type: "command",
                command: 'node --no-warnings "$CLAUDE_PROJECT_DIR/proofloop/src/cli.ts" hook',
                timeout: 1500,
              },
            ],
          },
        ],
      },
    },
    null,
    2,
  )}\n`;
  writeFileSync(join(root, ".claude", "settings.json"), content);

  const r = runInit({ cwd: root });
  assert.equal(r.code, 0);
  assert.equal(readFileSync(join(root, ".claude", "settings.json"), "utf8"), content);
  assert.ok(r.lines.some((l) => /already wired/i.test(l)));
});

test("non-git cwd returns exit code 2 and does not write anything", () => {
  const dir = mkdtempSync(join(tmpdir(), "proofloop-init-nogit-"));
  const r = runInit({ cwd: dir });
  assert.equal(r.code, 2);
  assert.ok(!existsSync(join(dir, ".claude")));
  assert.ok(!existsSync(join(dir, "proofloop")));
});

test("prints next steps including kane-cli login and verify --all", () => {
  const root = mkGitRoot();
  const r = runInit({ cwd: root });
  const joined = r.lines.join("\n");
  assert.match(joined, /kane-cli login/);
  assert.match(joined, /verify --all/);
  assert.match(joined, /restart Claude Code/i);
});

test("--force overwrites a previously-created starter map", () => {
  const root = mkGitRoot();
  runInit({ cwd: root });
  const mapPath = join(root, "proofloop", "proofloop.map.json");
  writeFileSync(mapPath, JSON.stringify({ flows: {}, custom: true }));

  const r = runInit({ cwd: root, force: true });
  assert.equal(r.code, 0);
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  assert.ok(map.flows.smoke, "force should rewrite the starter map");
});

test("fresh foreign repo: copies the zero-dependency CLI into proofloop/ and it runs", () => {
  const root = mkGitRoot();
  const r = runInit({ cwd: root });
  assert.equal(r.code, 0);
  assert.ok(existsSync(join(root, "proofloop", "src", "cli.ts")));
  assert.ok(existsSync(join(root, "proofloop", "src", "hook.ts")));
  assert.ok(existsSync(join(root, "proofloop", "package.json")));
  assert.ok(!existsSync(join(root, "proofloop", "test")), "test/ must never be copied");
  assert.ok(!existsSync(join(root, "proofloop", "node_modules")), "node_modules must never be copied");

  const out = execFileSync(process.execPath, [join(root, "proofloop", "src", "cli.ts"), "help"], { cwd: root, encoding: "utf8" });
  assert.match(out, /ProofLoop/);
});

test("second run does not overwrite a sentinel edit to the copied cli.ts without --force", () => {
  const root = mkGitRoot();
  runInit({ cwd: root });
  const cliPath = join(root, "proofloop", "src", "cli.ts");
  const sentinel = "// SENTINEL — do not overwrite\n";
  writeFileSync(cliPath, sentinel);

  const r2 = runInit({ cwd: root });
  assert.equal(r2.code, 0);
  assert.equal(readFileSync(cliPath, "utf8"), sentinel);
});

test("target root === source root (running init inside the source checkout) skips the CLI copy", () => {
  // ../src/init.ts here IS the module runInit calls import.meta.url on, so its "source root"
  // is always this real proofloop/ checkout. Alias a fresh repo's proofloop/ to that same real
  // directory via a symlink so realpathSync resolves both sides to the identical path — this
  // is the one way to hit the reflexive branch without pointing init at the real repo itself
  // (which would risk writing into it). Nothing here writes through the symlink: the CLI-copy
  // check returns before touching it, and the starter map write below sees an existing file
  // (the real proofloop.map.json, via the symlink) and skips rather than overwriting it.
  const root = mkGitRoot();
  const realProofloopRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  symlinkSync(realProofloopRoot, join(root, "proofloop"), "dir");

  const r = runInit({ cwd: root });
  assert.equal(r.code, 0);
  assert.ok(r.lines.some((l) => l === "skipped    proofloop/ (already the source checkout)"));
});

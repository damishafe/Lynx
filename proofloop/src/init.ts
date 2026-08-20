import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { gitRoot } from "./diff.ts";

export type InitOptions = {
  cwd: string;
  appUrl?: string;
  force?: boolean;
};

export type InitResult = {
  code: number;
  lines: string[];
};

const HOOK_COMMAND = 'node --no-warnings "$CLAUDE_PROJECT_DIR/proofloop/src/cli.ts" hook';
const HOOK_MARKER = "proofloop/src/cli.ts\" hook";

type JsonObject = Record<string, unknown>;

function proofloopStopHookEntry(): JsonObject {
  return { hooks: [{ type: "command", command: HOOK_COMMAND, timeout: 1500 }] };
}

function hasProofloopHook(stop: unknown): boolean {
  if (!Array.isArray(stop)) return false;
  for (const entry of stop) {
    const hooks = (entry as { hooks?: unknown } | null)?.hooks;
    if (!Array.isArray(hooks)) continue;
    for (const h of hooks) {
      const command = (h as { command?: unknown } | null)?.command;
      if (typeof command === "string" && command.includes(HOOK_MARKER)) return true;
    }
  }
  return false;
}

/** Write or merge .claude/settings.json. Never overwrites unrelated hooks; force does not apply here. */
function ensureSettings(root: string, lines: string[]): void {
  const dir = join(root, ".claude");
  const file = join(dir, "settings.json");
  const label = ".claude/settings.json";

  if (!existsSync(file)) {
    mkdirSync(dir, { recursive: true });
    const settings = { hooks: { Stop: [proofloopStopHookEntry()] } };
    writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
    lines.push(`created    ${label}`);
    return;
  }

  let parsed: JsonObject;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8")) as JsonObject;
  } catch {
    lines.push(`skipped    ${label} (exists but is not valid JSON — wire the Stop hook by hand)`);
    return;
  }

  const hooks = (parsed.hooks as JsonObject | undefined) ?? {};
  const stop = (hooks.Stop as unknown[] | undefined) ?? [];

  if (hasProofloopHook(stop)) {
    lines.push(`already wired  ${label} (Stop hook present)`);
    return;
  }

  stop.push(proofloopStopHookEntry());
  hooks.Stop = stop;
  parsed.hooks = hooks;
  writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
  lines.push(`merged     ${label} (added the ProofLoop Stop hook alongside existing hooks)`);
}

function writeArtifact(path: string, content: string, label: string, force: boolean, lines: string[]): void {
  const existed = existsSync(path);
  if (existed && !force) {
    lines.push(`skipped    ${label} (already exists — pass --force to overwrite)`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  lines.push(`${existed ? "overwrote " : "created   "} ${label}`);
}

function starterMap(): string {
  const map = {
    $comment:
      "Maps changed files to the business flows Kane must re-prove. Paths are globs relative to the repo root. A file matching `shared` selects every flow; a changed file matching nothing is reported as unmapped and triggers `fallback`. `roots` lists the path prefixes ProofLoop considers at all — a changed file outside every root is ignored entirely.",
    flows: {
      smoke: {
        title: "Smoke — the app loads",
        tests: ["kane/smoke_test.md"],
        paths: ["src/**", "app/**", "frontend/**"],
      },
    },
    shared: [],
    fallback: ["smoke"],
    ignore: ["**/*.md", "**/*.test.*"],
    roots: ["src/", "app/", "frontend/"],
  };
  return `${JSON.stringify(map, null, 2)}\n`;
}

function starterVariables(appUrl: string): string {
  return `${JSON.stringify({ app_url: { value: appUrl, secret: false } }, null, 2)}\n`;
}

function starterContext(): string {
  return [
    "# <Your app> — context for Kane",
    "",
    "<!-- One or two sentences: what this app is and who uses it. -->",
    "",
    "How to reach a logged-in state: <!-- e.g. a seeded /demo button, test credentials, a magic link -->",
    "",
    "Money and IDs are read exactly as displayed — do not reformat, round, or reinterpret them.",
    "",
  ].join("\n");
}

function starterSmokeTest(): string {
  return [
    "---",
    "mode: testing",
    "headless: true",
    "max_steps: 30",
    "---",
    "# Smoke — the app loads",
    "",
    "## Open the app",
    "Go to {{app_url}} and wait until the page has finished loading.",
    "",
    "## The app is alive",
    'Assert the page shows a visible heading or title and no error message such as "Application error" or "500".',
    "",
  ].join("\n");
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

function realOrResolved(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
}

/**
 * Copy the zero-dependency CLI (package.json, tsconfig.json, every file under src/) into
 * <root>/proofloop/ so the Stop hook has something to run. Deliberately never touches test/,
 * node_modules, or proofloop.map.json (the map is the starter one ensureMap writes). Skipped
 * entirely when the target IS the source checkout (running init inside this very repo).
 */
function ensureCliInstalled(root: string, force: boolean, lines: string[]): void {
  const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const targetRoot = join(root, "proofloop");

  if (realOrResolved(sourceRoot) === realOrResolved(targetRoot)) {
    lines.push("skipped    proofloop/ (already the source checkout)");
    return;
  }

  const sourceSrc = join(sourceRoot, "src");
  const files: { from: string; to: string }[] = [
    { from: join(sourceRoot, "package.json"), to: join(targetRoot, "package.json") },
    { from: join(sourceRoot, "tsconfig.json"), to: join(targetRoot, "tsconfig.json") },
    ...listFilesRecursive(sourceSrc).map((from) => ({ from, to: join(targetRoot, "src", relative(sourceSrc, from)) })),
  ].filter((f) => existsSync(f.from));

  let installed = 0;
  let skipped = 0;
  for (const { from, to } of files) {
    const existed = existsSync(to);
    if (existed && !force) {
      skipped += 1;
      continue;
    }
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    installed += 1;
  }

  if (installed === 0 && skipped > 0) {
    lines.push(`skipped    proofloop/ (${skipped} file${skipped === 1 ? "" : "s"} already exist — pass --force to overwrite)`);
  } else if (skipped > 0) {
    lines.push(`installed  proofloop/ (${installed} file${installed === 1 ? "" : "s"}, ${skipped} already existed — pass --force to overwrite)`);
  } else {
    lines.push(`installed  proofloop/ (${installed} file${installed === 1 ? "" : "s"})`);
  }
}

export function runInit(opts: InitOptions): InitResult {
  let root: string;
  try {
    root = gitRoot(opts.cwd);
  } catch {
    return {
      code: 2,
      lines: ["ProofLoop init: not a git repository. Run `git init` first, then re-run `proofloop init` from the repo root."],
    };
  }

  const force = opts.force ?? false;
  const appUrl = opts.appUrl ?? "http://localhost:3000";
  const lines: string[] = [];

  ensureCliInstalled(root, force, lines);
  ensureSettings(root, lines);
  writeArtifact(join(root, "proofloop", "proofloop.map.json"), starterMap(), "proofloop/proofloop.map.json", force, lines);
  writeArtifact(join(root, ".testmuai", "variables", "local.json"), starterVariables(appUrl), ".testmuai/variables/local.json", force, lines);
  writeArtifact(join(root, ".testmuai", "context.md"), starterContext(), ".testmuai/context.md", force, lines);
  writeArtifact(join(root, "kane", "smoke_test.md"), starterSmokeTest(), "kane/smoke_test.md", force, lines);

  lines.push("");
  lines.push("Next steps:");
  lines.push("  npm i -g @testmuai/kane-cli && kane-cli login");
  lines.push("  start your app (however it runs locally)");
  lines.push("  node proofloop/src/cli.ts verify --all");
  lines.push("  edit proofloop/proofloop.map.json to map your files to your flows");
  lines.push("  restart Claude Code so the Stop hook loads");

  return { code: 0, lines };
}

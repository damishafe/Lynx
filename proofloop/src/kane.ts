import { execFileSync, spawn } from "node:child_process";

import { createRunParser, type ParsedRun, type ProgressEvent } from "./ndjson.ts";

export type KaneRunOptions = {
  /** Path to a `*_test.md`, relative to `cwd`. */
  testPath: string;
  cwd: string;
  variablesFile?: string;
  timeoutS?: number;
  headless?: boolean; // default true
  retry?: boolean; // default true (see buildKaneArgs)
  kaneBin?: string;
  onStep?: (step: ProgressEvent) => void;
  onStderr?: (chunk: string) => void;
};

export type KaneRunResult = {
  exitCode: number;
  parsed: ParsedRun;
  durationS: number;
  command: string;
};

export function resolveKaneBin(explicit?: string): string {
  return explicit ?? process.env.PROOFLOOP_KANE_BIN ?? "kane-cli";
}

export function buildKaneArgs(opts: KaneRunOptions): string[] {
  const args = ["testmd", "run", opts.testPath, "--agent"];
  if (opts.headless !== false) args.push("--headless");
  // --retry: on replay failure Kane restarts with a shrinking replay window and falls back to
  // re-authoring the step — turning transient analyzer flakes into real verdicts. Needs a
  // configured project (kane-cli auto-configures one on first run). PROOFLOOP_KANE_RETRY=0 disables.
  const retry = opts.retry ?? process.env.PROOFLOOP_KANE_RETRY !== "0";
  if (retry) args.push("--retry");
  if (opts.timeoutS) args.push("--timeout", String(opts.timeoutS));
  if (opts.variablesFile) args.push("--variables-file", opts.variablesFile);
  return args;
}

/** Spawn `kane-cli testmd run … --agent`, parse stdout NDJSON live, resolve on close. */
export function runKaneTest(opts: KaneRunOptions): Promise<KaneRunResult> {
  const bin = resolveKaneBin(opts.kaneBin);
  const args = buildKaneArgs(opts);
  const command = [bin, ...args].join(" ");
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    const parser = createRunParser();

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      const before = parser.result().steps.length;
      parser.push(chunk);
      if (opts.onStep) {
        for (const step of parser.result().steps.slice(before)) opts.onStep(step);
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => opts.onStderr?.(chunk));

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 2,
        parsed: parser.end(),
        durationS: Math.round((Date.now() - started) / 100) / 10,
        command,
      });
    });
  });
}

export function kaneVersion(bin: string = resolveKaneBin()): string | null {
  try {
    return execFileSync(bin, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

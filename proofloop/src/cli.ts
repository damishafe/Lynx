#!/usr/bin/env node
/**
 * ProofLoop — every AI-written change must prove itself in a real browser.
 *
 *   node proofloop/src/cli.ts verify [--changed | --all | --flow <name>] [--json] [--timeout <s>]
 *   node proofloop/src/cli.ts hook            # Claude Code Stop hook (reads hook JSON on stdin)
 *   node proofloop/src/cli.ts report [--json] # print the latest verdict
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { gitRoot } from "./diff.ts";
import { runHook } from "./hook.ts";
import { formatConsole, proofloopDir, readLatest, type VerifyReport } from "./report.ts";
import { runVerify } from "./verify.ts";

function flag(args: string[], name: string): boolean {
  return args.includes(name);
}
function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

async function main(): Promise<number> {
  const [command = "help", ...args] = process.argv.slice(2);
  const root = gitRoot(process.cwd());

  if (command === "verify") {
    const mode = flag(args, "--all") ? "all" : option(args, "--flow") ? "flow" : "changed";
    const timeoutRaw = option(args, "--timeout");
    const t = Number(timeoutRaw);
    let report: VerifyReport;
    try {
      report = await runVerify({
        root,
        mode,
        flow: option(args, "--flow"),
        trigger: "cli",
        attempt: 1,
        timeoutS: Number.isFinite(t) && t > 0 ? t : undefined,
      });
    } catch (err) {
      // A CLI typo (unknown --flow name) is a user error, not a crash: report it and exit 2
      // rather than falling through to the outer crash handler, which forces exit 0 for hooks.
      if (mode === "flow" && err instanceof Error && err.message.startsWith("Unknown flow")) {
        process.stderr.write(`${err.message}\n`);
        return 2;
      }
      throw err;
    }
    process.stdout.write(flag(args, "--json") ? `${JSON.stringify(report, null, 2)}\n` : `${formatConsole(report)}\n`);
    return report.verdict === "verified" || report.verdict === "nothing-to-verify" ? 0 : report.verdict === "failed" ? 1 : 2;
  }

  if (command === "hook") {
    // Progress goes to a log file, not stderr: on a block, stderr IS the reason Claude reads.
    mkdirSync(proofloopDir(root), { recursive: true });
    const logFile = join(proofloopDir(root), "hook.log");
    const log = (m: string) => appendFileSync(logFile, `${new Date().toISOString()} ${m}\n`);
    const stdin = await readStdin();
    log(`--- Stop hook fired; payload=${stdin.trim().slice(0, 200)}`);
    const decision = await runHook(stdin, root, { log });
    log(`decision=${decision.action} verdict=${decision.verdict ?? "n/a"} exit=${decision.exitCode}`);
    if (decision.action === "block") {
      process.stderr.write(`${decision.message}\n`);
      return 2;
    }
    if (decision.message) process.stdout.write(`${JSON.stringify({ systemMessage: decision.message })}\n`);
    return 0;
  }

  if (command === "report") {
    const latest = readLatest(root);
    if (!latest) {
      process.stdout.write("No ProofLoop runs yet. Run: node proofloop/src/cli.ts verify --all\n");
      return 0;
    }
    process.stdout.write(flag(args, "--json") ? `${JSON.stringify(latest, null, 2)}\n` : `${formatConsole(latest)}\n`);
    return 0;
  }

  process.stdout.write(
    [
      "ProofLoop — every AI-written change must prove itself in a real browser.",
      "",
      "  verify [--changed | --all | --flow <name>] [--json] [--timeout <s>]",
      "  hook                      Claude Code Stop hook adapter (stdin JSON → exit 0 allow / exit 2 block)",
      "  report [--json]           Show the latest verdict",
      "",
      "Env: PROOFLOOP_DISABLED=1 skips the hook · PROOFLOOP_KANE_BIN overrides the kane-cli binary",
    ].join("\n") + "\n",
  );
  return command === "help" ? 0 : 2;
}

main().then(
  (code) => {
    // Set the exit code and let the event loop drain naturally, rather than forcing
    // process.exit(): stdout/stderr writes can be asynchronous when piped, and an
    // immediate exit can truncate the block reason or systemMessage before it lands.
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`ProofLoop crashed: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    // A crash must never trap the agent: exit 0 so Claude can stop. The error is visible in hook.log / stderr.
    process.exit(0);
  },
);

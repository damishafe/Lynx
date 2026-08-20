/**
 * Kane CLI `--agent` NDJSON parsing.
 *
 * Contract (from TestMu's agent doc): one JSON object per stdout line. Progress
 * events are untyped `{step, status, remark}`; typed events carry `type`; the
 * terminal `run_end` event is the only stable machine-readable schema and is
 * always the last meaningful line. Automation keys off `run_end` only.
 */

export type RunEnd = {
  type: "run_end";
  status: string; // "passed" | "failed"
  summary?: string;
  one_liner?: string;
  reason?: string;
  duration?: number;
  credits?: number;
  /** Field name actually emitted by kane-cli 0.8.x (the agent doc says `credits`). */
  credits_consumed?: number;
  final_state?: Record<string, unknown>;
  context?: {
    memory?: Record<string, unknown>;
    variables?: Record<string, unknown>;
    pointer?: string;
  };
  session_dir?: string;
  run_dir?: string;
  test_url?: string;
};

export type ProgressEvent = { step: number; status: string; remark: string };
export type TypedEvent = { type: string } & Record<string, unknown>;

export type ParsedRun = {
  runEnd: RunEnd | null;
  steps: ProgressEvent[];
  events: TypedEvent[];
  failedStep: ProgressEvent | null;
  malformedLines: number;
};

export type Outcome = "passed" | "failed" | "error";

export function createRunParser() {
  const result: ParsedRun = {
    runEnd: null,
    steps: [],
    events: [],
    failedStep: null,
    malformedLines: 0,
  };
  let buffer = "";

  function handle(line: string): void {
    if (result.runEnd) return; // terminal event seen — ignore trailing output
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) return; // human-readable noise, not NDJSON
    let obj: unknown;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      result.malformedLines += 1;
      return;
    }
    if (!obj || typeof obj !== "object") return;
    const rec = obj as Record<string, unknown>;
    if (rec.type === "run_end") {
      result.runEnd = rec as RunEnd;
      return;
    }
    if (typeof rec.type === "string") {
      result.events.push(rec as TypedEvent);
      return;
    }
    if (typeof rec.step === "number") {
      const ev: ProgressEvent = {
        step: rec.step,
        status: String(rec.status ?? ""),
        remark: String(rec.remark ?? ""),
      };
      result.steps.push(ev);
      if (ev.status === "failed" || ev.status === "error") result.failedStep = ev;
    }
  }

  return {
    /** Feed raw stdout; lines are split on "\n" and partial lines are buffered. */
    push(chunk: string): void {
      buffer += chunk;
      let idx = buffer.indexOf("\n");
      while (idx >= 0) {
        handle(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 1);
        idx = buffer.indexOf("\n");
      }
    },
    /** Feed one complete line. */
    line(line: string): void {
      handle(line);
    },
    /** Flush any buffered partial line and return the result. */
    end(): ParsedRun {
      if (buffer.trim()) handle(buffer);
      buffer = "";
      return result;
    },
    result(): ParsedRun {
      return result;
    },
  };
}

/**
 * Exit codes: 0 passed · 1 failed · 2 infra/auth/setup · 3 timeout/cancelled.
 * A missing run_end means Kane never reached a verdict → "error", never "failed":
 * an error must not be fed back to the agent as if the app were wrong.
 */
export function deriveOutcome(parsed: ParsedRun, exitCode: number): Outcome {
  if (exitCode === 2 || exitCode === 3) return "error";
  if (!parsed.runEnd) return "error";
  return parsed.runEnd.status === "passed" ? "passed" : "failed";
}

/** Credits for a run: kane-cli 0.8.x emits `credits_consumed`; the agent doc documents `credits`. */
export function runCredits(end: RunEnd | null): number | null {
  if (!end) return null;
  if (typeof end.credits === "number") return end.credits;
  if (typeof end.credits_consumed === "number") return end.credits_consumed;
  return null;
}

/** Progress-event status → display glyph. kane-cli emits running/done; the doc says passed/failed. */
export function stepGlyph(status: string): string {
  if (status === "failed" || status === "error") return "✗";
  if (status === "running") return "…";
  return "✓";
}

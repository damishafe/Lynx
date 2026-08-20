/**
 * Kane CLI `--agent` NDJSON parsing.
 *
 * Two shapes are handled, both observed against kane-cli 0.8.4:
 *
 * 1. Ad-hoc `kane-cli run`: progress events (`{step,status,remark}`), typed
 *    events, and ONE terminal `run_end`. Automation keys off `run_end`.
 *
 * 2. `kane-cli testmd run`: every `## step` of the test file becomes a nested
 *    run — `test_md_step_start` → (…events…, `run_end`) → `test_md_step_end` —
 *    and the file-level verdict arrives at the very end as `test_md_summary`
 *    (`overall_status`, step counts, replay vs. author decisions, `share_url`)
 *    followed by `test_md_done`. A single `run_end` is therefore NOT terminal
 *    in this mode; the parser aggregates all of them and keys the verdict off
 *    `test_md_summary` / `test_md_done`.
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

export type TestMdSummary = {
  type: "test_md_summary";
  overall_status: string; // "passed" | "failed"
  duration_s?: number;
  steps?: {
    total?: number;
    passed?: number;
    failed?: number;
    skipped?: number;
    replay_decisions?: number;
    author_decisions?: number;
  };
  share_url?: string;
  cancelled?: boolean;
};

export type TestMdStep = {
  index: number;
  heading: string;
  status: string; // "passed" | "failed" | "skipped"
  durationS: number | null;
  /** The nested run_end that concluded this step (carries reason/final_state). */
  runEnd: RunEnd | null;
};

export type ProgressEvent = { step: number; status: string; remark: string };
export type TypedEvent = { type: string } & Record<string, unknown>;

export type ParsedRun = {
  /** Ad-hoc mode: the terminal run_end. testmd mode: the LAST nested run_end. */
  runEnd: RunEnd | null;
  /** Every run_end seen (one per testmd step). */
  runEnds: RunEnd[];
  /** final_state merged across all run_ends (later steps win). */
  finalState: Record<string, unknown>;
  steps: ProgressEvent[];
  events: TypedEvent[];
  failedStep: ProgressEvent | null;
  /** testmd mode only. */
  mdSteps: TestMdStep[];
  mdSummary: TestMdSummary | null;
  /** testmd mode: first step that did not pass. */
  failedMdStep: TestMdStep | null;
  malformedLines: number;
};

export type Outcome = "passed" | "failed" | "error";

export function createRunParser() {
  const result: ParsedRun = {
    runEnd: null,
    runEnds: [],
    finalState: {},
    steps: [],
    events: [],
    failedStep: null,
    mdSteps: [],
    mdSummary: null,
    failedMdStep: null,
    malformedLines: 0,
  };
  let buffer = "";
  let done = false; // terminal event seen — ignore trailing output
  let inTestMd = false; // saw a test_md_* event: run_end is per-step, not terminal
  let openStep: { index: number; heading: string } | null = null;
  let stepRunEnd: RunEnd | null = null;

  function handle(line: string): void {
    if (done) return;
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
    const type = typeof rec.type === "string" ? rec.type : null;

    if (type === "run_end") {
      const end = rec as RunEnd;
      result.runEnd = end;
      result.runEnds.push(end);
      if (end.final_state && typeof end.final_state === "object") {
        Object.assign(result.finalState, end.final_state);
      }
      if (inTestMd) {
        stepRunEnd = end; // the step's verdict arrives with test_md_step_end
      } else {
        done = true; // ad-hoc mode: run_end is terminal
      }
      return;
    }

    if (type === "test_md_step_start") {
      inTestMd = true;
      openStep = {
        index: Number(rec.step_index ?? result.mdSteps.length + 1),
        heading: String(rec.heading ?? ""),
      };
      stepRunEnd = null;
      result.events.push(rec as TypedEvent);
      return;
    }

    if (type === "test_md_step_end") {
      inTestMd = true;
      const step: TestMdStep = {
        index: Number(rec.step_index ?? openStep?.index ?? result.mdSteps.length + 1),
        heading: openStep?.heading ?? "",
        status: String(rec.status ?? ""),
        durationS: typeof rec.duration_s === "number" ? rec.duration_s : null,
        runEnd: stepRunEnd,
      };
      result.mdSteps.push(step);
      if (step.status !== "passed" && !result.failedMdStep) result.failedMdStep = step;
      openStep = null;
      stepRunEnd = null;
      result.events.push(rec as TypedEvent);
      return;
    }

    if (type === "test_md_summary") {
      inTestMd = true;
      result.mdSummary = rec as TestMdSummary;
      result.events.push(rec as TypedEvent);
      return;
    }

    if (type === "test_md_done") {
      inTestMd = true;
      if (!result.mdSummary && typeof rec.overall_status === "string") {
        result.mdSummary = { type: "test_md_summary", overall_status: rec.overall_status, duration_s: rec.duration_s as number | undefined, share_url: rec.share_url as string | undefined };
      }
      result.events.push(rec as TypedEvent);
      done = true;
      return;
    }

    if (type) {
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
 * testmd mode: the verdict is `test_md_summary.overall_status`. Ad-hoc mode:
 * `run_end.status`. No terminal event at all means Kane never reached a
 * verdict → "error", never "failed": an error must not be fed back to the
 * agent as if the app were wrong.
 */
export function deriveOutcome(parsed: ParsedRun, exitCode: number): Outcome {
  if (exitCode === 2 || exitCode === 3) return "error";
  if (parsed.mdSummary) {
    if (parsed.mdSummary.cancelled) return "error";
    return parsed.mdSummary.overall_status === "passed" ? "passed" : "failed";
  }
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

/** Total credits across every run_end in the output (testmd: one per step). */
export function totalCredits(parsed: ParsedRun): number | null {
  if (parsed.runEnds.length === 0) return null;
  let total = 0;
  let seen = false;
  for (const end of parsed.runEnds) {
    const c = runCredits(end);
    if (c !== null) {
      total += c;
      seen = true;
    }
  }
  return seen ? Math.round(total * 100) / 100 : null;
}

/** True when every testmd step replayed from its recording (no authoring decisions). */
export function wasReplayed(parsed: ParsedRun): boolean {
  const s = parsed.mdSummary?.steps;
  if (s && typeof s.author_decisions === "number") {
    return s.author_decisions === 0 && (s.replay_decisions ?? 0) > 0;
  }
  return totalCredits(parsed) === 0;
}

/** The human-readable reason a run failed, preferring the failing testmd step's run_end. */
export function failureReason(parsed: ParsedRun): string {
  const md = parsed.failedMdStep;
  if (md) {
    const inner = md.runEnd?.reason || md.runEnd?.summary || "";
    return inner ? `Step ${md.index} "${md.heading}": ${inner}` : `Step ${md.index} "${md.heading}" ${md.status}`;
  }
  return parsed.runEnd?.reason ?? "";
}

/** Progress-event status → display glyph. kane-cli emits running/done; the doc says passed/failed. */
export function stepGlyph(status: string): string {
  if (status === "failed" || status === "error") return "✗";
  if (status === "running") return "…";
  return "✓";
}

# Demo script (≤ 3:00, interesting part first)

Source table: `docs/superpowers/specs/2026-08-20-proofloop-design.md` §8. This is that
table expanded into a shot list — what's on screen, what's said, and what has to be true before
recording starts.

## Prerequisite: author every test from the CLI

Author all four tests from the CLI (`node proofloop/src/cli.ts verify --all`, from the repo
root) before any hook run; never let the first authoring run happen inside a Stop hook. This is
the only step that authors every flow at once and spends credits doing it — it also writes the
`kane/output-*/` recordings the rest of the loop (and the recorded demo) replays for free. A
Stop hook that has to author every flow from scratch will blow its own time budget.

## Before recording: commit the acceptance-criteria change

The demo's whole point is showing Kane catch a real regression and Claude fix it — not a staged
failure. So the "requirement" changes *before* the prompt is ever run, the same way a product
spec would change, and the failing test is committed like any other spec update:

1. Edit the last step of `kane/profit-invariant_test.md` from

   ```
   Assert revenue equals "$1,000.00", costs equals "$120.00" and net equals "$880.00".
   ```

   to

   ```
   Assert revenue equals "$1,000.00", costs equals "$220.00" and net equals "$780.00".
   ```

   and add a new assertion line: `Assert the card shows a line for the platform fee equal to
   "$100.00".`

2. Commit that as its own change (acceptance criteria first, implementation second) — this is
   the commit that makes the *current* app fail the flow, on purpose, because the requirement
   moved, not because a bug was planted.

3. Do **not** touch any application code. The dashboard doesn't have a platform fee yet, so
   `profit-invariant_test.md` will fail the moment Kane runs it — that's expected and is the
   whole first act of the video.

4. Start a fresh Claude Code session with the Stop hook active (`.claude/settings.json`,
   `npm run dev` running in `frontend/`, `kane-cli login` done, `PROOFLOOP_DISABLED` unset).

5. Record whatever actually happens when the prompt below is run. Do not plant a bug, do not
   pre-script Claude's fix, and do not retake a passing run to look cleaner — the browser
   evidence is the pitch.

6. Do not commit before ending the turn — ProofLoop verifies the uncommitted diff; a pre-stop
   commit would skip verification. Let Claude's edits stay uncommitted until the loop verifies.

## The prompt

> Add a 10% platform fee to every booking and show it in the profitability breakdown.
> Acceptance: for a $1,000 booking with a $120 clean, the Profitability card reads Revenue
> $1,000.00 / Costs $220.00 / Net $780.00, and the card shows the platform fee line.

## Shot list

| Time | Screen | Action / narration | Notes |
|---|---|---|---|
| 0:00–0:10 | Title card | *"AI can write Lynx. The dangerous part is believing it when it says it's finished."* Four-frame strip: CLAUDE CHANGE → KANE ❌ → AUTO-FIX → KANE ✅ | Static title, no app on screen yet. |
| 0:10–0:35 | Lynx dashboard tour | Walk `/dashboard`: units, bookings, cleaning work orders, vendor payouts, the Profitability card on Overview. | Freshly reset via `/demo` → "Reset & launch demo" so the seed state is deterministic. |
| 0:35–1:00 | Claude Code terminal | Paste the exact prompt above into a fresh session. Claude reads the code, edits `frontend/lib/ledger.ts` / `frontend/components/dashboard/profitability-card.tsx` (or wherever it lands), then tries to stop. | This is the only prompt given — no hints about ProofLoop or Kane. |
| 1:00–1:30 | Stop hook firing | Terminal shows `proofloop hook`: CHANGE DETECTED under `frontend/` → impacted flows resolved from `proofloop.map.json` → Kane opens headless Chrome, creates the $1,000 booking, checks out, completes the turnover clean… ❌ `Net showed $680.00, expected $780.00` (or whatever Kane actually reports). | Whatever Kane's real `run_end.reason` says — do not rewrite it for the recording. |
| 1:30–2:00 | Claude Code transcript | The structured block reason (exit code 2, reason on stderr) appears in Claude's context. Claude diagnoses the diff between what it wrote and what the flow asserts, edits the code again, tries to stop a second time. Kane re-runs → ✅ (or, if attempt 2 also fails, that's the last automatic repair round — `MAX_ATTEMPTS = 3` means attempts 1 and 2 block and a third failure allows the stop with a human-needed message instead of retrying again). | If it takes a second repair loop, keep that in the cut — it's the demonstration, not a blooper. Do not narrate a third automatic retry; there isn't one. |
| 2:00–2:30 | `http://localhost:3000/proofloop` | Open the status page: flows verified, repair iteration count, evidence links. Click through to a Kane screenshot / run URL. | Confirms the loop's output is inspectable, not just a terminal log. |
| 2:30–2:55 | Close | *"Every critical Lynx workflow is a readable Kane test. ProofLoop maps AI changes to affected flows, Kane runs them in a real browser, and failures go straight back to the agent. The agent doesn't decide when it's done. The browser evidence does."* | End on the verified `/proofloop` page or the final green terminal output. |

## After recording

Link the finished video from `README.md` (replacing the `_coming before submission_`
placeholder) and from `docs/submission.md`.

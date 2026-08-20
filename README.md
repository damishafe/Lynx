# Lynx + ProofLoop

Lynx is an operations dashboard for short-term-rental hosts: bookings, unit status, turnover
cleaning, vendor payouts and a live profitability ledger. It was built almost entirely by
Claude Code. **ProofLoop** is the verification layer that made that safe to ship: every time
Claude Code tries to end a turn with uncommitted changes under `frontend/`, a Stop hook maps
those changes to the business flows they could break, replays the matching `kane/*_test.md`
tests in a real headless Chrome via [Kane CLI](https://www.testmuai.com/support/docs/kane-cli-introduction/), and **blocks the stop** —
feeding Kane's failure report straight back to Claude — until the flows pass in the browser,
not just in the agent's head.

## Run it (≈60 seconds)

```bash
git clone <this-repo> && cd lynx
cd frontend && cp .env.example .env.local
# paste a MONGODB_URI into .env.local — Atlas (mongodb+srv://…) or local (see below)
npm install && npm run dev
```

Open `http://localhost:3000/demo` and click **"Reset & launch demo"**. That seeds three units,
two vendors and signs you in — no bookings, no work orders, a clean slate every time.

No Atlas account handy? Local MongoDB works too:

```bash
docker run -d --name lynx-mongo -p 27017:27017 mongo:7
# MONGODB_URI=mongodb://localhost:27017
```

## Run ProofLoop

From the repo root (a second terminal — keep `npm run dev` running in `frontend/`):

```bash
npm i -g @testmuai/kane-cli && kane-cli login   # or: kane-cli login --oauth
node proofloop/src/cli.ts verify --all
```

Expected: four `✓ …` lines and `VERIFIED — 4/4 flows proven in a real browser`, exit 0. The
first run authors each test (spends credits); subsequent runs replay the committed
`kane/output-*/` recordings at 0 credits. Then open `http://localhost:3000/proofloop` to see the
same verdict as a live status page: flows verified, repair iterations, evidence.

Set `PROOFLOOP_DISABLED=1` to skip the Stop hook entirely (e.g. `npm run dev` isn't running).

## How the loop closes

```
Claude Code session (the coding agent)
  │ edits frontend/…
  │ attempts to stop (turn ends)
  ▼
Stop hook  ──►  node proofloop/src/cli.ts hook        (.claude/settings.json, timeout 1500s)
                  ├─ changed files   git diff HEAD + staged + untracked, scoped to frontend/
                  ├─ impacted flows  proofloop/proofloop.map.json  (flow → paths[] + tests[])
                  ├─ preflight       GET {{app_url}} reachable? kane-cli present?
                  ├─ for each flow   kane-cli testmd run kane/<flow>_test.md --agent --headless
                  │                  (Chrome → http://localhost:3000/demo → real user flow)
                  ├─ parse NDJSON    terminal `run_end` per flow (status/reason/summary/final_state/run_dir/test_url)
                  ├─ record          .proofloop/latest.json, .proofloop/history.jsonl, .proofloop/evidence/<run>/
                  ├─ PASS            allow stop  + systemMessage "✅ ProofLoop: N/N flows verified"
                  └─ FAIL            exit code 2 + structured reason on stderr
                                     → Claude reads it, fixes code → next stop re-fires Kane
```

The Stop-hook decision policy (`proofloop hook`):

| Situation | Output | Why |
|---|---|---|
| No changed files under `frontend/` | allow (no output) | Plain conversation turns must never launch Chrome. |
| `verify` → verdict `verified` | allow + `systemMessage: "✅ ProofLoop: N/N flows verified in a real browser (Xs)"` | Make the proof visible in the transcript. |
| `verify` → verdict `failed` and attempts < 3 | exit code 2 with a structured reason on stderr (Claude reads it and keeps working) | Claude must keep working. |
| `verify` → verdict `failed` and attempts ≥ 3 | allow + `systemMessage: "⛔ ProofLoop: 3 attempts exhausted — human needed. See .proofloop/latest.json"` | Never trap the agent forever. |
| preflight/infra error (exit 2/3) | allow + `systemMessage` warning | An unreachable dev server is not a code failure. |

Attempts are counted per Claude session and reset when a verification passes.
`PROOFLOOP_DISABLED=1` skips the hook outright.

## The Kane contract

Four `kane/*_test.md` flows are the entire behavioral contract Lynx has to hold. Each is a
plain-English Markdown test Kane replays step by step in a real browser:

| Test | Proves |
|---|---|
| `kane/booking-lifecycle_test.md` | A new booking occupies its unit and its value shows up as recognised revenue on the Overview card. |
| `kane/cleaning-lifecycle_test.md` | Checking a guest out schedules **exactly one** turnover-clean work order, and a unit with an open cleaning job refuses to be marked Ready. |
| `kane/unit-readiness_test.md` | Completing the cleaning job pays the vendor exactly once (not twice) and frees the unit back to Ready. |
| `kane/profit-invariant_test.md` | The core ledger invariant: Net always equals Revenue minus Costs, read straight off the dashboard. |

## Repo layout

```
frontend/    Next.js 16 + React 19 app — bookings, units, cleaning, payouts, ledger, /demo, /proofloop
proofloop/   Zero-dependency Node ≥ 24 CLI: verify | hook | report (npm test → 34 unit tests)
kane/        The four *_test.md flows above; each grows a committed output-<stem>/ replay
             recording the first time `verify` authors it
.claude/     Stop hook wiring (settings.json)
.testmuai/   Kane project context + variables (app_url)
docs/        This spec's design doc, the demo script, the submission paragraph
```

## Credits / replay

Kane CLI runs cost credits only when a test is **authored or re-authored** (its prose changed).
The first run of a given `kane/*_test.md` authors it and spends credits; once it's green, its
`kane/output-<stem>/` recording is committed to the repo, and every subsequent
`kane-cli testmd run --agent` / `node proofloop/src/cli.ts verify` **replays** that recording
against the live app for free. Every Stop-hook invocation after the first successful authoring
run is a free replay.

**Demo video:** _coming before submission_

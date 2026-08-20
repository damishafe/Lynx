# Lynx ProofLoop — Design Spec

**Date:** 2026-08-20 · **Status:** approved · **Deadline:** 2026-08-21 23:59 IST (19:29 BST)

> *Lynx ProofLoop — an AI-built short-term-rental operations platform where Claude Code
> isn't allowed to say "done" until a real browser proves the change.*

ProofLoop is the technology story. Lynx is the real-world environment it is demonstrated on.
Built for the Kane CLI Online Hackathon (TestMu AI, 19–21 Aug 2026). Judging dimensions:
Ships · Verified · Closed loop · Craft (equal weight; ties break on Verified, then Closed loop).

## 1. Goals and non-goals

**Goals**

1. A closed loop with no human in it: Claude Code edits Lynx → a Stop hook runs ProofLoop →
   ProofLoop maps the diff to impacted business flows → Kane CLI exercises those flows in real
   Chrome → a failure is fed back to Claude as a *block* reason → Claude fixes the code → the
   next stop re-runs Kane → pass allows the stop.
2. Kane verifies **business invariants** (revenue, occupancy, cleaning lifecycle, vendor
   balance, net profit), not pixels or buttons.
3. The Kane tests are a committed, replayable behavioral contract (`kane/*_test.md` +
   recordings), not disposable prompts.
4. Every verification leaves evidence (Kane `run_end`, failing-step screenshot, Kane
   `test_url`) that a status page can show.
5. Judges can run it in under a minute and see Kane run.

**Non-goals (explicitly cut)**

- Lane-4 requirements coverage (`kane-cli context ingest` / `design tests` / `cover`). Not in
  the verified agent doc; only reconsidered if everything else is demo-recorded.
- A standalone orchestrator (`proofloop run "<prompt>"` driving `claude -p`).
- Any auth / Stripe / email / billing changes.
- Running Kane on every file save (too slow and credit-hungry; the Stop hook is the trigger).

## 2. Architecture

```
Claude Code session (the coding agent)
  │ edits frontend/…
  │ attempts to stop (turn ends)
  ▼
Stop hook  ──►  node proofloop/src/cli.ts hook        (.claude/settings.json, timeout 1500s)
                  ├─ changed files   git diff HEAD + staged + untracked, scoped to frontend/
                  ├─ impacted flows  proofloop/proofloop.map.json  (flow → paths[] + tests[])
                  ├─ preflight       GET {{app_url}} reachable? kane-cli present?
                  ├─ for each flow   kane-cli testmd run kane/<flow>_test.md --agent --headless --retry
                  │                  (Chrome → http://localhost:3000/demo → real user flow)
                  ├─ parse NDJSON    terminal `run_end` per flow (status/reason/summary/final_state/run_dir/test_url)
                  ├─ record          .proofloop/latest.json, .proofloop/history.jsonl, .proofloop/evidence/<run>/
                  ├─ PASS            allow stop  + systemMessage "✅ ProofLoop: N/N flows verified"
                  └─ FAIL            {"decision":"block","reason":"<structured failure report>"}
                                     → Claude continues, fixes code → next stop re-fires Kane
```

New top-level siblings of `frontend/` (per CLAUDE.md's monorepo layout):

| Path | Role |
|---|---|
| `proofloop/` | The tool. Zero-dependency TypeScript executed directly by Node ≥ 22.18 / 24 (built-in type stripping). `node proofloop/src/cli.ts <cmd>`. |
| `kane/` | The behavioral contract: `*_test.md`, `helpers/*.md`, committed `output-*/` recordings. |
| `.claude/settings.json` | Stop hook wiring (project-scoped, committed). |
| `.testmuai/context.md` | Kane project context (how Lynx is laid out, how to reset/log in). |
| `.testmuai/variables/local.json` | `{ "app_url": { "value": "http://localhost:3000" } }`. |
| `.proofloop/` | Runtime artifacts (gitignored). |
| `docs/` | This spec, the demo script, the submission paragraph. |

## 3. Lynx changes — the bookings domain

### 3.1 Data

`lib/bookings.ts` (MongoDB collection `bookings`):

```ts
type BookingDoc = {
  _id: ObjectId; ownerId: ObjectId; unitId: ObjectId; unitName: string;
  guestName: string; checkIn: Date; checkOut: Date;
  grossAmountCents: number;            // booking value
  status: "upcoming" | "checked_in" | "checked_out";
  cleaningWorkOrderId?: ObjectId;      // set on checkout
  isDemo?: boolean; createdAt: Date; checkedOutAt?: Date; deletedAt?: Date;
};
```

Functions: `createBooking`, `listBookings`, `getBookingById`, `checkoutBooking`,
`totalBookingRevenueCents(ownerId, { since? })`, `revenueByUnit(ownerId, { since? })`.

`UnitDoc` gains `cleaningFeeCents` (seeded $120 = 12000) and `cleaningVendorId?`.
`UnitStatus` becomes `"ready" | "occupied" | "needs_cleaning" | "maintenance"`; labels, pills,
switcher, counts and seeds updated. `lib/unit-status.ts` stays client-safe.

### 3.2 Business rules (the invariants Kane verifies)

| # | Rule | Where enforced |
|---|---|---|
| R1 | Creating a booking sets the unit to **Occupied** and records activity. | `createBookingAction` → `createBooking` + `setUnitStatus` |
| R2 | **Revenue** on the dashboard and reports = Σ `bookings.grossAmountCents` in the 30-day window (replaces the stored `monthlyRevenueCents` on those surfaces). | `totalBookingRevenueCents` |
| R3 | **Checkout** marks the booking `checked_out`, sets the unit to **Needs Cleaning**, and creates exactly one cleaning work order (`type: cleaning`, cost = `unit.cleaningFeeCents`, vendor = unit's cleaning vendor or the owner's first cleaning vendor). Idempotent: a second checkout is a no-op with an error message. | `checkoutBookingAction` |
| R4 | A unit **cannot be set to Ready** while it has an `assigned` cleaning work order. Server action returns an error; the status switcher disables the option. | `setUnitStatusAction` guard + `UnitStatusSwitcher` |
| R5 | Completing a cleaning work order creates **one** pending payout (Owed to vendors ↑ by the cost) and sets the unit to **Ready**. Existing `completeWorkOrder` already guards `status: "assigned"` so double completion is impossible. | existing `completeWorkOrderAction` / vendor portal |
| R6 | **Profitability card** (dashboard): `Revenue` = R2; `Costs` = Σ cost of `completed` work orders in the window (accrual, per goal.md) + any platform fees; `Net` = Revenue − Costs. All three rendered as exact currency (`$1,000.00`), never abbreviated. | new `components/dashboard/profitability-card.tsx`, `lib/ledger.ts` |

R6 intentionally sums **work orders**, not payouts: today "spend" counts only *completed*
payouts while completion creates a *pending* one, so costs would lag until a payout is paid.
Accrual matches goal.md ("Unit Expenses = Sum of WorkOrders (complete or paid)"). `Owed to
vendors` keeps its current meaning (pending payouts).

### 3.3 UI

- `/dashboard/bookings` — list (guest, unit, dates, amount, status pill, **Check out** button
  on `upcoming`/`checked_in`). Sidebar nav item.
- `/dashboard/bookings/new` — form: unit (select), guest name, check-in, check-out, booking
  value. Lumina spec: BentoCard, rounded-[2rem], optical shadows, Server Component page + client
  leaf form.
- Dashboard: Profitability card (R6) replaces the abbreviated revenue tile's role as the
  ledger source of truth; the KPI tiles can keep short formatting.
- Unit detail: shows bookings for that unit; status switcher respects R4.

### 3.4 Deterministic test state

`/demo` gains a second action, **"Reset & launch demo"** (`resetAndLaunchDemo`): purges every
document owned by the demo user across units / vendors / work orders / payouts / bookings /
activity, reseeds, sets the session, redirects to `/dashboard`. The seed becomes fixed and
booking-free:

- Units: `Unit 7 · Harbor` (ready, cleaning fee $120), `Loft · Mission` (ready), `Suite ·
  Capitol Hill` (maintenance). No stored revenue is relied on.
- Vendors: `BrightTurn Cleaning` (cleaning — Unit 7's cleaning vendor), `Northline Maintenance`.
- Work orders / payouts: none open, none in the 30-day window (so Costs start at `$0.00`).

Every Kane test begins from this reset, so exact-dollar assertions are always true on a fresh
run. The existing one-click `launchDemo` stays for humans.

## 4. The Kane contract — `kane/`

```
kane/
  helpers/fresh-demo.md            # Go to {{app_url}}/demo, click "Reset & launch demo", assert dashboard
  booking-lifecycle_test.md
  cleaning-lifecycle_test.md
  unit-readiness_test.md
  profit-invariant_test.md
  output-<stem>/                   # recordings + Result.md — committed
```

All tests: frontmatter `mode: testing`, `headless: true`, `max_steps: 30`, step 1
`@import ./helpers/fresh-demo.md`, `{{app_url}}` from `.testmuai/variables/local.json`.
Objectives use imperative verbs, exact-text assertions, and `store … as '<name>'` so values
land in `run_end.final_state`.

| Test | Steps (summary) | Proves |
|---|---|---|
| `booking-lifecycle` | new booking: Unit 7 · Harbor, Sarah Johnson, $1,000 → bookings list → dashboard | booking row visible · Unit 7 pill **Occupied** · Revenue `$1,000.00` (stored `revenue`) |
| `cleaning-lifecycle` | create booking → Check out → work orders → unit page | a **Cleaning** work order for Unit 7 is **Assigned** · Unit 7 **Needs Cleaning** · choosing **Ready** is refused |
| `unit-readiness` | create booking → check out → complete the cleaning job → dashboard | work order **Completed** · Owed to vendors `$120.00` · Unit 7 **Ready** · Costs `$120.00` (not `$240.00`) |
| `profit-invariant` | create $1,000 booking → check out → complete cleaning → dashboard | Profitability card `Revenue $1,000.00 / Costs $120.00 / Net $880.00` (stored `revenue`, `costs`, `net`) |

**The demo change.** The recorded prompt to Claude Code is *"Add a 10% platform fee to every
booking and show it in the profitability breakdown."* The acceptance criterion in
`profit-invariant_test.md` is updated alongside the prompt to `Costs $220.00 / Net $780.00`
(fee $100 + cleaning $120). Tests are the requirement; ProofLoop holds the agent to it. We
record whatever Kane actually finds on the first run — **no planted bug**. If the first prompt
passes clean, the recording shows the green path and we try the next realistic feature.

Credits: first authoring of each test costs credits; subsequent runs replay from the committed
recordings at zero cost unless a step's prose changed (cascade rule: editing step N re-authors
N and everything after it — keep the changing assertion in the **last** step).

## 5. ProofLoop CLI — `proofloop/`

```
proofloop/
  src/cli.ts        # entry: verify | hook | report
  src/diff.ts       # changed files (HEAD diff + staged + untracked), scoped to frontend/
  src/impact.ts     # map changed files → flows via proofloop.map.json (glob match)
  src/kane.ts       # spawn kane-cli, stream NDJSON, return run_end + exit code
  src/ndjson.ts     # line parser: progress events vs typed events vs run_end
  src/report.ts     # write latest.json / history.jsonl / evidence copy; console table
  src/hook.ts       # Claude Code Stop-hook adapter (stdin JSON → stdout decision)
  proofloop.map.json
  test/*.test.ts    # node:test, fixtures under test/fixtures/
```

### 5.1 `proofloop verify [--changed | --all | --flow <name>] [--json]`

1. **Diff** — `git diff --name-only HEAD`, `git diff --name-only --cached`, `git ls-files
   --others --exclude-standard`; union; keep paths under `frontend/` excluding `*.md`,
   `public/`, `*.test.*`.
2. **Impact** — `proofloop.map.json`:
   ```json
   {
     "flows": {
       "booking":   { "tests": ["kane/booking-lifecycle_test.md"],  "paths": ["frontend/lib/bookings.ts", "frontend/app/dashboard/bookings/**", "frontend/lib/units.ts", "frontend/components/dashboard/unit-status-pill.tsx"] },
       "cleaning":  { "tests": ["kane/cleaning-lifecycle_test.md"], "paths": ["frontend/lib/bookings.ts", "frontend/lib/work-orders.ts", "frontend/app/dashboard/units/**", "frontend/components/dashboard/unit-status-switcher.tsx"] },
       "readiness": { "tests": ["kane/unit-readiness_test.md"],     "paths": ["frontend/lib/work-orders.ts", "frontend/lib/payouts.ts", "frontend/app/dashboard/work-orders/**", "frontend/app/vendor/**"] },
       "profit":    { "tests": ["kane/profit-invariant_test.md"],   "paths": ["frontend/lib/ledger.ts", "frontend/lib/bookings.ts", "frontend/lib/payouts.ts", "frontend/app/dashboard/page.tsx", "frontend/components/dashboard/profitability-card.tsx"] }
     },
     "shared": ["frontend/lib/seed.ts", "frontend/app/demo/**", "frontend/app/dashboard/layout.tsx", "frontend/components/dashboard/sidebar.tsx"]
   }
   ```
   Files matching `shared` select **all** flows. Changed files matching nothing are reported as
   **unmapped** (never silently ignored) and trigger `profit` as a safety net. `--all` runs every
   flow; `--flow` runs one.
3. **Preflight** — `kane-cli --version`; HTTP GET `{{app_url}}`; `kane/` tests exist. Any
   failure → exit 2 with a one-line remedy.
4. **Run** — sequentially (shared database, one Chrome):
   `kane-cli testmd run <test> --agent --headless --retry --timeout 420 --variables-file
   .testmuai/variables/local.json`. stdout NDJSON is parsed line by line; progress remarks are
   echoed to stderr as `[flow] step N ✓/✗ remark`; the `run_end` object is captured; the
   process exit code is recorded.
5. **Evidence** — for a failed flow, copy the newest `*.png` under `run_dir` (if any) and
   `run-test/actions.ndjson` into `.proofloop/evidence/<runId>/<flow>/`.
6. **Record** — `.proofloop/latest.json` and append to `.proofloop/history.jsonl`:
   ```json
   { "id": "<iso-ts>", "startedAt": "...", "finishedAt": "...", "trigger": "hook|cli",
     "attempt": 1, "changedFiles": [...], "unmapped": [...], "flows": ["booking", "profit"],
     "results": [{ "flow": "profit", "test": "kane/profit-invariant_test.md", "status": "failed",
                   "exitCode": 1, "reason": "...", "summary": "...", "oneLiner": "...",
                   "finalState": { "net": "$680.00" }, "failedStep": { "step": 7, "remark": "..." },
                   "durationS": 61.2, "credits": 0, "runDir": "...", "testUrl": "https://…",
                   "evidence": { "screenshot": ".proofloop/evidence/…/step7.png" } }],
     "verdict": "verified" | "failed" | "error" }
   ```
7. **Exit** — 0 verified · 1 at least one flow failed · 2 infra/preflight error · 3 timeout.

### 5.2 `proofloop hook` (Claude Code Stop hook adapter)

Reads the hook payload from stdin (`session_id`, `stop_hook_active`, `cwd`, …). Decision
policy:

| Situation | Output | Why |
|---|---|---|
| No changed files under `frontend/` | allow (no output) | Plain conversation turns must never launch Chrome. |
| `verify` → verdict `verified` | allow + `systemMessage: "✅ ProofLoop: N/N flows verified in a real browser (Xs)"` | Make the proof visible in the transcript. |
| `verify` → verdict `failed` and attempts < 3 | `{"decision":"block","reason":<report>}` | Claude must keep working. |
| `verify` → verdict `failed` and attempts ≥ 3 | allow + `systemMessage: "⛔ ProofLoop: 3 attempts exhausted — human needed. See .proofloop/latest.json"` | Never trap the agent forever. |
| preflight/infra error (exit 2/3) | allow + `systemMessage` warning | An unreachable dev server is not a code failure. |

Attempts are counted per Claude session in `.proofloop/session-<session_id>.json` and reset
when a verification passes. The block `reason` is plain text, built for an agent to act on:

```
ProofLoop: 1 of 2 impacted flows FAILED in a real browser (Kane CLI). You may not finish yet.

✗ profit — kane/profit-invariant_test.md
  Kane: "Net showed $680.00, expected $780.00"            (run_end.reason)
  Observed final_state: revenue=$1,000.00 costs=$320.00 net=$680.00
  Failed at step 7: "Asserted Net equals $780.00 — found $680.00"
  Screenshot: .proofloop/evidence/2026-08-20T15-02-11Z/profit/step7.png
  Kane run:   https://test-manager.lambdatest.com/…

✓ booking — passed (replayed, 0 credits)

Changed files: frontend/lib/ledger.ts, frontend/lib/bookings.ts
Fix the application code so the flow passes. Do not edit kane/*_test.md to make it pass
unless the requirement itself changed. Attempt 1 of 3.
```

`.claude/settings.json`:

```json
{ "hooks": { "Stop": [ { "hooks": [ { "type": "command",
    "command": "node \"$CLAUDE_PROJECT_DIR\"/proofloop/src/cli.ts hook", "timeout": 1500 } ] } ] } }
```

(Exact field names for the Stop hook payload/response are confirmed against the Claude Code
hooks reference before implementation; the policy above does not depend on them.)

### 5.3 `proofloop report`

Prints the latest verdict as the console table (flow · status · reason · credits · evidence)
and the ship banner. `--json` dumps `latest.json`.

### 5.4 Tests (TDD, `node --test proofloop/test`)

- `ndjson.test.ts` — fixtures: passing run, failing run with `final_state`, typed events
  interleaved, garbage lines, missing `run_end` → `status: "error"`.
- `impact.test.ts` — single-flow file, multi-flow file, `shared` file, unmapped file, `**`
  globs, non-frontend paths ignored.
- `hook.test.ts` — injected fake runner; each row of the §5.2 policy table; attempt counter
  reset on pass.
- `kane.test.ts` — spawns a stub `kane-cli` script (fixture on `PATH`) to check streaming +
  exit-code capture without a browser.

## 6. ProofLoop status page (P2) — `frontend/app/proofloop/page.tsx`

Server Component; reads `../.proofloop/latest.json` + last 20 history entries with `fs`
(path from `process.cwd()/..`, guarded — empty state if absent or in production). Sections, in
Lumina style (BentoCard, status pills, no heavy shadows):

1. **Ship banner** — `VERIFIED` / `FAILED` / `UNVERIFIED` with flow counts and repair iterations.
2. **Timeline of the latest change** — CHANGE (files) → IMPACT (flows) → VERIFY → FAIL (Kane
   reason, expected vs observed from `final_state`, screenshot via
   `app/api/proofloop/evidence/[...path]/route.ts`, link to Kane `test_url`) → REPAIR →
   REVERIFY → PROOF.
3. **History** — one row per verification run.

Auto-refresh every 5s via the existing `LiveDashboardRefresh` pattern so the page updates
live during the recorded demo.

## 7. Judges' path (Ships)

README (root) gives two paths, both under a minute to first pixel:

1. **Run Lynx** — `cd frontend && cp .env.example .env.local` (Atlas URI supplied in the
   submission form) `&& npm install && npm run dev` → `http://localhost:3000/demo` → one click.
2. **Run ProofLoop** — `npm i -g @testmuai/kane-cli && kane-cli login` →
   `node proofloop/src/cli.ts verify --all` (replays the committed recordings) →
   `http://localhost:3000/proofloop`.

Plus the demo video and, if a Vercel account is available, a live URL for Lynx (Kane keeps
targeting localhost; `app_url` is a variable).

## 8. Demo script (≤ 3:00, interesting part first)

| Time | Screen |
|---|---|
| 0:00–0:10 | Title: *"AI can write Lynx. The dangerous part is believing it when it says it's finished."* Four-frame strip: CLAUDE CHANGE → KANE ❌ → AUTO-FIX → KANE ✅ |
| 0:10–0:35 | Lynx dashboard tour: units, bookings, cleaning, vendor payouts, profitability. |
| 0:35–1:00 | Claude Code prompt: *"Add a 10% platform fee to every booking and show it in the profitability breakdown."* Claude edits; tries to stop. |
| 1:00–1:30 | Stop hook fires. ProofLoop: CHANGE DETECTED → impacted flows. Kane opens Chrome, creates the booking, checks out, completes cleaning… ❌ `Net $680.00, expected $780.00` |
| 1:30–2:00 | Block reason appears in Claude's transcript. Claude diagnoses, edits, tries to stop again. Kane re-runs → ✅ |
| 2:00–2:30 | `/proofloop` page: 4 flows · 4 verified · 1 repair iteration · evidence; open the Kane screenshot / run. |
| 2:30–2:55 | Close: *"Every critical Lynx workflow is a readable Kane test. ProofLoop maps AI changes to affected flows, Kane runs them in a real browser, and failures go straight back to the agent. The agent doesn't decide when it's done. The browser evidence does."* |

## 9. Plan of record (≈30h)

| Window (BST) | Work |
|---|---|
| Aug 20 14:30–15:30 | Repo + spec (done), Kane install/login, `.env.local`, smoke `kane-cli run` against `/demo`. |
| 15:30–20:30 | Bookings domain + `needs_cleaning` + reset + profitability card ‖ ProofLoop CLI core (TDD). |
| 20:30–23:30 | Author the four tests green; commit recordings. |
| 23:30–01:00 | Stop hook wired; full dry run of the loop. |
| Aug 21 09:00–13:00 | Status page, README, `.env.example`, submission paragraph. |
| 13:00–16:00 | Record demo with the real prompt; deploy if Vercel available. |
| 16:00–17:00 | Submit (2.5h buffer before 19:29 BST). |

## 10. Risks

| Risk | Mitigation |
|---|---|
| Kane authoring is slow/flaky on first run | Keep tests ≤ 10 steps each; exact-text assertions; `--retry`; reset helper makes state deterministic. |
| Hook default 60s timeout kills Kane | `timeout: 1500` on the hook; `--timeout 420` per test. |
| Agent loops forever on a genuinely impossible assertion | Attempt cap 3 → allow with human-needed message. |
| Credits exhausted | Replays are free; only re-author when prose changes; DM organizers on Slack early if low. |
| Atlas latency makes Kane steps time out | Local run + 420s per-test timeout; seed is tiny. |
| Remote repo | `damishafe/Rivet` is a different July project — never push there. Use a fresh repo created ≥ Aug 19. |

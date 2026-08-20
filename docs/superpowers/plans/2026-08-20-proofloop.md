# Lynx ProofLoop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Lynx an app where Claude Code cannot finish a change until Kane CLI has proven the affected business flows in a real browser — bookings domain in Lynx, a zero-dependency `proofloop` CLI, four committed Kane tests, a Stop hook, and a status page.

**Architecture:** Claude Code's Stop hook runs `node proofloop/src/cli.ts hook`, which diffs the working tree, maps changed files to business flows via `proofloop/proofloop.map.json`, runs the matching `kane/*_test.md` through `kane-cli testmd run --agent`, parses the terminal `run_end` NDJSON event, records evidence under `.proofloop/`, and either allows the stop (pass) or blocks it with exit code 2 + a structured failure report on stderr (fail). Lynx gains a Bookings domain so the Kane tests can assert revenue / occupancy / cleaning / vendor-balance / net-profit invariants from a deterministic seed reached via `/demo`.

**Tech Stack:** Next.js 16 (App Router, Server Actions, Server Components) · React 19 · MongoDB driver 7 · Tailwind v4 · Hugeicons · Node 24 (native TypeScript type-stripping, `node:test`) · Kane CLI 0.8.4 · Claude Code 2.1.x hooks.

**Spec:** `docs/superpowers/specs/2026-08-20-proofloop-design.md`

## Global Constraints

- Deadline: 2026-08-21 23:59 IST (19:29 BST). Target submission 17:00 BST.
- Git identity is `damishafe <damishafe@users.noreply.github.com>` (already set in `.git/config`). Never commit `.env.local`, `.git/rivet-credentials`, or `.proofloop/`. Never push to `damishafe/Rivet`.
- Every commit message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `frontend/` rules (from `frontend/AGENTS.md` + root `CLAUDE.md`): Next.js 16 — read `frontend/node_modules/next/dist/docs/01-app/` before using any Next API you are unsure of; App Router only; Server Components by default, `"use client"` only at leaf nodes; Tailwind v4 (no `tailwind.config.js`); cards are `rounded-[2rem]` with the optical shadow `shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]`; never `shadow-md`/`shadow-lg`; use `cn()` from `@/lib/utils`; path alias `@/*` = `frontend/`.
- Money is stored in integer cents. Exact currency on the Profitability card uses `formatUnsignedAmount` from `frontend/lib/payouts.ts` (renders `$1,000.00`).
- `proofloop/` and all `*.test.ts` files: ES modules, **relative imports must include the `.ts` extension** (Node runs them without a bundler). Only erasable TypeScript syntax (no `enum`, no `namespace`, no parameter properties). Zero npm dependencies in `proofloop/`.
- `frontend/tsconfig.json` excludes `**/*.test.ts` so `next build` never type-checks test files that use `.ts`-extension imports.
- Kane: always `--agent`; build logic only on the `run_end` event; `kane/*_test.md` + their `output-<stem>/` directories are committed; never edit a Kane test to make a failing app pass unless the requirement changed.
- Commands run from the directory stated in each step. `ROOT` = `/Users/enoch/Developer/personal/lynx`.
- UI copy that Kane tests depend on is fixed (see Task 7 and Task 14). Do not reword these strings: `Reset & launch demo`, `Bookings`, `New booking`, `Guest name`, `Check-in`, `Check-out`, `Booking value (USD)`, `Create booking`, `Check out`, `Checked out`, `Profitability`, `Revenue`, `Costs`, `Net`, `Needs cleaning`, `Owed to vendors`, `Turnover clean`.

---

## File structure

**Lynx (`frontend/`)**

| File | Responsibility |
|---|---|
| `lib/unit-status.ts` (modify) | Add `needs_cleaning` to the client-safe status enum + labels. |
| `lib/units.ts` (modify) | `cleaningFeeCents`, `cleaningVendorId` on `UnitDoc`; `needs_cleaning` in `StatusCounts`. |
| `lib/bookings.ts` (create) | Bookings collection: create/list/get/checkout/revenue aggregates. |
| `lib/work-orders.ts` (modify) | `hasOpenCleaningWorkOrder`, `totalCompletedWorkOrderCostCents`. |
| `lib/ledger-math.ts` (create) | Pure ledger arithmetic (unit-tested with `node:test`). |
| `lib/ledger.ts` (create) | `getLedger(ownerId, since)` — reads bookings + work orders, returns revenue/costs/net. |
| `lib/activity.ts` (modify) | `booking.created`, `booking.checked_out` activity types; `booking` entity. |
| `lib/seed.ts` (modify) | Deterministic, booking-free seed; `resetDemoData`. |
| `app/demo/actions.ts` (modify) | `resetAndLaunchDemo` server action. |
| `app/demo/page.tsx`, `components/demo/launch-demo-button.tsx` (modify) | Second button "Reset & launch demo". |
| `app/dashboard/bookings/actions.ts` (create) | `createBookingAction`, `checkoutBookingAction`. |
| `app/dashboard/bookings/page.tsx` (create) | Bookings list with Check out buttons. |
| `app/dashboard/bookings/new/page.tsx`, `new/new-booking-form.tsx` (create) | New booking form. |
| `components/dashboard/checkout-booking-button.tsx` (create) | Client leaf that calls `checkoutBookingAction`. |
| `components/dashboard/booking-status-pill.tsx` (create) | Upcoming / Checked in / Checked out pill. |
| `components/dashboard/profitability-card.tsx` (create) | Exact-currency Revenue / Costs / Net card. |
| `components/dashboard/unit-status-pill.tsx`, `unit-status-switcher.tsx` (modify) | `needs_cleaning` visuals; `blockedStatuses` prop. |
| `components/dashboard/nav-items.ts` (modify) | "Bookings" nav item. |
| `app/dashboard/units/actions.ts` (modify) | R4 guard in `setUnitStatusAction`. |
| `app/dashboard/units/[id]/page.tsx` (modify) | Booking revenue for the unit; pass `blockedStatuses`. |
| `app/dashboard/page.tsx`, `app/dashboard/reports/page.tsx` (modify) | Ledger-based revenue; Profitability card; 4-segment status breakdown. |
| `app/proofloop/page.tsx`, `app/api/proofloop/evidence/[...path]/route.ts` (create) | ProofLoop status page + evidence image route. |
| `.env.example` (create) | Env template for judges. |

**ProofLoop (`proofloop/`)**

| File | Responsibility |
|---|---|
| `src/ndjson.ts` | Parse Kane NDJSON lines; collect steps; capture `run_end`. |
| `src/impact.ts` | Glob matching; changed files → flows. |
| `src/diff.ts` | `git` changed-file discovery. |
| `src/kane.ts` | Spawn `kane-cli testmd run`, stream, return `{exitCode, parsed, durationS}`. |
| `src/report.ts` | Report types, `.proofloop/` writers, console table, block-reason builder, evidence copy. |
| `src/verify.ts` | The `verify` pipeline (preflight → impact → run → record). Dependencies injectable. |
| `src/hook.ts` | Stop-hook adapter: stdin JSON → allow/block decision + attempt counter. |
| `src/cli.ts` | Entry: `verify | hook | report`. |
| `proofloop.map.json` | Flow map. |
| `test/*.test.ts`, `test/fixtures/` | `node:test` suites + NDJSON fixtures + stub `kane-cli`. |

**Kane (`kane/`)**: `helpers/fresh-demo.md`, `booking-lifecycle_test.md`, `cleaning-lifecycle_test.md`, `unit-readiness_test.md`, `profit-invariant_test.md`, committed `output-*/`.

**Wiring**: `.claude/settings.json`, `.testmuai/context.md`, `.testmuai/variables/local.json`, root `README.md`, `docs/demo-script.md`, `docs/submission.md`.

---

### Task 1: Environment — env file, Kane login, smoke run

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/.env.local` (gitignored; needs the user's Atlas URI)
- Create: `.testmuai/variables/local.json`
- Create: `.testmuai/context.md`

**Interfaces:**
- Produces: a running app at `http://localhost:3000` whose `/demo` route works; a logged-in `kane-cli`; the `{{app_url}}` variable every Kane test uses.

- [ ] **Step 1: Write `.env.example`** (committed; judges copy it)

```bash
cat > "$ROOT/frontend/.env.example" <<'EOT'
# MongoDB — Atlas (mongodb+srv://…) or local (mongodb://localhost:27017)
MONGODB_URI=
MONGODB_DB=lynx

# Optional — welcome/work-order emails (Gmail App Password). Leave blank to skip email.
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Optional — Stripe test key for the billing page. Leave blank to skip billing.
STRIPE_SECRET_KEY=

# Public site URL (OG images, email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOT
```

Also un-ignore it: in `frontend/.gitignore` change the line `.env*` to the two lines `.env*` and `!.env.example`.

- [ ] **Step 2: Create `.env.local`** — ask the user for `MONGODB_URI` (they confirmed they have an Atlas URI). Write:

```bash
cat > "$ROOT/frontend/.env.local" <<EOT
MONGODB_URI=<paste from user>
MONGODB_DB=lynx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOT
```

- [ ] **Step 3: Boot the app and prove `/demo` works**

Run (from `frontend/`): `npm run dev` in the background, then `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/demo`
Expected: `200`.

- [ ] **Step 4: Kane variables + project context**

```bash
mkdir -p "$ROOT/.testmuai/variables"
cat > "$ROOT/.testmuai/variables/local.json" <<'EOT'
{
  "app_url": { "value": "http://localhost:3000", "secret": false }
}
EOT
cat > "$ROOT/.testmuai/context.md" <<'EOT'
# Lynx — context for Kane

Lynx is a short-term-rental operations dashboard. Everything lives under {{app_url}}.

- `{{app_url}}/demo` shows two buttons. **"Reset & launch demo"** wipes the demo account,
  reseeds it (units "Unit 7 · Harbor", "Loft · Mission", "Suite · Capitol Hill"; vendors
  "BrightTurn Cleaning", "Northline Maintenance"; no bookings, no work orders) and signs you in.
  Always start from this button unless a step says otherwise.
- Left sidebar: Overview, Units, Bookings, Activity, Work orders, Vendors, Reports.
- Overview shows a **Profitability** card with three rows — Revenue, Costs, Net — as exact
  dollar amounts like `$1,000.00`, and an **Owed to vendors** figure in the Operations queue panel.
- Bookings: "New booking" form has Unit, Guest name, Check-in, Check-out, Booking value (USD),
  and a "Create booking" button. Each booking row has a "Check out" button until it is checked out.
- Unit detail pages (click a unit name) show a status switcher with Ready / Occupied /
  Needs cleaning / Maintenance buttons and the unit's work orders.
- Work orders page: each assigned job has a "Complete" button.
- Money is always shown with two decimals. Read values exactly as displayed.
EOT
```

- [ ] **Step 5: Kane login + smoke run** — the user must run `kane-cli login` (interactive) or `kane-cli login --oauth`. Then verify and run one ephemeral objective:

```bash
kane-cli whoami
cd "$ROOT" && kane-cli run "Go to {{app_url}}/demo and assert a button labelled 'Enter demo account' is visible" --agent --headless --timeout 120 --variables-file .testmuai/variables/local.json
```

Expected: last stdout line is a `run_end` JSON with `"status":"passed"`, exit code 0. (This also satisfies the hackathon's "must have run Kane CLI" eligibility requirement.)

- [ ] **Step 6: Commit**

```bash
cd "$ROOT" && git add frontend/.env.example frontend/.gitignore .testmuai && git commit -m "chore: env template, Kane variables and project context

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `needs_cleaning` unit status

**Files:**
- Modify: `frontend/lib/unit-status.ts`
- Modify: `frontend/lib/units.ts` (`StatusCounts`, `countUnitsByStatus`)
- Modify: `frontend/components/dashboard/unit-status-pill.tsx`
- Modify: `frontend/components/dashboard/unit-status-switcher.tsx`
- Modify: `frontend/app/dashboard/page.tsx` (`counts` initial value; `StatusBreakdownCard`)
- Modify: `frontend/app/dashboard/reports/page.tsx` (`counts` initial value)

**Interfaces:**
- Produces: `UnitStatus = "ready" | "occupied" | "needs_cleaning" | "maintenance"`; `UNIT_STATUS_LABELS.needs_cleaning === "Needs cleaning"`; `StatusCounts.needs_cleaning: number`; `UnitStatusSwitcher` accepts `blockedStatuses?: UnitStatus[]` (rendered disabled with a tooltip).

- [ ] **Step 1: Update the enum**

Replace the body of `frontend/lib/unit-status.ts` with:

```ts
// Pure types + constants safe for client components.
// Importing from `lib/units.ts` would drag the mongodb driver into the browser
// bundle. Anything client-side that just needs the status enum imports here.

export type UnitStatus = "ready" | "occupied" | "needs_cleaning" | "maintenance";

export const UNIT_STATUSES: UnitStatus[] = [
  "ready",
  "occupied",
  "needs_cleaning",
  "maintenance",
];

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  ready: "Ready",
  occupied: "Occupied",
  needs_cleaning: "Needs cleaning",
  maintenance: "Maintenance",
};
```

- [ ] **Step 2: Counts**

In `frontend/lib/units.ts` change `StatusCounts` and the initial object in `countUnitsByStatus`:

```ts
export type StatusCounts = {
  total: number;
  ready: number;
  occupied: number;
  needs_cleaning: number;
  maintenance: number;
};
// inside countUnitsByStatus:
  const result: StatusCounts = {
    total: 0,
    ready: 0,
    occupied: 0,
    needs_cleaning: 0,
    maintenance: 0,
  };
```

In `frontend/app/dashboard/page.tsx` line ~80 and `frontend/app/dashboard/reports/page.tsx` line ~45 change the initial value to
`{ total: 0, ready: 0, occupied: 0, needs_cleaning: 0, maintenance: 0 }`.

In `StatusBreakdownCard` (dashboard page ~line 544) change the prop type to `counts: StatusCounts` (import `type StatusCounts` from `@/lib/units`) and the segments to:

```ts
  const segments = [
    { key: "ready" as const, label: "Ready", value: counts.ready, color: "#10B981" },
    { key: "occupied" as const, label: "Occupied", value: counts.occupied, color: "#F59E0B" },
    { key: "needs_cleaning" as const, label: "Needs cleaning", value: counts.needs_cleaning, color: "#0EA5E9" },
    { key: "maintenance" as const, label: "Maintenance", value: counts.maintenance, color: "#F43F5E" },
  ];
```

- [ ] **Step 3: Pill**

In `frontend/components/dashboard/unit-status-pill.tsx` add `Brush02Icon` to the Hugeicons import **only if it exists**; check with
`grep -c "Brush02Icon" frontend/node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts` (or `find frontend/node_modules/@hugeicons/core-free-icons -name "*.d.ts" | xargs grep -l Brush02Icon`). If it does not exist, use `Clock01Icon` (known to exist — it is already imported in `status-pill.tsx`). Then add the config entry between `occupied` and `maintenance`:

```ts
  needs_cleaning: {
    label: "Needs cleaning",
    icon: Brush02Icon, // or Clock01Icon — see above
    classes: "bg-sky-50 text-sky-700 border-sky-100/70",
    dotClass: "bg-sky-500",
  },
```

- [ ] **Step 4: Switcher with `blockedStatuses`**

Replace `frontend/components/dashboard/unit-status-switcher.tsx` with:

```tsx
"use client";

import * as React from "react";
import { useOptimistic, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  UserIcon,
  Settings01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { setUnitStatusAction } from "@/app/dashboard/units/actions";
import { UNIT_STATUSES, type UnitStatus } from "@/lib/unit-status";

const config: Record<
  UnitStatus,
  {
    label: string;
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
    active: string;
    inactive: string;
  }
> = {
  ready: {
    label: "Ready",
    icon: CheckmarkCircle01Icon,
    active:
      "bg-emerald-500 text-white border-emerald-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(16,185,129,0.55)]",
    inactive:
      "bg-emerald-50 text-emerald-700 border-emerald-100/70 hover:bg-emerald-100/60",
  },
  occupied: {
    label: "Occupied",
    icon: UserIcon,
    active:
      "bg-amber-500 text-white border-amber-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(245,158,11,0.55)]",
    inactive:
      "bg-amber-50 text-amber-700 border-amber-100/70 hover:bg-amber-100/60",
  },
  needs_cleaning: {
    label: "Needs cleaning",
    icon: Clock01Icon,
    active:
      "bg-sky-500 text-white border-sky-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(14,165,233,0.55)]",
    inactive: "bg-sky-50 text-sky-700 border-sky-100/70 hover:bg-sky-100/60",
  },
  maintenance: {
    label: "Maintenance",
    icon: Settings01Icon,
    active:
      "bg-rose-500 text-white border-rose-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(244,63,94,0.55)]",
    inactive:
      "bg-rose-50 text-rose-700 border-rose-100/70 hover:bg-rose-100/60",
  },
};

export function UnitStatusSwitcher({
  unitId,
  current,
  blockedStatuses = [],
  blockedReason,
}: {
  unitId: string;
  current: UnitStatus;
  /** Statuses the server would refuse right now (e.g. "ready" while a cleaning job is open). */
  blockedStatuses?: UnitStatus[];
  blockedReason?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(
    current,
    (_state: UnitStatus, next: UnitStatus) => next,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onPick = (next: UnitStatus) => {
    if (next === optimistic) return;
    if (blockedStatuses.includes(next)) {
      setError(blockedReason ?? "That status isn't available right now.");
      return;
    }
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const res = await setUnitStatusAction(unitId, next);
      if (res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {UNIT_STATUSES.map((s) => {
          const c = config[s];
          const active = optimistic === s;
          const blocked = blockedStatuses.includes(s) && !active;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              aria-pressed={active}
              aria-disabled={blocked}
              title={blocked ? blockedReason : undefined}
              className={cn(
                "cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200",
                active ? c.active : c.inactive,
                blocked && "opacity-50 cursor-not-allowed",
              )}
            >
              <HugeiconsIcon icon={c.icon} size={14} strokeWidth={2.2} />
              {c.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-100/60 px-3 py-2 text-xs font-medium text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

(The button stays clickable-but-blocked on purpose: Kane must be able to click "Ready" and observe the refusal message — R4.)

- [ ] **Step 5: Unit card tone + type-check**

In `frontend/components/dashboard/unit-card.tsx` the `toneByStatus: Record<UnitDoc["status"], string>` map needs a fourth entry — add `needs_cleaning: "from-sky-100/70 to-sky-50/0"` shaped like the existing entries (copy the `occupied` value and swap the colour to `sky`).

Run (from `frontend/`): `npx tsc --noEmit`
Expected: no errors. (If `StatusCounts` is referenced elsewhere — `grep -rn "maintenance: 0" app components lib` — fix each initial object.)

- [ ] **Step 6: Commit**

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(units): add needs_cleaning status and blockable status switcher

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Bookings data layer + unit cleaning fields + activity types

**Files:**
- Create: `frontend/lib/bookings.ts`
- Modify: `frontend/lib/units.ts` (`UnitDoc`, `CreateUnitInput`, `createUnit`)
- Modify: `frontend/lib/work-orders.ts` (two new reads)
- Modify: `frontend/lib/activity.ts` (types)

**Interfaces:**
- Produces:
  - `BookingStatus`, `BookingDoc`, `createBooking(ownerId, input)`, `listBookings(ownerId, {unitId?, status?, limit?})`, `getBookingById(ownerId, id)`, `checkoutBooking(ownerId, id)` → `BookingDoc | null` (null when already checked out), `attachCleaningWorkOrder(ownerId, bookingId, workOrderId)`, `totalBookingRevenueCents(ownerId, {since?, unitId?})`.
  - `UnitDoc.cleaningFeeCents?: number`, `UnitDoc.cleaningVendorId?: ObjectId`.
  - `hasOpenCleaningWorkOrder(ownerId, unitId): Promise<boolean>`, `totalCompletedWorkOrderCostCents(ownerId, {since?, unitId?}): Promise<number>`.
  - `ActivityType` gains `"booking.created" | "booking.checked_out"`; `ActivityEntityType` gains `"booking"`.

- [ ] **Step 1: Unit fields**

In `frontend/lib/units.ts` add to `UnitDoc` after `monthlyRevenueCents?: number;`:

```ts
  /** Flat turnover-clean cost in cents, charged on every checkout. */
  cleaningFeeCents?: number;
  /** Preferred cleaning vendor; falls back to the owner's first cleaning vendor. */
  cleaningVendorId?: ObjectId;
```

Add the same two optional fields to `CreateUnitInput`, and in `createUnit` add
`cleaningFeeCents: input.cleaningFeeCents,` and `cleaningVendorId: input.cleaningVendorId,` to the `doc` literal.
Add `"cleaningFeeCents" | "cleaningVendorId"` to the `Pick` in `UpdateUnitInput`.

- [ ] **Step 2: Activity types**

In `frontend/lib/activity.ts` add `| "booking.created"` and `| "booking.checked_out"` to `ActivityType`, and change `ActivityEntityType` to `"unit" | "vendor" | "payout" | "work_order" | "booking"`.

- [ ] **Step 3: Work-order reads**

Append to `frontend/lib/work-orders.ts` (before `formatWorkOrderType`):

```ts
/** True when the unit has an `assigned` cleaning job — blocks marking it Ready (R4). */
export async function hasOpenCleaningWorkOrder(
  ownerId: ObjectId,
  unitId: ObjectId,
): Promise<boolean> {
  const c = await getCollection();
  const n = await c.countDocuments(
    {
      ownerId,
      unitId,
      type: "cleaning",
      status: "assigned",
      deletedAt: { $exists: false },
    },
    { limit: 1 },
  );
  return n > 0;
}

/**
 * Accrued vendor cost: sum of `completed` work orders (by completedAt), optionally
 * windowed / per unit. This is the "Costs" line of the ledger (goal.md: expenses =
 * completed work orders), independent of whether the payout has been paid yet.
 */
export async function totalCompletedWorkOrderCostCents(
  ownerId: ObjectId,
  opts: { since?: Date; unitId?: ObjectId } = {},
): Promise<number> {
  const c = await getCollection();
  const match: Filter<WorkOrderDoc> = {
    ownerId,
    status: "completed",
    deletedAt: { $exists: false },
  };
  if (opts.since) match.completedAt = { $gte: opts.since };
  if (opts.unitId) match.unitId = opts.unitId;
  const rows = await c
    .aggregate<{ total: number }>([
      { $match: match },
      { $group: { _id: null, total: { $sum: { $abs: "$costCents" } } } },
    ])
    .toArray();
  return rows[0]?.total ?? 0;
}
```

- [ ] **Step 4: Bookings module**

Create `frontend/lib/bookings.ts`:

```ts
import { ObjectId, type Collection, type Filter } from "mongodb";

import { getDb } from "./mongodb";

export type BookingStatus = "upcoming" | "checked_in" | "checked_out";

export type BookingDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  unitId: ObjectId;
  /** Denormalised for list rendering without a join. */
  unitName: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  /** Gross booking value in cents (what the guest pays). */
  grossAmountCents: number;
  status: BookingStatus;
  /** Cleaning job created by checkout (R3). */
  cleaningWorkOrderId?: ObjectId;
  isDemo?: boolean;
  createdAt: Date;
  checkedOutAt?: Date;
  deletedAt?: Date;
};

const COLLECTION = "bookings";
let indexEnsured = false;

async function getCollection(): Promise<Collection<BookingDoc>> {
  const db = await getDb();
  const c = db.collection<BookingDoc>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, unitId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, status: 1, deletedAt: 1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

// ---------- Reads ----------

export type ListBookingsOpts = {
  unitId?: ObjectId;
  status?: BookingStatus;
  limit?: number;
};

export async function listBookings(
  ownerId: ObjectId,
  opts: ListBookingsOpts = {},
): Promise<BookingDoc[]> {
  const c = await getCollection();
  const filter: Filter<BookingDoc> = { ownerId, deletedAt: { $exists: false } };
  if (opts.unitId) filter.unitId = opts.unitId;
  if (opts.status) filter.status = opts.status;
  return c
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
}

export async function getBookingById(
  ownerId: ObjectId,
  bookingId: ObjectId,
): Promise<BookingDoc | null> {
  const c = await getCollection();
  return c.findOne({ _id: bookingId, ownerId, deletedAt: { $exists: false } });
}

/**
 * Gross revenue = sum of booking values created in the window (R2). Bookings are
 * recognised when created, which keeps the demo ledger simple and deterministic.
 */
export async function totalBookingRevenueCents(
  ownerId: ObjectId,
  opts: { since?: Date; unitId?: ObjectId } = {},
): Promise<number> {
  const c = await getCollection();
  const match: Filter<BookingDoc> = { ownerId, deletedAt: { $exists: false } };
  if (opts.since) match.createdAt = { $gte: opts.since };
  if (opts.unitId) match.unitId = opts.unitId;
  const rows = await c
    .aggregate<{ total: number }>([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$grossAmountCents" } } },
    ])
    .toArray();
  return rows[0]?.total ?? 0;
}

// ---------- Writes ----------

export type CreateBookingInput = {
  unitId: ObjectId;
  unitName: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  grossAmountCents: number;
  isDemo?: boolean;
};

export async function createBooking(
  ownerId: ObjectId,
  input: CreateBookingInput,
): Promise<BookingDoc> {
  const now = new Date();
  const status: BookingStatus = input.checkIn <= now ? "checked_in" : "upcoming";
  const doc: Omit<BookingDoc, "_id"> = {
    ownerId,
    unitId: input.unitId,
    unitName: input.unitName,
    guestName: input.guestName.trim(),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    grossAmountCents: input.grossAmountCents,
    status,
    isDemo: input.isDemo,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as BookingDoc);
  return { ...doc, _id: result.insertedId } as BookingDoc;
}

/**
 * Atomically flips a booking to `checked_out`. Returns null when it was already
 * checked out (or missing), which makes checkout idempotent (R3).
 */
export async function checkoutBooking(
  ownerId: ObjectId,
  bookingId: ObjectId,
): Promise<BookingDoc | null> {
  const c = await getCollection();
  const result = await c.findOneAndUpdate(
    {
      _id: bookingId,
      ownerId,
      status: { $in: ["upcoming", "checked_in"] },
      deletedAt: { $exists: false },
    },
    { $set: { status: "checked_out", checkedOutAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function attachCleaningWorkOrder(
  ownerId: ObjectId,
  bookingId: ObjectId,
  workOrderId: ObjectId,
): Promise<void> {
  const c = await getCollection();
  await c.updateOne(
    { _id: bookingId, ownerId },
    { $set: { cleaningWorkOrderId: workOrderId } },
  );
}

export function formatBookingStatus(status: BookingStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "checked_in":
      return "Checked in";
    case "checked_out":
      return "Checked out";
  }
}
```

- [ ] **Step 5: Type-check and commit**

Run (from `frontend/`): `npx tsc --noEmit` — Expected: clean.

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(bookings): bookings collection, unit cleaning fields, accrued-cost reads

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Ledger math (TDD) + ledger reader

**Files:**
- Create: `frontend/lib/ledger-math.ts`
- Create: `frontend/lib/ledger-math.test.ts`
- Create: `frontend/lib/ledger.ts`
- Modify: `frontend/tsconfig.json` (exclude tests)
- Modify: `frontend/package.json` (add `"test": "node --test lib/*.test.ts"`)

**Interfaces:**
- Produces: `type Ledger = { revenueCents: number; costsCents: number; netCents: number }`, `computeLedger({ revenueCents, workOrderCostCents })`, `getLedger(ownerId, { since, unitId? })`.

- [ ] **Step 1: Exclude tests from Next's type-check and add the script**

In `frontend/tsconfig.json` set `"exclude": ["node_modules", "**/*.test.ts"]`.
In `frontend/package.json` scripts add `"test": "node --test lib/*.test.ts"`.

- [ ] **Step 2: Failing test**

Create `frontend/lib/ledger-math.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { computeLedger } from "./ledger-math.ts";

test("net is revenue minus accrued work-order cost", () => {
  const l = computeLedger({ revenueCents: 100_000, workOrderCostCents: 12_000 });
  assert.deepEqual(l, { revenueCents: 100_000, costsCents: 12_000, netCents: 88_000 });
});

test("empty ledger is all zeros", () => {
  assert.deepEqual(computeLedger({ revenueCents: 0, workOrderCostCents: 0 }), {
    revenueCents: 0,
    costsCents: 0,
    netCents: 0,
  });
});

test("negative net is allowed (costs exceed revenue)", () => {
  assert.equal(computeLedger({ revenueCents: 5_000, workOrderCostCents: 12_000 }).netCents, -7_000);
});

test("costs are always non-negative even if a caller passes a signed amount", () => {
  assert.equal(computeLedger({ revenueCents: 0, workOrderCostCents: -12_000 }).costsCents, 12_000);
});
```

- [ ] **Step 3: Run to see it fail**

Run (from `frontend/`): `npm test`
Expected: FAIL — `Cannot find module './ledger-math.ts'`.

- [ ] **Step 4: Implement**

Create `frontend/lib/ledger-math.ts`:

```ts
/**
 * Pure ledger arithmetic. No I/O, no imports — unit-tested with node:test and
 * safe to import from Server Components and client components alike.
 *
 * Revenue = gross booking value. Costs = accrued vendor cost from completed work
 * orders. Net = Revenue − Costs. (goal.md: "Unit Net Profit = Gross − Expenses".)
 */
export type Ledger = {
  revenueCents: number;
  costsCents: number;
  netCents: number;
};

export type LedgerInputs = {
  revenueCents: number;
  workOrderCostCents: number;
};

export function computeLedger(inputs: LedgerInputs): Ledger {
  const revenueCents = Math.round(inputs.revenueCents);
  const costsCents = Math.abs(Math.round(inputs.workOrderCostCents));
  return { revenueCents, costsCents, netCents: revenueCents - costsCents };
}
```

- [ ] **Step 5: Run to see it pass**

Run (from `frontend/`): `npm test` — Expected: `# pass 4`.

- [ ] **Step 6: Ledger reader**

Create `frontend/lib/ledger.ts`:

```ts
import type { ObjectId } from "mongodb";

import { totalBookingRevenueCents } from "./bookings";
import { computeLedger, type Ledger } from "./ledger-math";
import { totalCompletedWorkOrderCostCents } from "./work-orders";

export type { Ledger };

/**
 * The one place that defines what Revenue / Costs / Net mean for Lynx. Overview,
 * Unit detail and Reports all read from here so the figures can never disagree.
 */
export async function getLedger(
  ownerId: ObjectId,
  opts: { since?: Date; unitId?: ObjectId } = {},
): Promise<Ledger> {
  const [revenueCents, workOrderCostCents] = await Promise.all([
    totalBookingRevenueCents(ownerId, opts),
    totalCompletedWorkOrderCostCents(ownerId, opts),
  ]);
  return computeLedger({ revenueCents, workOrderCostCents });
}
```

- [ ] **Step 7: Type-check and commit**

Run (from `frontend/`): `npx tsc --noEmit` — Expected: clean (test file excluded).

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(ledger): pure ledger math with node:test coverage and getLedger reader

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Booking server actions (create + checkout)

**Files:**
- Create: `frontend/app/dashboard/bookings/actions.ts`

**Interfaces:**
- Consumes: `createBooking`, `checkoutBooking`, `attachCleaningWorkOrder`, `getBookingById` (Task 3); `getUnitById`, `setUnitStatus` (`@/lib/units`); `listVendors`, `getVendorById` (`@/lib/vendors`); `createWorkOrder` (`@/lib/work-orders`); `recordActivity`.
- Produces: `createBookingAction(prev: CreateBookingState, formData: FormData): Promise<CreateBookingState>` (redirects to `/dashboard/bookings` on success); `checkoutBookingAction(bookingId: string): Promise<CheckoutBookingState>`.

- [ ] **Step 1: Write the actions**

```ts
"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import {
  attachCleaningWorkOrder,
  checkoutBooking,
  createBooking,
  getBookingById,
} from "@/lib/bookings";
import { getUnitById, setUnitStatus } from "@/lib/units";
import { getVendorById, listVendors } from "@/lib/vendors";
import { createWorkOrder } from "@/lib/work-orders";

export type CreateBookingState = { error?: string };
export type CheckoutBookingState = { error?: string };

const DEFAULT_CLEANING_FEE_CENTS = 12_000;

function parseDollarsToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseDateInput(raw: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function ownerObjectId(): Promise<ObjectId | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  return new ObjectId(session.userId);
}

function revalidateBookingSurfaces(unitId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/units");
  revalidatePath(`/dashboard/units/${unitId}`);
  revalidatePath("/dashboard/work-orders");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/reports");
}

/** R1: create booking → unit Occupied, revenue recognised. */
export async function createBookingAction(
  _prev: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };

  const unitIdRaw = String(formData.get("unitId") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const checkIn = parseDateInput(String(formData.get("checkIn") ?? ""));
  const checkOut = parseDateInput(String(formData.get("checkOut") ?? ""));
  const grossAmountCents = parseDollarsToCents(String(formData.get("amount") ?? ""));

  if (!ObjectId.isValid(unitIdRaw)) return { error: "Choose a unit." };
  if (!guestName) return { error: "Enter the guest's name." };
  if (guestName.length > 80) return { error: "Guest name is too long (max 80 characters)." };
  if (!checkIn || !checkOut) return { error: "Pick check-in and check-out dates." };
  if (checkOut <= checkIn) return { error: "Check-out must be after check-in." };
  if (grossAmountCents === null || grossAmountCents === 0)
    return { error: "Enter the booking value." };

  const unitId = new ObjectId(unitIdRaw);
  let unit;
  try {
    unit = await getUnitById(ownerId, unitId);
  } catch (err) {
    console.error("[bookings] unit read failed:", err);
    return { error: "We couldn't verify that unit. Try again." };
  }
  if (!unit) return { error: "Unit not found." };

  let booking;
  try {
    booking = await createBooking(ownerId, {
      unitId,
      unitName: unit.name,
      guestName,
      checkIn,
      checkOut,
      grossAmountCents,
    });
    await setUnitStatus(ownerId, unitId, "occupied");
  } catch (err) {
    console.error("[bookings] create failed:", err);
    return { error: "We couldn't save that booking. Please try again." };
  }

  void recordActivity(ownerId, {
    type: "booking.created",
    summary: `${booking.guestName} booked ${booking.unitName}`,
    entityType: "booking",
    entityRef: booking._id.toString(),
    meta: { unitId: unitIdRaw, grossAmountCents },
  }).catch(() => {});

  revalidateBookingSurfaces(unitIdRaw);
  redirect("/dashboard/bookings");
}

/** R3: checkout → booking checked_out, unit Needs cleaning, one cleaning work order. */
export async function checkoutBookingAction(
  bookingId: string,
): Promise<CheckoutBookingState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };
  if (!ObjectId.isValid(bookingId)) return { error: "Booking not found." };
  const bookingObjectId = new ObjectId(bookingId);

  let existing;
  try {
    existing = await getBookingById(ownerId, bookingObjectId);
  } catch (err) {
    console.error("[bookings] read failed:", err);
    return { error: "We couldn't load that booking. Try again." };
  }
  if (!existing) return { error: "Booking not found." };
  if (existing.status === "checked_out")
    return { error: "This guest has already been checked out." };

  const unit = await getUnitById(ownerId, existing.unitId);
  if (!unit) return { error: "The unit for this booking no longer exists." };

  // Resolve the cleaning vendor: the unit's preferred one, else the first cleaning vendor.
  let vendor = unit.cleaningVendorId
    ? await getVendorById(ownerId, unit.cleaningVendorId)
    : null;
  if (!vendor) {
    const [first] = await listVendors(ownerId, { role: "cleaning", limit: 1 });
    vendor = first ?? null;
  }
  if (!vendor)
    return { error: "Add a cleaning vendor before checking guests out." };

  // Atomic flip first so two concurrent checkouts can't create two cleaning jobs.
  const booking = await checkoutBooking(ownerId, bookingObjectId);
  if (!booking) return { error: "This guest has already been checked out." };

  let workOrder;
  try {
    workOrder = await createWorkOrder(ownerId, {
      unitId: unit._id,
      vendorId: vendor._id,
      unitName: unit.name,
      vendorName: vendor.name,
      type: "cleaning",
      title: `Turnover clean · ${unit.name}`,
      costCents: unit.cleaningFeeCents ?? DEFAULT_CLEANING_FEE_CENTS,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: `Auto-created at checkout for ${booking.guestName}.`,
    });
    await Promise.all([
      attachCleaningWorkOrder(ownerId, bookingObjectId, workOrder._id),
      setUnitStatus(ownerId, unit._id, "needs_cleaning"),
    ]);
  } catch (err) {
    console.error("[bookings] checkout side-effects failed:", err);
    return { error: "Checked out, but we couldn't schedule cleaning. Create the job manually." };
  }

  void recordActivity(ownerId, {
    type: "booking.checked_out",
    summary: `${booking.guestName} checked out of ${unit.name} — cleaning scheduled`,
    entityType: "booking",
    entityRef: bookingId,
    meta: { unitId: unit._id.toString(), workOrderId: workOrder._id.toString() },
  }).catch(() => {});
  void recordActivity(ownerId, {
    type: "work_order.created",
    summary: `${workOrder.title} assigned to ${workOrder.vendorName}`,
    entityType: "work_order",
    entityRef: workOrder._id.toString(),
    meta: { unitId: unit._id.toString(), vendorId: vendor._id.toString(), costCents: workOrder.costCents },
  }).catch(() => {});

  revalidateBookingSurfaces(unit._id.toString());
  return {};
}
```

- [ ] **Step 2: Type-check and commit**

Run (from `frontend/`): `npx tsc --noEmit` — Expected: clean.

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(bookings): create and checkout server actions (occupancy, cleaning work order)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Bookings UI — list, new-booking form, nav, pills, checkout button

**Files:**
- Create: `frontend/components/dashboard/booking-status-pill.tsx`
- Create: `frontend/components/dashboard/checkout-booking-button.tsx`
- Create: `frontend/app/dashboard/bookings/page.tsx`
- Create: `frontend/app/dashboard/bookings/new/page.tsx`
- Create: `frontend/app/dashboard/bookings/new/new-booking-form.tsx`
- Modify: `frontend/components/dashboard/nav-items.ts`

**Interfaces:**
- Consumes: Task 5 actions; `listBookings`, `formatBookingStatus` (Task 3); `formatUnsignedAmount` (`@/lib/payouts`); `Topbar`, `buttonClasses`, `Input`, `Button`.
- Produces: the fixed UI strings Kane depends on — sidebar **Bookings**; page title **Bookings**; button **New booking**; form labels **Unit**, **Guest name**, **Check-in**, **Check-out**, **Booking value (USD)**; submit **Create booking**; per-row **Check out** button; pill text **Upcoming / Checked in / Checked out**.

- [ ] **Step 1: Nav item**

In `frontend/components/dashboard/nav-items.ts` import `Calendar03Icon` (already used in `app/dashboard/page.tsx`, so it exists) and insert after the Units entry:

```ts
  { label: "Bookings", href: "/dashboard/bookings", icon: Calendar03Icon },
```

- [ ] **Step 2: Status pill**

Create `frontend/components/dashboard/booking-status-pill.tsx`:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/bookings";

const config: Record<
  BookingStatus,
  { label: string; icon: Parameters<typeof HugeiconsIcon>[0]["icon"]; classes: string }
> = {
  upcoming: {
    label: "Upcoming",
    icon: Calendar03Icon,
    classes: "bg-violet-50 text-violet-700 border-violet-100/70",
  },
  checked_in: {
    label: "Checked in",
    icon: UserIcon,
    classes: "bg-amber-50 text-amber-700 border-amber-100/70",
  },
  checked_out: {
    label: "Checked out",
    icon: CheckmarkCircle01Icon,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
  },
};

export function BookingStatusPill({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-tight",
        c.classes,
        className,
      )}
    >
      <HugeiconsIcon icon={c.icon} size={13} strokeWidth={2.2} />
      {c.label}
    </span>
  );
}
```

- [ ] **Step 3: Checkout button (client leaf)**

Create `frontend/components/dashboard/checkout-booking-button.tsx`:

```tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { checkoutBookingAction } from "@/app/dashboard/bookings/actions";
import { cn } from "@/lib/utils";

export function CheckoutBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await checkoutBookingAction(bookingId);
            if (res.error) setError(res.error);
          });
        }}
        className={cn(
          "cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-[#09090B] text-white font-medium h-9 px-3 text-xs",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_20px_-8px_rgba(0,0,0,0.45)] hover:bg-zinc-800 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {pending ? "Checking out" : "Check out"}
        {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.2} />}
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Bookings list page**

Create `frontend/app/dashboard/bookings/page.tsx`:

```tsx
import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Building01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { listBookings, type BookingDoc } from "@/lib/bookings";
import { formatUnsignedAmount } from "@/lib/payouts";
import { Topbar } from "@/components/dashboard/topbar";
import { BookingStatusPill } from "@/components/dashboard/booking-status-pill";
import { CheckoutBookingButton } from "@/components/dashboard/checkout-booking-button";
import { buttonClasses } from "@/components/ui/button";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let bookings: BookingDoc[] = [];
  let error: string | null = null;
  try {
    bookings = await listBookings(ownerId, { limit: 200 });
  } catch (err) {
    console.error("[bookings page] read failed:", err);
    error = "We couldn't load bookings right now. Refresh in a moment.";
  }

  const active = bookings.filter((b) => b.status !== "checked_out").length;
  const grossCents = bookings.reduce((sum, b) => sum + b.grossAmountCents, 0);

  return (
    <>
      <Topbar title="Bookings" user={{ name: session.name, email: session.email }} />

      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Reservations
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {active} active · {formatUnsignedAmount(grossCents)} gross booked. Checking a
              guest out schedules the turnover clean automatically.
            </p>
          </div>
          <Link
            href="/dashboard/bookings/new"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
            New booking
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-10 text-center">
            <span className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
              <HugeiconsIcon icon={Calendar03Icon} size={24} strokeWidth={2} />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900">No bookings yet</h3>
            <p className="mt-2 text-sm font-medium text-gray-500 max-w-md mx-auto leading-relaxed">
              Add a reservation to mark the unit occupied and recognise its revenue.
            </p>
            <Link
              href="/dashboard/bookings/new"
              className={buttonClasses({ variant: "primary", size: "md", className: "mt-6" })}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
              Create first booking
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[1.4fr_1.2fr_1fr_120px_130px_120px] gap-4 rounded-xl bg-gray-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                <span>Guest</span>
                <span>Unit</span>
                <span>Stay</span>
                <span className="text-right">Value</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <li
                    key={b._id.toString()}
                    className="grid grid-cols-[1.4fr_1.2fr_1fr_120px_130px_120px] gap-4 px-4 py-4 items-center hover:bg-gray-50/60 transition-colors rounded-xl"
                  >
                    <span className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                      {b.guestName}
                    </span>
                    <span className="min-w-0 flex items-center gap-2 text-sm font-medium text-gray-600">
                      <HugeiconsIcon icon={Building01Icon} size={14} strokeWidth={2} className="text-gray-400 shrink-0" />
                      <span className="truncate">{b.unitName}</span>
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </span>
                    <span className="text-right text-sm font-semibold tracking-tight text-zinc-900">
                      {formatUnsignedAmount(b.grossAmountCents)}
                    </span>
                    <BookingStatusPill status={b.status} />
                    <div className="flex justify-end">
                      {b.status === "checked_out" ? (
                        <span className="text-xs font-medium text-gray-400">Done</span>
                      ) : (
                        <CheckoutBookingButton bookingId={b._id.toString()} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 5: New booking form + page**

Create `frontend/app/dashboard/bookings/new/new-booking-form.tsx`:

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createBookingAction, type CreateBookingState } from "../actions";

type Option = { id: string; label: string };

const initialState: CreateBookingState = {};

function isoToday(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function NewBookingForm({ units }: { units: Option[] }) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);
  const noUnits = units.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {noUnits && (
        <div className="rounded-[2rem] bg-amber-50 border border-amber-100/70 p-5 text-sm font-medium text-amber-800">
          Add a unit before creating bookings.
        </div>
      )}

      <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Reservation</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Creating a booking marks the unit occupied and recognises the revenue.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="unitId" className="text-[11px] font-medium tracking-tight text-gray-500">
            Unit
          </label>
          <select
            id="unitId"
            name="unitId"
            required
            className={cn(
              "h-12 rounded-2xl bg-white border border-gray-200 px-4 text-sm font-medium text-zinc-900",
              "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.03)] outline-none",
              "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
            )}
          >
            <option value="">Select unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <Input name="guestName" required maxLength={80} label="Guest name" placeholder="Sarah Johnson" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="checkIn" type="date" required label="Check-in" defaultValue={isoToday(0)} />
          <Input name="checkOut" type="date" required label="Check-out" defaultValue={isoToday(3)} />
        </div>

        <Input
          name="amount"
          required
          inputMode="decimal"
          label="Booking value (USD)"
          placeholder="1000"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={pending || noUnits} className="min-w-[13rem]">
          {pending ? "Creating..." : "Create booking"}
          {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />}
        </Button>
        <Link href="/dashboard/bookings" className="text-sm font-medium text-gray-500 hover:text-zinc-900 px-3 py-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}
```

Create `frontend/app/dashboard/bookings/new/page.tsx`:

```tsx
import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { listUnits } from "@/lib/units";
import { Topbar } from "@/components/dashboard/topbar";
import { NewBookingForm } from "./new-booking-form";

export default async function NewBookingPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let units: Awaited<ReturnType<typeof listUnits>> = [];
  try {
    units = await listUnits(ownerId, { limit: 200 });
  } catch (err) {
    console.error("[new booking] read failed:", err);
  }

  return (
    <>
      <Topbar title="New booking" user={{ name: session.name, email: session.email }} />
      <nav className="text-sm font-medium text-gray-500 -mt-2">
        <Link href="/dashboard/bookings" className="hover:text-zinc-900 transition-colors">
          Bookings
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-zinc-900">New</span>
      </nav>
      <div className="max-w-3xl">
        <NewBookingForm units={units.map((u) => ({ id: u._id.toString(), label: u.name }))} />
      </div>
    </>
  );
}
```

- [ ] **Step 6: Verify in the browser**

Run (from `frontend/`): `npx tsc --noEmit` then, with `npm run dev` running, open `http://localhost:3000/demo` → Enter demo account → Bookings → New booking → create "Sarah Johnson / Unit … / 1000". Expected: redirected to the list; row shows `$1,000.00`, pill "Checked in" (check-in defaults to today); unit page shows Occupied; "Check out" → pill "Checked out", Work orders shows "Turnover clean · <unit>" Assigned, unit shows Needs cleaning.

- [ ] **Step 7: Commit**

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(bookings): bookings list, new-booking form, checkout button, nav

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: R4 — refuse Ready while a cleaning job is open

**Files:**
- Modify: `frontend/app/dashboard/units/actions.ts` (`setUnitStatusAction`)
- Modify: `frontend/app/dashboard/units/[id]/page.tsx` (pass `blockedStatuses`)

**Interfaces:**
- Consumes: `hasOpenCleaningWorkOrder` (Task 3); `UnitStatusSwitcher.blockedStatuses` (Task 2).
- Produces: the fixed refusal copy `"<unit> has an open cleaning job. Complete it before marking the unit Ready."`

- [ ] **Step 1: Server guard**

In `frontend/app/dashboard/units/actions.ts` import `getUnitById` from `@/lib/units` and `hasOpenCleaningWorkOrder` from `@/lib/work-orders`, then in `setUnitStatusAction`, right after `const unitObjectId = new ObjectId(unitId);` insert:

```ts
  if (status === "ready") {
    const [unit, openCleaning] = await Promise.all([
      getUnitById(ownerId, unitObjectId),
      hasOpenCleaningWorkOrder(ownerId, unitObjectId),
    ]);
    if (!unit) return { error: "Unit not found." };
    if (openCleaning) {
      return {
        error: `${unit.name} has an open cleaning job. Complete it before marking the unit Ready.`,
      };
    }
  }
```

- [ ] **Step 2: Pass the block to the switcher**

In `frontend/app/dashboard/units/[id]/page.tsx`, after `workOrders` is loaded compute:

```ts
  const openCleaning = workOrders.some(
    (w) => w.type === "cleaning" && w.status === "assigned",
  );
```

and render the switcher as:

```tsx
<UnitStatusSwitcher
  unitId={id}
  current={unit.status}
  blockedStatuses={openCleaning ? ["ready"] : []}
  blockedReason={`${unit.name} has an open cleaning job. Complete it before marking the unit Ready.`}
/>
```

- [ ] **Step 3: Verify and commit**

Browser: unit with an open "Turnover clean" job → click **Ready** → the rose alert appears with the refusal copy and the status does not change. Complete the job on Work orders → unit becomes Ready.

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(units): refuse Ready while a cleaning job is open (R4)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Profitability card + ledger-based revenue on Overview, Unit detail, Reports

**Files:**
- Create: `frontend/components/dashboard/profitability-card.tsx`
- Modify: `frontend/app/dashboard/page.tsx`
- Modify: `frontend/app/dashboard/units/[id]/page.tsx`
- Modify: `frontend/app/dashboard/reports/page.tsx`

**Interfaces:**
- Consumes: `getLedger` (Task 4), `formatUnsignedAmount`.
- Produces: a card titled **Profitability** with three rows labelled exactly **Revenue**, **Costs**, **Net** and exact values (e.g. `$1,000.00`). Kane reads these.

- [ ] **Step 1: The card (Server Component, no client code)**

Create `frontend/components/dashboard/profitability-card.tsx`:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { MoneyBag01Icon } from "@hugeicons/core-free-icons";

import type { Ledger } from "@/lib/ledger-math";
import { formatUnsignedAmount } from "@/lib/payouts";
import { cn } from "@/lib/utils";

/**
 * The ledger, stated exactly. Values are never abbreviated here: this card is the
 * source of truth humans and Kane read, so "$1,000.00" must say "$1,000.00".
 */
export function ProfitabilityCard({
  ledger,
  windowLabel = "Last 30 days",
}: {
  ledger: Ledger;
  windowLabel?: string;
}) {
  const negative = ledger.netCents < 0;
  const rows: { label: string; cents: number; emphasis?: boolean }[] = [
    { label: "Revenue", cents: ledger.revenueCents },
    { label: "Costs", cents: ledger.costsCents },
    { label: "Net", cents: ledger.netCents, emphasis: true },
  ];

  return (
    <section
      aria-labelledby="profitability-heading"
      className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 id="profitability-heading" className="text-base font-semibold tracking-tight text-zinc-900">
            Profitability
          </h3>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Bookings minus completed vendor work · {windowLabel}
          </p>
        </div>
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#09090B] text-white">
          <HugeiconsIcon icon={MoneyBag01Icon} size={18} strokeWidth={2} />
        </span>
      </div>

      <dl className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between py-3 first:pt-0 last:pb-0">
            <dt className={cn("text-sm font-semibold tracking-tight", row.emphasis ? "text-zinc-900" : "text-gray-600")}>
              {row.label}
            </dt>
            <dd
              className={cn(
                "tabular-nums tracking-tight",
                row.emphasis ? "text-2xl font-semibold" : "text-base font-semibold",
                row.emphasis && negative ? "text-rose-700" : "text-zinc-900",
              )}
            >
              {row.label === "Net" && negative ? "-" : ""}
              {formatUnsignedAmount(row.cents)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 2: Overview reads the ledger**

In `frontend/app/dashboard/page.tsx`:
- Replace the import of `totalMonthlyRevenueCents` with `import { getLedger } from "@/lib/ledger";` and `import type { Ledger } from "@/lib/ledger-math";` and add `import { ProfitabilityCard } from "@/components/dashboard/profitability-card";`.
- Replace `let revenueCents = 0;` and `let costsCents = 0;` with `let ledger: Ledger = { revenueCents: 0, costsCents: 0, netCents: 0 };`.
- In the `Promise.all`, replace `totalMonthlyRevenueCents(ownerId)` with `getLedger(ownerId, { since: defaultProfitWindowStart() })` and remove the `totalCompletedSpendCents(...)` entry (and its destructured variable); destructure `ledger` in that position.
- Replace `const netProfitCents = revenueCents - costsCents;` with `const { revenueCents, costsCents, netCents: netProfitCents } = ledger;`.
- Change the Net profit KPI `hint` fallback from `"Set unit revenue to track"` to `"Add a booking to track"`.
- Render `<ProfitabilityCard ledger={ledger} />` directly **above** `<OperationsPanel …/>` inside the non-error branch.
- Remove the now-unused `totalCompletedSpendCents` import if nothing else uses it (keep `defaultProfitWindowStart`, `formatAmount`, `formatUnsignedAmount`).

- [ ] **Step 3: Unit detail reads booking revenue**

In `frontend/app/dashboard/units/[id]/page.tsx` import `getLedger` from `@/lib/ledger` and replace the block from `// Costs in the rolling profit window` through `const showProfit = …` with:

```ts
  const unitLedger = await getLedger(ownerId, {
    since: defaultProfitWindowStart(),
    unitId: unitObjectId,
  });
  const periodCostsCents = unitLedger.costsCents;
  const monthlyRevenueCents = unitLedger.revenueCents;
  const netProfitCents = unitLedger.netCents;
  const showProfit = monthlyRevenueCents > 0 || periodCostsCents > 0;
```

(Leave the later `unit.monthlyRevenueCents` "Monthly revenue" display fields alone — they are informational; the ledger figures now come from bookings.)

- [ ] **Step 4: Reports reads booking revenue**

In `frontend/app/dashboard/reports/page.tsx` replace the `totalMonthlyRevenueCents` import with `import { totalBookingRevenueCents } from "@/lib/bookings";` and `import { defaultProfitWindowStart } from "@/lib/payouts";` (if not already imported), and in `Promise.all` replace `totalMonthlyRevenueCents(ownerId)` with `totalBookingRevenueCents(ownerId, { since: defaultProfitWindowStart() })`.

- [ ] **Step 5: Type-check, lint, eyeball, commit**

Run (from `frontend/`): `npx tsc --noEmit && npm run lint` — Expected: clean.
Browser: Overview shows the Profitability card; with the booking from Task 6 checked out and the cleaning job completed it reads `Revenue $1,000.00 / Costs $120.00 / Net $880.00` (seed fee is set in Task 9 — before that the cost is whatever the unit's fee was, default `$120.00`).

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(ledger): profitability card; overview, unit detail and reports read booking revenue

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Deterministic seed + "Reset & launch demo"

**Files:**
- Modify: `frontend/lib/seed.ts`
- Modify: `frontend/app/demo/actions.ts`
- Modify: `frontend/components/demo/launch-demo-button.tsx`
- Modify: `frontend/app/demo/page.tsx`

**Interfaces:**
- Consumes: `createUnit` (with `cleaningFeeCents`, `cleaningVendorId`), `createVendor`, `recordActivity`, `getDb`.
- Produces: `seedDemoData(ownerId)` (unchanged signature, new fixed content), `resetDemoData(ownerId)`, server action `resetAndLaunchDemo()`, and the `/demo` button **Reset & launch demo**.

- [ ] **Step 1: Rewrite the seed**

Replace `frontend/lib/seed.ts` with:

```ts
import { ObjectId } from "mongodb";

import { recordActivity } from "./activity";
import { getDb } from "./mongodb";
import { createUnit, listUnits } from "./units";
import { createVendor, listVendors } from "./vendors";

/**
 * Fixed starter data. Deliberately booking-free with no open work orders and no
 * payouts, so the ledger starts at $0.00 / $0.00 / $0.00 and every Kane test
 * can assert exact figures after performing its own flow.
 */
const UNIT_SEEDS = [
  {
    name: "Unit 7 · Harbor",
    type: "Short-term rental",
    status: "ready" as const,
    address: "7 Harbor View Rd, Portland, ME",
    cleaningFeeCents: 12_000,
    notes: "Waterfront two-bed. Turnover clean is a flat $120.",
  },
  {
    name: "Loft · Mission",
    type: "Short-term rental",
    status: "ready" as const,
    address: "846 Valencia St, San Francisco, CA",
    cleaningFeeCents: 9_500,
  },
  {
    name: "Suite · Capitol Hill",
    type: "Short-term rental",
    status: "maintenance" as const,
    address: "1402 E Pike St, Seattle, WA",
    cleaningFeeCents: 8_500,
    notes: "HVAC repair scheduled — back online next week.",
  },
];

const VENDOR_SEEDS = [
  { name: "BrightTurn Cleaning", role: "cleaning" as const, email: "ops@brightturn.example" },
  { name: "Northline Maintenance", role: "maintenance" as const, email: "dispatch@northline.example" },
];

export async function seedDemoData(ownerId: ObjectId): Promise<void> {
  const [existingUnits, existingVendors] = await Promise.all([
    listUnits(ownerId, { limit: 1 }),
    listVendors(ownerId, { limit: 1 }),
  ]);
  if (existingUnits.length > 0 || existingVendors.length > 0) return;

  const vendors = [];
  for (const vendor of VENDOR_SEEDS) {
    const doc = await createVendor(ownerId, { ...vendor, isDemo: true });
    vendors.push(doc);
    await recordActivity(ownerId, {
      type: "vendor.created",
      summary: `${doc.name} added as a vendor`,
      entityType: "vendor",
      entityRef: doc._id.toString(),
      meta: { isDemo: true },
    });
  }
  const cleaningVendor = vendors.find((v) => v.role === "cleaning");

  for (const seed of UNIT_SEEDS) {
    const unit = await createUnit(ownerId, {
      ...seed,
      cleaningVendorId: cleaningVendor?._id,
      isDemo: true,
    });
    await recordActivity(ownerId, {
      type: "unit.created",
      summary: `${unit.name} added to your portfolio`,
      entityType: "unit",
      entityRef: unit._id.toString(),
      meta: { isDemo: true },
    });
  }
}

const OWNED_COLLECTIONS = [
  "units",
  "vendors",
  "work_orders",
  "payouts",
  "activity_events",
  "bookings",
] as const;

/** Hard-delete everything the owner has, then reseed. Used by "Reset & launch demo". */
export async function resetDemoData(ownerId: ObjectId): Promise<void> {
  const db = await getDb();
  await Promise.all(
    OWNED_COLLECTIONS.map((name) => db.collection(name).deleteMany({ ownerId })),
  );
  await seedDemoData(ownerId);
}
```

Check the activity collection name: `grep -n 'const COLLECTION' frontend/lib/activity.ts frontend/lib/payouts.ts frontend/lib/vendors.ts` and make `OWNED_COLLECTIONS` match exactly.

- [ ] **Step 2: Reset action**

In `frontend/app/demo/actions.ts` change the seed import to `import { resetDemoData, seedDemoData } from "@/lib/seed";`, extract the user lookup into a helper, and add the new action:

```ts
async function ensureDemoUser() {
  let user = await getUserByEmail(DEMO_EMAIL);
  if (!user) {
    try {
      user = await createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      user = await getUserByEmail(DEMO_EMAIL);
      if (!user) throw err;
    }
  }
  return user;
}

export async function launchDemo() {
  const user = await ensureDemoUser();
  await seedDemoData(user._id);
  await setSession({ userId: user._id.toString(), email: user.email, name: user.name });
  redirect("/dashboard");
}

/** Wipe + reseed the demo account, then sign in. Every Kane test starts here. */
export async function resetAndLaunchDemo() {
  const user = await ensureDemoUser();
  await resetDemoData(user._id);
  await setSession({ userId: user._id.toString(), email: user.email, name: user.name });
  redirect("/dashboard");
}
```

- [ ] **Step 3: Button supports both actions**

Replace `frontend/components/demo/launch-demo-button.tsx` with:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, RefreshIcon } from "@hugeicons/core-free-icons";

import { buttonClasses } from "@/components/ui/button";
import { launchDemo, resetAndLaunchDemo } from "@/app/demo/actions";

export function LaunchDemoButton({
  variant = "primary",
  label = "Launch Demo",
  mode = "launch",
  className,
}: {
  variant?: "primary" | "secondary";
  label?: string;
  /** "reset" wipes and reseeds the demo account before signing in. */
  mode?: "launch" | "reset";
  className?: string;
}) {
  const action = mode === "reset" ? resetAndLaunchDemo : launchDemo;
  return (
    <form action={action}>
      <button type="submit" className={buttonClasses({ variant, size: "md", className })}>
        <HugeiconsIcon icon={mode === "reset" ? RefreshIcon : PlayIcon} size={14} strokeWidth={2} />
        {label}
      </button>
    </form>
  );
}
```

In `frontend/app/demo/page.tsx` add, right after `<LaunchDemoButton label="Enter demo account" />`:

```tsx
          <LaunchDemoButton mode="reset" variant="secondary" label="Reset & launch demo" />
```

and update the paragraph copy to: `Opens a seeded operator account with three units and two vendors. "Reset & launch demo" wipes the account first so every run starts from the same state.`

- [ ] **Step 4: Verify and commit**

Browser: `/demo` → **Reset & launch demo** → Overview shows 3 units, Profitability `$0.00 / $0.00 / $0.00`, no work orders, Bookings empty. Do it twice — identical result.

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(demo): deterministic booking-free seed and Reset & launch demo action

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: ProofLoop — NDJSON parser (TDD)

**Files:**
- Create: `proofloop/src/ndjson.ts`
- Create: `proofloop/test/ndjson.test.ts`
- Create: `proofloop/test/fixtures/run-passed.ndjson`, `proofloop/test/fixtures/run-failed.ndjson`, `proofloop/test/fixtures/run-no-end.ndjson`
- Create: `proofloop/package.json` (`{"name":"proofloop","private":true,"type":"module","scripts":{"test":"node --test test/"}}`)
- Create: `proofloop/tsconfig.json`

**Interfaces:**
- Produces: `RunEnd`, `ProgressEvent`, `ParsedRun`, `createRunParser()` → `{ push(chunk), line(line), end(): ParsedRun, result(): ParsedRun }`, `deriveOutcome(parsed, exitCode): "passed" | "failed" | "error"`.

- [ ] **Step 1: Scaffold**

```bash
mkdir -p "$ROOT/proofloop/src" "$ROOT/proofloop/test/fixtures"
cat > "$ROOT/proofloop/package.json" <<'EOT'
{
  "name": "proofloop",
  "private": true,
  "type": "module",
  "description": "Every AI-written change must prove itself in a real browser (Kane CLI) before Claude Code may finish.",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "test": "node --test test/",
    "verify": "node src/cli.ts verify --changed",
    "verify:all": "node src/cli.ts verify --all",
    "report": "node src/cli.ts report"
  }
}
EOT
cat > "$ROOT/proofloop/tsconfig.json" <<'EOT'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "types": ["node"],
    "typeRoots": ["../frontend/node_modules/@types"],
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
EOT
```

- [ ] **Step 2: Fixtures**

`proofloop/test/fixtures/run-passed.ndjson`:

```
{"type":"bifurcation","flows":["reset","book"],"count":2}
{"step":1,"status":"passed","remark":"Opened /demo and clicked Reset & launch demo"}
{"step":2,"status":"passed","remark":"Created booking for Sarah Johnson"}
{"step":3,"status":"passed","remark":"Asserted Revenue equals $1,000.00"}
{"type":"run_end","status":"passed","summary":"Booking created; revenue $1,000.00","one_liner":"Booking flow passed","reason":"Objective completed","duration":41.2,"credits":0,"final_state":{"revenue":"$1,000.00"},"context":{"memory":{},"variables":{},"pointer":"(passed)"},"session_dir":"~/.testmuai/kaneai/sessions/abc","run_dir":"~/.testmuai/kaneai/sessions/abc/runs/0","test_url":"https://test-manager.lambdatest.com/projects/1/test-cases/2"}
```

`proofloop/test/fixtures/run-failed.ndjson`:

```
{"step":1,"status":"passed","remark":"Opened /demo and clicked Reset & launch demo"}
not json at all — kane sometimes prints a warning line
{"step":2,"status":"passed","remark":"Created booking and checked out"}
{"step":3,"status":"failed","remark":"Asserted Net equals $780.00 — found $680.00"}
{"type":"run_end","status":"failed","summary":"Net showed $680.00","one_liner":"Profit assertion failed","reason":"Net showed $680.00, expected $780.00","duration":63.9,"credits":14,"final_state":{"revenue":"$1,000.00","costs":"$320.00","net":"$680.00"},"session_dir":"~/.testmuai/kaneai/sessions/def","run_dir":"~/.testmuai/kaneai/sessions/def/runs/0","test_url":"https://test-manager.lambdatest.com/projects/1/test-cases/3"}
```

`proofloop/test/fixtures/run-no-end.ndjson`:

```
{"step":1,"status":"passed","remark":"Opened /demo"}
{"type":"error","message":"Chrome exited unexpectedly"}
{ this line is broken json
```

- [ ] **Step 3: Failing tests**

Create `proofloop/test/ndjson.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createRunParser, deriveOutcome } from "../src/ndjson.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(here, "fixtures", name), "utf8");

test("captures run_end, steps and typed events from a passing run", () => {
  const p = createRunParser();
  p.push(fixture("run-passed.ndjson"));
  const r = p.end();
  assert.equal(r.runEnd?.status, "passed");
  assert.equal(r.runEnd?.final_state?.revenue, "$1,000.00");
  assert.equal(r.steps.length, 3);
  assert.equal(r.events.length, 1);
  assert.equal(r.events[0].type, "bifurcation");
  assert.equal(r.failedStep, null);
  assert.equal(r.malformedLines, 0);
});

test("records the failed step and tolerates non-JSON noise", () => {
  const p = createRunParser();
  p.push(fixture("run-failed.ndjson"));
  const r = p.end();
  assert.equal(r.runEnd?.status, "failed");
  assert.equal(r.runEnd?.reason, "Net showed $680.00, expected $780.00");
  assert.deepEqual(r.failedStep, { step: 3, status: "failed", remark: "Asserted Net equals $780.00 — found $680.00" });
  assert.equal(r.malformedLines, 0); // plain-text noise is ignored, not counted as malformed
});

test("missing run_end yields null and counts broken JSON objects", () => {
  const p = createRunParser();
  p.push(fixture("run-no-end.ndjson"));
  const r = p.end();
  assert.equal(r.runEnd, null);
  assert.equal(r.malformedLines, 1);
  assert.equal(r.events[0].type, "error");
});

test("handles chunks split mid-line", () => {
  const p = createRunParser();
  const text = fixture("run-passed.ndjson");
  for (let i = 0; i < text.length; i += 7) p.push(text.slice(i, i + 7));
  const r = p.end();
  assert.equal(r.steps.length, 3);
  assert.equal(r.runEnd?.status, "passed");
});

test("lines after run_end are ignored", () => {
  const p = createRunParser();
  p.line('{"type":"run_end","status":"passed"}');
  p.line('{"step":9,"status":"failed","remark":"late"}');
  const r = p.end();
  assert.equal(r.steps.length, 0);
});

test("deriveOutcome combines run_end with the exit code", () => {
  const passed = createRunParser();
  passed.line('{"type":"run_end","status":"passed"}');
  assert.equal(deriveOutcome(passed.end(), 0), "passed");

  const failed = createRunParser();
  failed.line('{"type":"run_end","status":"failed"}');
  assert.equal(deriveOutcome(failed.end(), 1), "failed");

  const noEnd = createRunParser();
  assert.equal(deriveOutcome(noEnd.end(), 0), "error");

  const infra = createRunParser();
  infra.line('{"type":"run_end","status":"passed"}');
  assert.equal(deriveOutcome(infra.end(), 2), "error");
  assert.equal(deriveOutcome(infra.end(), 3), "error");
});
```

- [ ] **Step 4: Run to see them fail**

Run (from `proofloop/`): `npm test` — Expected: FAIL, cannot find `../src/ndjson.ts`.

- [ ] **Step 5: Implement**

Create `proofloop/src/ndjson.ts`:

```ts
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
      if (ev.status === "failed") result.failedStep = ev;
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
```

- [ ] **Step 6: Run to see them pass**

Run (from `proofloop/`): `npm test` — Expected: `# pass 6`.

- [ ] **Step 7: Commit**

```bash
cd "$ROOT" && git add proofloop && git commit -m "feat(proofloop): Kane NDJSON parser keyed on run_end, with node:test coverage

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: ProofLoop — impact mapping and git diff (TDD)

**Files:**
- Create: `proofloop/src/impact.ts`, `proofloop/src/diff.ts`, `proofloop/proofloop.map.json`
- Create: `proofloop/test/impact.test.ts`

**Interfaces:**
- Produces: `FlowMap`, `Impact`, `globToRegExp(glob)`, `matchesAny(path, globs)`, `computeImpact(changed, map)`, `loadFlowMap(root)`, `getChangedFiles(cwd)`.

- [ ] **Step 1: The map (committed config)**

Create `proofloop/proofloop.map.json`:

```json
{
  "$comment": "Maps changed files to the business flows Kane must re-prove. Paths are globs relative to the repo root. A file matching `shared` selects every flow; a changed file matching nothing is reported as unmapped and triggers `fallback`.",
  "flows": {
    "booking": {
      "title": "Booking lifecycle — revenue and occupancy",
      "tests": ["kane/booking-lifecycle_test.md"],
      "paths": [
        "frontend/lib/bookings.ts",
        "frontend/app/dashboard/bookings/**",
        "frontend/components/dashboard/booking-status-pill.tsx",
        "frontend/components/dashboard/unit-card.tsx",
        "frontend/components/dashboard/unit-status-pill.tsx"
      ]
    },
    "cleaning": {
      "title": "Cleaning lifecycle — checkout creates one cleaning job",
      "tests": ["kane/cleaning-lifecycle_test.md"],
      "paths": [
        "frontend/lib/bookings.ts",
        "frontend/lib/work-orders.ts",
        "frontend/app/dashboard/bookings/actions.ts",
        "frontend/app/dashboard/units/**",
        "frontend/components/dashboard/checkout-booking-button.tsx",
        "frontend/components/dashboard/unit-status-switcher.tsx"
      ]
    },
    "readiness": {
      "title": "Unit readiness — completing cleaning pays the vendor once",
      "tests": ["kane/unit-readiness_test.md"],
      "paths": [
        "frontend/lib/work-orders.ts",
        "frontend/lib/payouts.ts",
        "frontend/app/dashboard/work-orders/**",
        "frontend/app/vendor/**",
        "frontend/components/dashboard/complete-work-order-button.tsx"
      ]
    },
    "profit": {
      "title": "Profitability invariant — Net = Revenue − Costs",
      "tests": ["kane/profit-invariant_test.md"],
      "paths": [
        "frontend/lib/ledger.ts",
        "frontend/lib/ledger-math.ts",
        "frontend/lib/bookings.ts",
        "frontend/lib/payouts.ts",
        "frontend/lib/work-orders.ts",
        "frontend/app/dashboard/page.tsx",
        "frontend/components/dashboard/profitability-card.tsx"
      ]
    }
  },
  "shared": [
    "frontend/lib/seed.ts",
    "frontend/lib/units.ts",
    "frontend/lib/unit-status.ts",
    "frontend/lib/mongodb.ts",
    "frontend/lib/auth.ts",
    "frontend/app/demo/**",
    "frontend/app/dashboard/layout.tsx",
    "frontend/components/dashboard/sidebar.tsx",
    "frontend/components/dashboard/nav-items.ts",
    "frontend/components/dashboard/mobile-drawer.tsx"
  ],
  "fallback": ["profit"],
  "ignore": [
    "frontend/app/proofloop/**",
    "frontend/app/api/proofloop/**",
    "frontend/lib/proofloop.ts",
    "frontend/app/(auth)/**",
    "frontend/app/dashboard/billing/**",
    "frontend/app/dashboard/settings/**",
    "frontend/app/dashboard/help/**",
    "frontend/components/sections/**",
    "frontend/app/page.tsx",
    "frontend/lib/email.ts",
    "frontend/lib/stripe.ts"
  ]
}
```

- [ ] **Step 2: Failing tests**

Create `proofloop/test/impact.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { computeImpact, globToRegExp, type FlowMap } from "../src/impact.ts";

const map: FlowMap = {
  flows: {
    booking: { tests: ["kane/booking_test.md"], paths: ["frontend/lib/bookings.ts", "frontend/app/dashboard/bookings/**"] },
    profit: { tests: ["kane/profit_test.md"], paths: ["frontend/lib/ledger.ts", "frontend/lib/bookings.ts"] },
  },
  shared: ["frontend/lib/seed.ts", "frontend/app/demo/**"],
  fallback: ["profit"],
  ignore: ["frontend/app/proofloop/**"],
};

test("globToRegExp: ** spans directories, * does not", () => {
  assert.ok(globToRegExp("frontend/app/dashboard/bookings/**").test("frontend/app/dashboard/bookings/new/page.tsx"));
  assert.ok(globToRegExp("frontend/lib/*.ts").test("frontend/lib/bookings.ts"));
  assert.ok(!globToRegExp("frontend/lib/*.ts").test("frontend/lib/sub/bookings.ts"));
  assert.ok(globToRegExp("**/*.md").test("kane/x_test.md"));
  assert.ok(globToRegExp("**/*.md").test("README.md"));
  assert.ok(globToRegExp("frontend/app/(auth)/**").test("frontend/app/(auth)/login/page.tsx"));
});

test("a file in exactly one flow selects that flow", () => {
  const i = computeImpact(["frontend/app/dashboard/bookings/page.tsx"], map);
  assert.deepEqual(i.flows, ["booking"]);
  assert.deepEqual(i.unmapped, []);
});

test("a file in several flows selects all of them, in map order", () => {
  const i = computeImpact(["frontend/lib/bookings.ts"], map);
  assert.deepEqual(i.flows, ["booking", "profit"]);
  assert.deepEqual(i.matched.booking, ["frontend/lib/bookings.ts"]);
});

test("a shared file selects every flow", () => {
  const i = computeImpact(["frontend/app/demo/actions.ts"], map);
  assert.deepEqual(i.flows, ["booking", "profit"]);
});

test("an unmapped frontend file is reported and triggers the fallback flow", () => {
  const i = computeImpact(["frontend/lib/vendors.ts"], map);
  assert.deepEqual(i.unmapped, ["frontend/lib/vendors.ts"]);
  assert.deepEqual(i.flows, ["profit"]);
});

test("non-frontend, docs, tests, env and ignored paths are skipped entirely", () => {
  const i = computeImpact(
    ["proofloop/src/cli.ts", "frontend/README.md", "frontend/lib/ledger-math.test.ts", "frontend/.env.local", "frontend/app/proofloop/page.tsx", "docs/x.md"],
    map,
  );
  assert.deepEqual(i.flows, []);
  assert.deepEqual(i.unmapped, []);
  assert.equal(i.ignored.length, 6);
});

test("no changes → no flows", () => {
  assert.deepEqual(computeImpact([], map).flows, []);
});
```

- [ ] **Step 3: Run to see them fail**

Run (from `proofloop/`): `npm test` — Expected: FAIL on `../src/impact.ts`.

- [ ] **Step 4: Implement impact + diff**

Create `proofloop/src/impact.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FlowDef = { title?: string; tests: string[]; paths: string[] };
export type FlowMap = {
  flows: Record<string, FlowDef>;
  shared?: string[];
  fallback?: string[];
  ignore?: string[];
};

export type Impact = {
  /** Flows to run, in map order. */
  flows: string[];
  /** Changed, verifiable files that matched no flow. Never silently dropped. */
  unmapped: string[];
  /** flow → the changed files that selected it. */
  matched: Record<string, string[]>;
  /** Changed files that were eligible for mapping. */
  considered: string[];
  /** Changed files skipped (outside frontend/, docs, tests, env, ignore list). */
  ignored: string[];
};

const ALWAYS_IGNORE = [
  "**/*.md",
  "**/*.test.ts",
  "frontend/public/**",
  "frontend/.env*",
  "frontend/.gitignore",
  "frontend/*.json",
  "frontend/*.mjs",
  "frontend/next.config.ts",
  "**/.DS_Store",
];

/** Minimal glob → RegExp: `**` spans directories, `*` stays within one, `?` is one char. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (ch === "?") {
      re += "[^/]";
    } else if ("\\^$+.()|{}[]".includes(ch)) {
      re += `\\${ch}`;
    } else {
      re += ch;
    }
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(path: string, globs: string[]): boolean {
  return globs.some((g) => globToRegExp(g).test(path));
}

export function computeImpact(changed: string[], map: FlowMap): Impact {
  const ignoreGlobs = [...ALWAYS_IGNORE, ...(map.ignore ?? [])];
  const considered: string[] = [];
  const ignored: string[] = [];
  for (const file of changed) {
    if (!file.startsWith("frontend/") || matchesAny(file, ignoreGlobs)) ignored.push(file);
    else considered.push(file);
  }

  const flowNames = Object.keys(map.flows);
  const selected = new Set<string>();
  const matched: Record<string, string[]> = {};
  const unmapped: string[] = [];

  const select = (flow: string, file: string) => {
    selected.add(flow);
    (matched[flow] ??= []).push(file);
  };

  for (const file of considered) {
    let hit = false;
    if (matchesAny(file, map.shared ?? [])) {
      for (const flow of flowNames) select(flow, file);
      hit = true;
    } else {
      for (const flow of flowNames) {
        if (matchesAny(file, map.flows[flow].paths)) {
          select(flow, file);
          hit = true;
        }
      }
    }
    if (!hit) unmapped.push(file);
  }

  if (unmapped.length > 0) {
    for (const flow of map.fallback ?? []) if (map.flows[flow]) selected.add(flow);
  }

  return {
    flows: flowNames.filter((f) => selected.has(f)),
    unmapped,
    matched,
    considered,
    ignored,
  };
}

export function loadFlowMap(root: string): FlowMap {
  const raw = readFileSync(join(root, "proofloop", "proofloop.map.json"), "utf8");
  return JSON.parse(raw) as FlowMap;
}
```

Create `proofloop/src/diff.ts`:

```ts
import { execFileSync } from "node:child_process";

function git(args: string[], cwd: string): string[] {
  return execFileSync("git", args, { cwd, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function gitRoot(cwd: string): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" }).trim();
}

/**
 * Everything that differs from HEAD: unstaged, staged and untracked (respecting
 * .gitignore). Paths are repo-root-relative, sorted, de-duplicated.
 */
export function getChangedFiles(cwd: string): string[] {
  const root = gitRoot(cwd);
  const files = new Set<string>([
    ...git(["diff", "--name-only", "HEAD"], root),
    ...git(["diff", "--name-only", "--cached"], root),
    ...git(["ls-files", "--others", "--exclude-standard"], root),
  ]);
  return [...files].sort();
}
```

- [ ] **Step 5: Run to see them pass, commit**

Run (from `proofloop/`): `npm test` — Expected: all pass (ndjson 6 + impact 7).

```bash
cd "$ROOT" && git add proofloop && git commit -m "feat(proofloop): flow map, glob impact mapping and git change discovery

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: ProofLoop — Kane runner with a stub binary (TDD)

**Files:**
- Create: `proofloop/src/kane.ts`
- Create: `proofloop/test/fixtures/bin/kane-cli` (executable shell stub)
- Create: `proofloop/test/kane.test.ts`

**Interfaces:**
- Consumes: `createRunParser`, `ProgressEvent` (Task 10).
- Produces: `KaneRunOptions`, `KaneRunResult`, `buildKaneArgs(opts)`, `runKaneTest(opts)`, `kaneVersion(bin?)`. Binary resolution: `opts.kaneBin ?? process.env.PROOFLOOP_KANE_BIN ?? "kane-cli"`.

- [ ] **Step 1: Stub binary**

```bash
mkdir -p "$ROOT/proofloop/test/fixtures/bin"
cat > "$ROOT/proofloop/test/fixtures/bin/kane-cli" <<'EOT'
#!/bin/sh
# Test stub for kane-cli. Prints the NDJSON fixture named by $KANE_STUB_FIXTURE to
# stdout (like `--agent` mode), a progress line to stderr, and exits $KANE_STUB_EXIT.
if [ "$1" = "--version" ]; then echo "kane-cli-stub 0.0.0"; exit 0; fi
echo "stub: $*" >&2
if [ -n "$KANE_STUB_FIXTURE" ]; then cat "$KANE_STUB_FIXTURE"; fi
exit "${KANE_STUB_EXIT:-0}"
EOT
chmod +x "$ROOT/proofloop/test/fixtures/bin/kane-cli"
```

- [ ] **Step 2: Failing tests**

Create `proofloop/test/kane.test.ts`:

```ts
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
    ["testmd", "run", "kane/x_test.md", "--agent", "--headless", "--retry", "--timeout", "420", "--variables-file", ".testmuai/variables/local.json"],
  );
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
```

- [ ] **Step 3: Run to see them fail**

Run (from `proofloop/`): `npm test` — Expected: FAIL on `../src/kane.ts`.

- [ ] **Step 4: Implement**

Create `proofloop/src/kane.ts`:

```ts
import { execFileSync, spawn } from "node:child_process";

import { createRunParser, type ParsedRun, type ProgressEvent } from "./ndjson.ts";

export type KaneRunOptions = {
  /** Path to a `*_test.md`, relative to `cwd`. */
  testPath: string;
  cwd: string;
  variablesFile?: string;
  timeoutS?: number;
  headless?: boolean; // default true
  retry?: boolean; // default true
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
  if (opts.retry !== false) args.push("--retry");
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
```

- [ ] **Step 5: Run to see them pass, commit**

Run (from `proofloop/`): `npm test` — Expected: all pass.

```bash
cd "$ROOT" && git add proofloop && git commit -m "feat(proofloop): Kane testmd runner with live step streaming and stub-backed tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: ProofLoop — report writer + `verify` pipeline (TDD with injected deps)

**Files:**
- Create: `proofloop/src/report.ts`, `proofloop/src/verify.ts`
- Create: `proofloop/test/verify.test.ts`

**Interfaces:**
- Consumes: Tasks 10–12.
- Produces:
  - `FlowResult`, `VerifyReport`, `Verdict = "verified" | "failed" | "error" | "nothing-to-verify"`.
  - `writeReport(root, report)`, `readLatest(root)`, `readHistory(root, limit)`, `collectEvidence(root, reportId, flow, runDir)`, `formatConsole(report)`, `buildBlockReason(report, attempt, maxAttempts)`, `buildAllowMessage(report)`.
  - `runVerify(opts: VerifyOptions, deps?: Partial<VerifyDeps>): Promise<VerifyReport>`.

- [ ] **Step 1: Failing tests**

Create `proofloop/test/verify.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { runVerify } from "../src/verify.ts";
import { buildBlockReason, readLatest } from "../src/report.ts";
import { createRunParser } from "../src/ndjson.ts";
import type { KaneRunResult } from "../src/kane.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (n: string) => readFileSync(join(here, "fixtures", n), "utf8");

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "proofloop-"));
  mkdirSync(join(root, "proofloop"), { recursive: true });
  mkdirSync(join(root, ".testmuai", "variables"), { recursive: true });
  mkdirSync(join(root, "kane"), { recursive: true });
  writeFileSync(
    join(root, "proofloop", "proofloop.map.json"),
    JSON.stringify({
      flows: {
        booking: { tests: ["kane/booking_test.md"], paths: ["frontend/lib/bookings.ts"] },
        profit: { tests: ["kane/profit_test.md"], paths: ["frontend/lib/ledger.ts", "frontend/lib/bookings.ts"] },
      },
      fallback: ["profit"],
    }),
  );
  writeFileSync(join(root, ".testmuai", "variables", "local.json"), JSON.stringify({ app_url: { value: "http://localhost:3000" } }));
  writeFileSync(join(root, "kane", "booking_test.md"), "# t\n## s\nx\n");
  writeFileSync(join(root, "kane", "profit_test.md"), "# t\n## s\nx\n");
  return root;
}

function fakeRun(fixtureName: string, exitCode: number): KaneRunResult {
  const p = createRunParser();
  p.push(fixture(fixtureName));
  return { exitCode, parsed: p.end(), durationS: 1.5, command: "stub" };
}

const okDeps = {
  checkApp: async () => true,
  checkKane: () => "kane-cli 0.8.4",
  now: () => new Date("2026-08-20T15:00:00Z"),
  log: () => {},
};

test("nothing to verify when no mapped files changed", async () => {
  const root = makeRoot();
  const r = await runVerify({ root, mode: "changed", trigger: "cli", attempt: 1 }, { ...okDeps, getChangedFiles: () => ["README.md"], runTest: async () => { throw new Error("must not run"); } });
  assert.equal(r.verdict, "nothing-to-verify");
  assert.deepEqual(r.flows, []);
});

test("runs each impacted flow once and records a verified report", async () => {
  const root = makeRoot();
  const ran: string[] = [];
  const r = await runVerify(
    { root, mode: "changed", trigger: "cli", attempt: 1 },
    { ...okDeps, getChangedFiles: () => ["frontend/lib/bookings.ts"], runTest: async (o) => { ran.push(o.testPath); return fakeRun("run-passed.ndjson", 0); } },
  );
  assert.deepEqual(ran, ["kane/booking_test.md", "kane/profit_test.md"]);
  assert.equal(r.verdict, "verified");
  assert.equal(r.results[0].status, "passed");
  assert.equal(r.results[0].finalState.revenue, "$1,000.00");
  const latest = readLatest(root);
  assert.equal(latest?.id, r.id);
  assert.ok(existsSync(join(root, ".proofloop", "history.jsonl")));
});

test("a failed flow yields a failed verdict with the failing step and values", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "flow", flow: "profit", trigger: "hook", attempt: 1 },
    { ...okDeps, getChangedFiles: () => ["frontend/lib/ledger.ts"], runTest: async () => fakeRun("run-failed.ndjson", 1) },
  );
  assert.equal(r.verdict, "failed");
  assert.equal(r.results[0].reason, "Net showed $680.00, expected $780.00");
  assert.equal(r.results[0].failedStep?.step, 3);
  const reason = buildBlockReason(r, 1, 3);
  assert.match(reason, /FAILED in a real browser/);
  assert.match(reason, /net=\$680\.00/);
  assert.match(reason, /Attempt 1 of 3/);
  assert.match(reason, /Do not edit kane\//);
});

test("missing run_end or exit 2 is an error, not a failure", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "all", trigger: "cli", attempt: 1 },
    { ...okDeps, getChangedFiles: () => [], runTest: async () => fakeRun("run-no-end.ndjson", 2) },
  );
  assert.equal(r.verdict, "error");
  assert.equal(r.results[0].status, "error");
});

test("preflight failure short-circuits with an error verdict", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "all", trigger: "cli", attempt: 1 },
    { ...okDeps, checkApp: async () => false, getChangedFiles: () => [], runTest: async () => { throw new Error("must not run"); } },
  );
  assert.equal(r.verdict, "error");
  assert.match(r.preflight?.message ?? "", /http:\/\/localhost:3000/);
});

test("unmapped files are reported and trigger the fallback flow", async () => {
  const root = makeRoot();
  const r = await runVerify(
    { root, mode: "changed", trigger: "cli", attempt: 1 },
    { ...okDeps, getChangedFiles: () => ["frontend/lib/vendors.ts"], runTest: async () => fakeRun("run-passed.ndjson", 0) },
  );
  assert.deepEqual(r.unmapped, ["frontend/lib/vendors.ts"]);
  assert.deepEqual(r.flows, ["profit"]);
});
```

- [ ] **Step 2: Run to see them fail**

Run (from `proofloop/`): `npm test` — Expected: FAIL on `../src/verify.ts`.

- [ ] **Step 3: Implement `report.ts`**

```ts
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";

export type FlowStatus = "passed" | "failed" | "error";
export type Verdict = "verified" | "failed" | "error" | "nothing-to-verify";

export type FlowResult = {
  flow: string;
  title: string;
  test: string;
  status: FlowStatus;
  exitCode: number;
  reason: string;
  summary: string;
  oneLiner: string;
  finalState: Record<string, unknown>;
  failedStep: { step: number; remark: string } | null;
  stepsTotal: number;
  durationS: number;
  credits: number;
  /** credits === 0 means Kane replayed cached recordings. */
  replayed: boolean;
  runDir: string | null;
  testUrl: string | null;
  evidence: { screenshot: string | null; actions: string | null };
};

export type VerifyReport = {
  id: string;
  startedAt: string;
  finishedAt: string;
  trigger: "hook" | "cli";
  attempt: number;
  changedFiles: string[];
  unmapped: string[];
  ignored: string[];
  flows: string[];
  results: FlowResult[];
  verdict: Verdict;
  preflight?: { ok: boolean; message: string };
};

export function proofloopDir(root: string): string {
  return join(root, ".proofloop");
}

export function reportId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function writeReport(root: string, report: VerifyReport): void {
  const dir = proofloopDir(root);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "latest.json"), JSON.stringify(report, null, 2));
  appendFileSync(join(dir, "history.jsonl"), `${JSON.stringify(report)}\n`);
}

export function readLatest(root: string): VerifyReport | null {
  const file = join(proofloopDir(root), "latest.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as VerifyReport;
}

export function readHistory(root: string, limit = 20): VerifyReport[] {
  const file = join(proofloopDir(root), "history.jsonl");
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").split("\n").filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l) as VerifyReport).reverse();
}

function expandHome(p: string): string {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

function newestPng(dir: string, depth = 0): string | null {
  if (depth > 4 || !existsSync(dir)) return null;
  let best: { file: string; mtime: number } | null = null;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      const inner = newestPng(full, depth + 1);
      if (inner) {
        const m = statSync(inner).mtimeMs;
        if (!best || m > best.mtime) best = { file: inner, mtime: m };
      }
    } else if (entry.toLowerCase().endsWith(".png")) {
      if (!best || st.mtimeMs > best.mtime) best = { file: full, mtime: st.mtimeMs };
    }
  }
  return best?.file ?? null;
}

/** Copy the failing step's screenshot and the action log into .proofloop/evidence/. */
export function collectEvidence(
  root: string,
  id: string,
  flow: string,
  runDir: string | null,
): FlowResult["evidence"] {
  const out: FlowResult["evidence"] = { screenshot: null, actions: null };
  if (!runDir) return out;
  const src = expandHome(runDir);
  if (!existsSync(src)) return out;
  const dest = join(proofloopDir(root), "evidence", id, flow);
  mkdirSync(dest, { recursive: true });
  const png = newestPng(src);
  if (png) {
    const target = join(dest, "failure.png");
    copyFileSync(png, target);
    out.screenshot = relative(root, target);
  }
  const actions = join(src, "run-test", "actions.ndjson");
  if (existsSync(actions)) {
    const target = join(dest, "actions.ndjson");
    copyFileSync(actions, target);
    out.actions = relative(root, target);
  }
  return out;
}

const ICON: Record<FlowStatus, string> = { passed: "✓", failed: "✗", error: "!" };

function fmtState(state: Record<string, unknown>): string {
  const entries = Object.entries(state);
  if (entries.length === 0) return "(none)";
  return entries.map(([k, v]) => `${k}=${String(v)}`).join(" ");
}

export function formatConsole(report: VerifyReport): string {
  const lines: string[] = [];
  lines.push(`ProofLoop ${report.id} · trigger=${report.trigger} · attempt=${report.attempt}`);
  lines.push(`Changed: ${report.changedFiles.length ? report.changedFiles.join(", ") : "(none)"}`);
  if (report.unmapped.length) lines.push(`Unmapped (ran fallback): ${report.unmapped.join(", ")}`);
  if (report.preflight && !report.preflight.ok) lines.push(`Preflight: ${report.preflight.message}`);
  lines.push("");
  for (const r of report.results) {
    lines.push(`${ICON[r.status]} ${r.flow.padEnd(10)} ${r.status.padEnd(7)} ${r.durationS}s ${r.replayed ? "replay" : `${r.credits} credits`}  ${r.test}`);
    if (r.status !== "passed") {
      lines.push(`    reason: ${r.reason || "(none)"}`);
      if (r.failedStep) lines.push(`    step ${r.failedStep.step}: ${r.failedStep.remark}`);
      lines.push(`    observed: ${fmtState(r.finalState)}`);
      if (r.evidence.screenshot) lines.push(`    screenshot: ${r.evidence.screenshot}`);
      if (r.testUrl) lines.push(`    kane: ${r.testUrl}`);
    }
  }
  lines.push("");
  const passed = report.results.filter((r) => r.status === "passed").length;
  const banner =
    report.verdict === "verified" ? `VERIFIED — ${passed}/${report.results.length} flows proven in a real browser`
    : report.verdict === "failed" ? `FAILED — ${report.results.length - passed} of ${report.results.length} flows did not hold`
    : report.verdict === "error" ? "UNVERIFIED — ProofLoop could not run Kane"
    : "NOTHING TO VERIFY — no mapped frontend changes";
  lines.push(banner);
  return lines.join("\n");
}

/** Plain text an agent can act on. Fed to Claude as the Stop-hook block reason. */
export function buildBlockReason(report: VerifyReport, attempt: number, maxAttempts: number): string {
  const failed = report.results.filter((r) => r.status !== "passed");
  const lines: string[] = [];
  lines.push(
    `ProofLoop: ${failed.length} of ${report.results.length} impacted flow(s) FAILED in a real browser (Kane CLI). You may not finish yet.`,
  );
  lines.push("");
  for (const r of report.results) {
    if (r.status === "passed") {
      lines.push(`✓ ${r.flow} — passed (${r.replayed ? "replayed, 0 credits" : `${r.credits} credits`})`);
      continue;
    }
    lines.push(`✗ ${r.flow} — ${r.test}`);
    lines.push(`  Kane: "${r.reason || r.summary || "no reason reported"}"`);
    lines.push(`  Observed final_state: ${fmtState(r.finalState)}`);
    if (r.failedStep) lines.push(`  Failed at step ${r.failedStep.step}: "${r.failedStep.remark}"`);
    if (r.evidence.screenshot) lines.push(`  Screenshot: ${r.evidence.screenshot}`);
    if (r.evidence.actions) lines.push(`  Action log: ${r.evidence.actions}`);
    if (r.testUrl) lines.push(`  Kane run: ${r.testUrl}`);
    lines.push("");
  }
  lines.push(`Changed files: ${report.changedFiles.join(", ") || "(none)"}`);
  lines.push(
    "Fix the application code so the flow passes. Do not edit kane/*_test.md to make it pass unless the requirement itself changed.",
  );
  lines.push(`Then end your turn again; ProofLoop will re-run Kane. Attempt ${attempt} of ${maxAttempts}.`);
  return lines.join("\n");
}

export function buildAllowMessage(report: VerifyReport): string {
  const total = report.results.length;
  const secs = report.results.reduce((s, r) => s + r.durationS, 0);
  const replayed = report.results.filter((r) => r.replayed).length;
  return `✅ ProofLoop: ${total}/${total} impacted flow(s) verified in a real browser by Kane CLI (${Math.round(secs)}s, ${replayed} replayed). Flows: ${report.flows.join(", ")}.`;
}
```

- [ ] **Step 4: Implement `verify.ts`**

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getChangedFiles as gitChangedFiles } from "./diff.ts";
import { computeImpact, loadFlowMap } from "./impact.ts";
import { kaneVersion, runKaneTest, type KaneRunOptions, type KaneRunResult } from "./kane.ts";
import { deriveOutcome } from "./ndjson.ts";
import { collectEvidence, reportId, writeReport, type FlowResult, type VerifyReport } from "./report.ts";

export type VerifyOptions = {
  root: string;
  mode: "changed" | "all" | "flow";
  flow?: string;
  trigger: "hook" | "cli";
  attempt: number;
  timeoutS?: number; // per test, default 420
};

export type VerifyDeps = {
  getChangedFiles: (cwd: string) => string[];
  runTest: (opts: KaneRunOptions) => Promise<KaneRunResult>;
  checkApp: (url: string) => Promise<boolean>;
  checkKane: () => string | null;
  now: () => Date;
  log: (message: string) => void;
};

export const VARIABLES_FILE = ".testmuai/variables/local.json";

export function readAppUrl(root: string): string {
  const file = join(root, VARIABLES_FILE);
  if (!existsSync(file)) return "http://localhost:3000";
  try {
    const vars = JSON.parse(readFileSync(file, "utf8")) as Record<string, { value?: string }>;
    return vars.app_url?.value ?? "http://localhost:3000";
  } catch {
    return "http://localhost:3000";
  }
}

async function defaultCheckApp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "manual" });
    return res.status < 500;
  } catch {
    return false;
  }
}

function defaultDeps(): VerifyDeps {
  return {
    getChangedFiles: gitChangedFiles,
    runTest: runKaneTest,
    checkApp: defaultCheckApp,
    checkKane: () => kaneVersion(),
    now: () => new Date(),
    log: (m) => process.stderr.write(`${m}\n`),
  };
}

export async function runVerify(opts: VerifyOptions, overrides: Partial<VerifyDeps> = {}): Promise<VerifyReport> {
  const deps: VerifyDeps = { ...defaultDeps(), ...overrides };
  const startedAt = deps.now();
  const id = reportId(startedAt);
  const map = loadFlowMap(opts.root);
  const changedFiles = deps.getChangedFiles(opts.root);
  const impact = computeImpact(changedFiles, map);

  let flows: string[];
  if (opts.mode === "all") flows = Object.keys(map.flows);
  else if (opts.mode === "flow") {
    if (!opts.flow || !map.flows[opts.flow]) throw new Error(`Unknown flow "${opts.flow}". Known: ${Object.keys(map.flows).join(", ")}`);
    flows = [opts.flow];
  } else flows = impact.flows;

  const base: VerifyReport = {
    id,
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
    trigger: opts.trigger,
    attempt: opts.attempt,
    changedFiles,
    unmapped: impact.unmapped,
    ignored: impact.ignored,
    flows,
    results: [],
    verdict: "nothing-to-verify",
  };

  if (flows.length === 0) {
    deps.log("ProofLoop: no mapped frontend changes — nothing to verify.");
    return base; // not persisted: a no-op must not overwrite the last real verdict
  }

  // Preflight: Kane present, app reachable, tests exist.
  const appUrl = readAppUrl(opts.root);
  const kane = deps.checkKane();
  const problems: string[] = [];
  if (!kane) problems.push("kane-cli not found on PATH — npm install -g @testmuai/kane-cli && kane-cli login");
  if (!(await deps.checkApp(appUrl))) problems.push(`Lynx is not reachable at ${appUrl} — start it with: cd frontend && npm run dev`);
  for (const flow of flows) for (const t of map.flows[flow].tests) if (!existsSync(join(opts.root, t))) problems.push(`missing test file ${t}`);
  if (problems.length) {
    const report: VerifyReport = { ...base, verdict: "error", preflight: { ok: false, message: problems.join("; ") }, finishedAt: deps.now().toISOString() };
    writeReport(opts.root, report);
    return report;
  }

  deps.log(`ProofLoop: ${changedFiles.length} changed file(s) → ${flows.length} flow(s): ${flows.join(", ")}`);
  if (impact.unmapped.length) deps.log(`ProofLoop: unmapped changes (running fallback): ${impact.unmapped.join(", ")}`);

  const results: FlowResult[] = [];
  const seenTests = new Set<string>();
  for (const flow of flows) {
    const def = map.flows[flow];
    for (const test of def.tests) {
      if (seenTests.has(test)) continue;
      seenTests.add(test);
      deps.log(`▶ ${flow} — ${test}`);
      const run = await deps.runTest({
        testPath: test,
        cwd: opts.root,
        variablesFile: VARIABLES_FILE,
        timeoutS: opts.timeoutS ?? 420,
        onStep: (s) => deps.log(`  [${flow}] step ${s.step} ${s.status === "passed" ? "✓" : "✗"} ${s.remark}`),
      });
      const status = deriveOutcome(run.parsed, run.exitCode);
      const end = run.parsed.runEnd;
      const credits = typeof end?.credits === "number" ? end.credits : 0;
      const result: FlowResult = {
        flow,
        title: def.title ?? flow,
        test,
        status,
        exitCode: run.exitCode,
        reason: end?.reason ?? (status === "error" ? `kane-cli exited ${run.exitCode} without a run_end event` : ""),
        summary: end?.summary ?? "",
        oneLiner: end?.one_liner ?? "",
        finalState: (end?.final_state as Record<string, unknown> | undefined) ?? {},
        failedStep: run.parsed.failedStep ? { step: run.parsed.failedStep.step, remark: run.parsed.failedStep.remark } : null,
        stepsTotal: run.parsed.steps.length,
        durationS: typeof end?.duration === "number" ? end.duration : run.durationS,
        credits,
        replayed: credits === 0 && status !== "error",
        runDir: end?.run_dir ?? null,
        testUrl: end?.test_url ?? null,
        evidence: { screenshot: null, actions: null },
      };
      if (status !== "passed") result.evidence = collectEvidence(opts.root, id, flow, result.runDir);
      deps.log(`${status === "passed" ? "✓" : "✗"} ${flow} ${status} (${result.durationS}s)`);
      results.push(result);
    }
  }

  const verdict: VerifyReport["verdict"] = results.some((r) => r.status === "error")
    ? "error"
    : results.every((r) => r.status === "passed")
      ? "verified"
      : "failed";
  const report: VerifyReport = { ...base, results, verdict, finishedAt: deps.now().toISOString() };
  writeReport(opts.root, report);
  return report;
}
```

- [ ] **Step 5: Run to see them pass, commit**

Run (from `proofloop/`): `npm test` — Expected: all pass.

```bash
cd "$ROOT" && git add proofloop && git commit -m "feat(proofloop): verify pipeline (diff → impact → Kane → evidence → report)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: ProofLoop — Stop-hook adapter, CLI entry, Claude Code wiring (TDD)

**Files:**
- Create: `proofloop/src/hook.ts`, `proofloop/src/cli.ts`
- Create: `proofloop/test/hook.test.ts`
- Create: `.claude/settings.json`

**Interfaces:**
- Consumes: `runVerify` (Task 13), `buildBlockReason`, `buildAllowMessage`, `formatConsole`, `readLatest`.
- Produces: `decide(report, attemptsAfter, max)` → `{ action, message, exitCode }`; `runHook(stdinText, root, deps?)`; CLI `node proofloop/src/cli.ts verify [--changed|--all|--flow <name>] [--json]`, `… hook`, `… report [--json]`.
- Hook protocol (verified against the Claude Code hooks reference): **block = exit code 2 with the reason on stderr**; **allow = exit 0**, optionally with `{"systemMessage": "…"}` on stdout. Stop hooks take no matcher. Default Stop timeout is 600s; we set 1500.

- [ ] **Step 1: Failing tests**

Create `proofloop/test/hook.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { decide, MAX_ATTEMPTS, readAttempts, runHook } from "../src/hook.ts";
import type { VerifyReport } from "../src/report.ts";

function report(verdict: VerifyReport["verdict"]): VerifyReport {
  return {
    id: "x", startedAt: "", finishedAt: "", trigger: "hook", attempt: 1,
    changedFiles: ["frontend/lib/ledger.ts"], unmapped: [], ignored: [], flows: ["profit"],
    results: verdict === "nothing-to-verify" ? [] : [{
      flow: "profit", title: "Profit", test: "kane/profit-invariant_test.md",
      status: verdict === "verified" ? "passed" : verdict === "failed" ? "failed" : "error",
      exitCode: verdict === "verified" ? 0 : 1, reason: "Net showed $680.00, expected $780.00", summary: "", oneLiner: "",
      finalState: { net: "$680.00" }, failedStep: { step: 3, remark: "net mismatch" }, stepsTotal: 3,
      durationS: 10, credits: 0, replayed: true, runDir: null, testUrl: null, evidence: { screenshot: null, actions: null },
    }],
    verdict,
    preflight: verdict === "error" ? { ok: false, message: "Lynx is not reachable at http://localhost:3000" } : undefined,
  };
}

test("nothing to verify → allow silently", () => {
  const d = decide(report("nothing-to-verify"), 0, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.equal(d.exitCode, 0);
  assert.equal(d.message, "");
});

test("verified → allow with a visible proof message", () => {
  const d = decide(report("verified"), 0, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.match(d.message, /✅ ProofLoop: 1\/1/);
});

test("failed under the cap → block with exit 2 and the structured reason", () => {
  const d = decide(report("failed"), 1, MAX_ATTEMPTS);
  assert.equal(d.action, "block");
  assert.equal(d.exitCode, 2);
  assert.match(d.message, /You may not finish yet/);
  assert.match(d.message, /Attempt 1 of 3/);
});

test("failed at the cap → allow with a human-needed message", () => {
  const d = decide(report("failed"), 3, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.match(d.message, /⛔ ProofLoop: 3 attempts exhausted/);
});

test("error → allow with a warning, never block", () => {
  const d = decide(report("error"), 0, MAX_ATTEMPTS);
  assert.equal(d.action, "allow");
  assert.match(d.message, /⚠️ ProofLoop could not verify/);
  assert.match(d.message, /not reachable/);
});

test("runHook counts attempts per session and clears them on success", async () => {
  const root = mkdtempSync(join(tmpdir(), "proofloop-hook-"));
  const payload = JSON.stringify({ session_id: "s1", cwd: root, hook_event_name: "Stop" });
  let verdict: VerifyReport["verdict"] = "failed";
  const deps = { verify: async () => report(verdict) };

  const first = await runHook(payload, root, deps);
  assert.equal(first.action, "block");
  assert.equal(readAttempts(root, "s1"), 1);

  const second = await runHook(payload, root, deps);
  assert.equal(second.action, "block");
  assert.equal(readAttempts(root, "s1"), 2);

  verdict = "verified";
  const third = await runHook(payload, root, deps);
  assert.equal(third.action, "allow");
  assert.equal(readAttempts(root, "s1"), 0);
});

test("PROOFLOOP_DISABLED=1 allows immediately without verifying", async () => {
  const root = mkdtempSync(join(tmpdir(), "proofloop-hook-"));
  process.env.PROOFLOOP_DISABLED = "1";
  try {
    const d = await runHook("{}", root, { verify: async () => { throw new Error("must not run"); } });
    assert.equal(d.action, "allow");
  } finally {
    delete process.env.PROOFLOOP_DISABLED;
  }
});
```

- [ ] **Step 2: Run to see them fail**

Run (from `proofloop/`): `npm test` — Expected: FAIL on `../src/hook.ts`.

- [ ] **Step 3: Implement `hook.ts`**

```ts
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildAllowMessage, buildBlockReason, proofloopDir, type VerifyReport } from "./report.ts";
import { runVerify } from "./verify.ts";

export const MAX_ATTEMPTS = 3;

export type HookPayload = {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
  last_assistant_message?: string;
};

export type HookDecision = {
  action: "allow" | "block";
  /** Block: fed to Claude as the reason. Allow: shown as a systemMessage (may be empty). */
  message: string;
  exitCode: 0 | 2;
};

export type HookDeps = {
  verify: (attempt: number) => Promise<VerifyReport>;
};

function attemptsFile(root: string, sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(proofloopDir(root), `session-${safe}.json`);
}

export function readAttempts(root: string, sessionId: string): number {
  const file = attemptsFile(root, sessionId);
  if (!existsSync(file)) return 0;
  try {
    return Number((JSON.parse(readFileSync(file, "utf8")) as { attempts?: number }).attempts ?? 0);
  } catch {
    return 0;
  }
}

function writeAttempts(root: string, sessionId: string, attempts: number): void {
  mkdirSync(proofloopDir(root), { recursive: true });
  writeFileSync(attemptsFile(root, sessionId), JSON.stringify({ attempts, updatedAt: new Date().toISOString() }));
}

function clearAttempts(root: string, sessionId: string): void {
  const file = attemptsFile(root, sessionId);
  if (existsSync(file)) unlinkSync(file);
}

/**
 * Policy table (spec §5.2):
 *   nothing-to-verify → allow silently
 *   verified          → allow + proof message
 *   failed, n < max   → BLOCK with the structured reason
 *   failed, n ≥ max   → allow + "human needed"
 *   error             → allow + warning (an unreachable app is not a code failure)
 */
export function decide(report: VerifyReport, attemptsAfter: number, max: number): HookDecision {
  switch (report.verdict) {
    case "nothing-to-verify":
      return { action: "allow", message: "", exitCode: 0 };
    case "verified":
      return { action: "allow", message: buildAllowMessage(report), exitCode: 0 };
    case "error":
      return {
        action: "allow",
        message: `⚠️ ProofLoop could not verify this change: ${report.preflight?.message ?? report.results.map((r) => r.reason).filter(Boolean).join("; ") ?? "unknown error"}. Fix the environment and run: node proofloop/src/cli.ts verify --changed`,
        exitCode: 0,
      };
    case "failed":
      if (attemptsAfter >= max) {
        return {
          action: "allow",
          message: `⛔ ProofLoop: ${max} attempts exhausted and Kane still reports a failure — a human needs to look. See .proofloop/latest.json and the evidence under .proofloop/evidence/.`,
          exitCode: 0,
        };
      }
      return { action: "block", message: buildBlockReason(report, attemptsAfter, max), exitCode: 2 };
  }
}

export function parsePayload(text: string): HookPayload {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as HookPayload;
  } catch {
    return {};
  }
}

export async function runHook(stdinText: string, root: string, overrides: Partial<HookDeps> = {}): Promise<HookDecision> {
  if (process.env.PROOFLOOP_DISABLED === "1") {
    return { action: "allow", message: "", exitCode: 0 };
  }
  const payload = parsePayload(stdinText);
  const sessionId = payload.session_id ?? "unknown";
  const deps: HookDeps = {
    verify: (attempt) => runVerify({ root, mode: "changed", trigger: "hook", attempt }),
    ...overrides,
  };

  const previous = readAttempts(root, sessionId);
  const report = await deps.verify(previous + 1);

  let attemptsAfter = previous;
  if (report.verdict === "failed") {
    attemptsAfter = previous + 1;
    writeAttempts(root, sessionId, attemptsAfter);
  } else if (report.verdict === "verified") {
    clearAttempts(root, sessionId);
    attemptsAfter = 0;
  }
  return decide(report, attemptsAfter, MAX_ATTEMPTS);
}
```

- [ ] **Step 4: Implement `cli.ts`**

```ts
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
import { formatConsole, proofloopDir, readLatest } from "./report.ts";
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
    const report = await runVerify({
      root,
      mode,
      flow: option(args, "--flow"),
      trigger: "cli",
      attempt: 1,
      timeoutS: timeoutRaw ? Number(timeoutRaw) : undefined,
    });
    process.stdout.write(flag(args, "--json") ? `${JSON.stringify(report, null, 2)}\n` : `${formatConsole(report)}\n`);
    return report.verdict === "verified" || report.verdict === "nothing-to-verify" ? 0 : report.verdict === "failed" ? 1 : 2;
  }

  if (command === "hook") {
    // Progress goes to a log file, not stderr: on a block, stderr IS the reason Claude reads.
    mkdirSync(proofloopDir(root), { recursive: true });
    const logFile = join(proofloopDir(root), "hook.log");
    const log = (m: string) => appendFileSync(logFile, `${new Date().toISOString()} ${m}\n`);
    const stdin = await readStdin();
    log(`--- Stop hook fired; payload=${stdin.slice(0, 200)}`);
    const decision = await runHook(stdin, root, {
      verify: (attempt) => runVerify({ root, mode: "changed", trigger: "hook", attempt }, { log }),
    });
    log(`decision=${decision.action} exit=${decision.exitCode}`);
    if (decision.action === "block") {
      process.stderr.write(decision.message);
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
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`ProofLoop crashed: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    // A crash must never trap the agent: exit 0 so Claude can stop. The error is visible in hook.log / stderr.
    process.exit(0);
  },
);
```

- [ ] **Step 5: Run the tests and a real dry run**

Run (from `proofloop/`): `npm test` — Expected: all suites pass.
Run (from `ROOT`): `node proofloop/src/cli.ts verify --changed` — Expected (with everything committed): `NOTHING TO VERIFY`, exit 0. `node proofloop/src/cli.ts help` prints usage.

- [ ] **Step 6: Wire the Stop hook**

```bash
mkdir -p "$ROOT/.claude"
cat > "$ROOT/.claude/settings.json" <<'EOT'
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/proofloop/src/cli.ts\" hook",
            "timeout": 1500
          }
        ]
      }
    ]
  }
}
EOT
```

Then (from `ROOT`) simulate the hook exactly as Claude Code would, with a dirty mapped file:

```bash
echo "// touch" >> frontend/lib/ledger.ts
echo '{"session_id":"manual-test","hook_event_name":"Stop","cwd":"'"$ROOT"'"}' | node proofloop/src/cli.ts hook; echo "exit=$?"
git checkout -- frontend/lib/ledger.ts
```

Expected before Task 15 exists: preflight error (missing test files) → `{"systemMessage":"⚠️ ProofLoop could not verify …"}` and `exit=0`. After Task 15: a real Kane run; `exit=0` with ✅ on pass, `exit=2` with the reason on stderr on fail. Note: Claude Code snapshots hooks at session start — restart the session (or use `/hooks`) to pick up the new file.

- [ ] **Step 7: Commit**

```bash
cd "$ROOT" && git add proofloop .claude && git commit -m "feat(proofloop): Stop-hook adapter with attempt cap, CLI entry, Claude Code wiring

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: The Kane contract — four `_test.md` files, authored green, recordings committed

**Files:**
- Create: `kane/booking-lifecycle_test.md`, `kane/cleaning-lifecycle_test.md`, `kane/unit-readiness_test.md`, `kane/profit-invariant_test.md`
- Commit: `kane/output-*/` (created by Kane on the first run)

**Interfaces:**
- Consumes: the fixed UI copy from Tasks 6–9; `{{app_url}}` from `.testmuai/variables/local.json`; a running `npm run dev`; a logged-in `kane-cli`.
- Produces: the four tests referenced by `proofloop.map.json`. The assertion that the demo feature will change lives in the **last** step of `profit-invariant_test.md` (cascade rule: editing step N re-authors N and later).

Rules for the prose (from the Kane agent doc): imperative verbs; include the starting URL in the first step; exact-text assertions; `store … as '<name>'` for values you want in `final_state`; ≤ 10 steps per test. The reset step is inlined in every test rather than `@import`ed so a helper parse problem can't take all four tests down at once.

- [ ] **Step 1: Write the four tests**

`kane/booking-lifecycle_test.md`:

````markdown
---
mode: testing
headless: true
max_steps: 30
---
# Booking lifecycle — a booking occupies the unit and recognises revenue

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Open the new booking form
Click "Bookings" in the left sidebar, then click the "New booking" button.

## Create a $1,000 booking for Unit 7
Select "Unit 7 · Harbor" in the "Unit" dropdown. Type "Sarah Johnson" into the "Guest name" field. Leave "Check-in" and "Check-out" as prefilled. Type 1000 into the "Booking value (USD)" field. Click the "Create booking" button.

## The booking appears
Assert the bookings table now contains a row with guest "Sarah Johnson", unit "Unit 7 · Harbor" and value "$1,000.00".

## Unit 7 is occupied
Click "Units" in the left sidebar. Assert the card for "Unit 7 · Harbor" shows the status "Occupied".

## Revenue is recognised
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount shown next to "Revenue" as 'revenue' and assert it equals "$1,000.00".
````

`kane/cleaning-lifecycle_test.md`:

````markdown
---
mode: testing
headless: true
max_steps: 30
---
# Cleaning lifecycle — checkout schedules exactly one turnover clean

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking for Unit 7
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check the guest out
In the bookings table, click the "Check out" button on the "Sarah Johnson" row. Assert that row's status pill now reads "Checked out" and the "Check out" button is gone.

## Exactly one cleaning job was created
Click "Work orders" in the left sidebar. Assert there is a job titled "Turnover clean · Unit 7 · Harbor" with the status "Assigned" and cost "-$120.00". Store the number of rows whose title is "Turnover clean · Unit 7 · Harbor" as 'cleaning_jobs' and assert it equals 1.

## Unit 7 needs cleaning and refuses to be marked Ready
Click "Units" in the left sidebar, then click "Unit 7 · Harbor" to open its page. Assert the unit's status reads "Needs cleaning". Click the "Ready" button in the status switcher. Assert an alert appears containing "has an open cleaning job" and the status still reads "Needs cleaning".
````

`kane/unit-readiness_test.md`:

````markdown
---
mode: testing
headless: true
max_steps: 30
---
# Unit readiness — completing the clean pays the vendor once and frees the unit

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking and check the guest out
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", click "Create booking". Then click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out".

## Complete the cleaning job
Click "Work orders" in the left sidebar. Click the "Complete" button on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row now shows "Completed" and the action column reads "Done".

## The vendor is owed exactly the cleaning fee
Click "Overview" in the left sidebar. Store the amount shown under "Owed to vendors" as 'owed' and assert it equals "$120.00".

## Unit 7 is ready again
Click "Units" in the left sidebar. Assert the card for "Unit 7 · Harbor" shows the status "Ready".

## The clean is charged once, not twice
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount next to "Costs" as 'costs' and assert it equals "$120.00" and not "$240.00".
````

`kane/profit-invariant_test.md`:

````markdown
---
mode: testing
headless: true
max_steps: 30
---
# Profitability invariant — Net equals Revenue minus Costs

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a $1,000 booking for Unit 7
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check out and complete the turnover clean
Click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out". Click "Work orders" in the left sidebar and click "Complete" on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row shows "Completed".

## The ledger adds up
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount next to "Revenue" as 'revenue', the amount next to "Costs" as 'costs' and the amount next to "Net" as 'net'. Assert revenue equals "$1,000.00", costs equals "$120.00" and net equals "$880.00".
````

- [ ] **Step 2: Author each test (first run spends credits; later runs replay free)**

With `npm run dev` running (from `frontend/`) and from `ROOT`:

```bash
for t in booking-lifecycle cleaning-lifecycle unit-readiness profit-invariant; do
  kane-cli testmd run kane/${t}_test.md --agent --headless --timeout 420 --variables-file .testmuai/variables/local.json | tail -1
done
```

Expected: each prints a `run_end` with `"status":"passed"`. If one fails because of prose ambiguity, read `kane/output-<stem>/Result.md`, tighten **only that step's** wording (later steps re-author anyway), and re-run that single test. If it fails because the **app** is wrong, fix the app — that is the point.

- [ ] **Step 3: Prove the replay is free and the full pipeline works**

```bash
node proofloop/src/cli.ts verify --all
```

Expected: four `✓ … replay` lines and `VERIFIED — 4/4 flows proven in a real browser`, exit 0; `.proofloop/latest.json` exists.

- [ ] **Step 4: Commit tests + recordings**

```bash
cd "$ROOT" && git add kane && git commit -m "test(kane): four business-invariant flows with committed replay recordings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 16: ProofLoop status page + evidence route

**Files:**
- Create: `frontend/lib/proofloop.ts`
- Create: `frontend/app/proofloop/page.tsx`
- Create: `frontend/app/api/proofloop/evidence/[...path]/route.ts`

**Interfaces:**
- Consumes: `.proofloop/latest.json`, `.proofloop/history.jsonl`, `.proofloop/evidence/**` written by Task 13 (same JSON shape as `VerifyReport` — duplicated as a type here because `frontend/` cannot import `.ts`-extension modules from `proofloop/`).
- Produces: `GET /proofloop` (public, no auth — judges open it in 30s) and `GET /api/proofloop/evidence/<id>/<flow>/failure.png`.

- [ ] **Step 1: Reader**

Create `frontend/lib/proofloop.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Mirror of proofloop/src/report.ts types (kept in sync by hand). */
export type FlowStatus = "passed" | "failed" | "error";
export type Verdict = "verified" | "failed" | "error" | "nothing-to-verify";
export type FlowResult = {
  flow: string;
  title: string;
  test: string;
  status: FlowStatus;
  exitCode: number;
  reason: string;
  summary: string;
  oneLiner: string;
  finalState: Record<string, unknown>;
  failedStep: { step: number; remark: string } | null;
  stepsTotal: number;
  durationS: number;
  credits: number;
  replayed: boolean;
  runDir: string | null;
  testUrl: string | null;
  evidence: { screenshot: string | null; actions: string | null };
};
export type VerifyReport = {
  id: string;
  startedAt: string;
  finishedAt: string;
  trigger: "hook" | "cli";
  attempt: number;
  changedFiles: string[];
  unmapped: string[];
  ignored: string[];
  flows: string[];
  results: FlowResult[];
  verdict: Verdict;
  preflight?: { ok: boolean; message: string };
};

/** `.proofloop/` lives at the repo root, one level above `frontend/` (override with PROOFLOOP_DIR). */
export function proofloopDir(): string {
  return process.env.PROOFLOOP_DIR ?? resolve(process.cwd(), "..", ".proofloop");
}

export function readLatestReport(): VerifyReport | null {
  const file = join(proofloopDir(), "latest.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as VerifyReport;
  } catch {
    return null;
  }
}

export function readHistory(limit = 20): VerifyReport[] {
  const file = join(proofloopDir(), "history.jsonl");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .slice(-limit)
    .map((l) => JSON.parse(l) as VerifyReport)
    .reverse();
}

/** Turn a report-relative evidence path (".proofloop/evidence/<id>/<flow>/failure.png") into a route URL. */
export function evidenceUrl(relPath: string | null): string | null {
  if (!relPath) return null;
  const prefix = ".proofloop/evidence/";
  if (!relPath.startsWith(prefix)) return null;
  return `/api/proofloop/evidence/${relPath.slice(prefix.length)}`;
}
```

- [ ] **Step 2: Evidence route**

Create `frontend/app/api/proofloop/evidence/[...path]/route.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join, normalize, resolve, sep } from "node:path";

import { proofloopDir } from "@/lib/proofloop";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const base = resolve(proofloopDir(), "evidence");
  const target = resolve(base, normalize(join(...path)));
  if (!target.startsWith(base + sep) || !existsSync(target)) {
    return new Response("Not found", { status: 404 });
  }
  const isPng = target.endsWith(".png");
  return new Response(readFileSync(target), {
    headers: {
      "Content-Type": isPng ? "image/png" : "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 3: The page**

Create `frontend/app/proofloop/page.tsx`:

```tsx
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

import { LiveDashboardRefresh } from "@/components/dashboard/live-dashboard-refresh";
import { Logo } from "@/components/ui/logo";
import { evidenceUrl, readHistory, readLatestReport, type FlowResult, type VerifyReport } from "@/lib/proofloop";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const card =
  "rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]";

function verdictStyle(v: VerifyReport["verdict"] | "none") {
  switch (v) {
    case "verified":
      return { label: "VERIFIED", classes: "bg-emerald-500 text-white", icon: CheckmarkCircle01Icon, sub: "Every impacted flow held in a real browser." };
    case "failed":
      return { label: "FAILED", classes: "bg-rose-500 text-white", icon: Alert02Icon, sub: "Kane found a flow that does not hold. The agent has been told." };
    case "error":
      return { label: "UNVERIFIED", classes: "bg-amber-500 text-white", icon: Alert02Icon, sub: "ProofLoop could not run Kane." };
    default:
      return { label: "NO RUNS YET", classes: "bg-zinc-900 text-white", icon: Clock01Icon, sub: "Run: node proofloop/src/cli.ts verify --all" };
  }
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ProofLoopPage() {
  const latest = readLatestReport();
  const history = readHistory(20);
  const repairs = history.filter((h) => h.trigger === "hook" && h.verdict === "failed").length;
  const v = verdictStyle(latest?.verdict ?? "none");

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-8 sm:px-8">
      <LiveDashboardRefresh intervalMs={4000} />
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-sm font-semibold tracking-tight text-gray-500">/ ProofLoop</span>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1">
            Open Lynx <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.2} />
          </Link>
        </header>

        {/* Ship banner */}
        <section className={cn(card, "p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6")}>
          <div className={cn("flex items-center gap-4 rounded-[1.5rem] px-6 py-5", v.classes)}>
            <HugeiconsIcon icon={v.icon} size={28} strokeWidth={2} />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Ship status</div>
              <div className="text-3xl font-semibold tracking-tight leading-none mt-1">{v.label}</div>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Every AI-written change must prove itself in a real browser.
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">{v.sub}</p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <Stat label="Flows" value={String(latest?.results.length ?? 0)} />
            <Stat label="Verified" value={String(latest?.results.filter((r) => r.status === "passed").length ?? 0)} />
            <Stat label="Repairs" value={String(repairs)} />
          </dl>
        </section>

        {latest && (
          <section className={cn(card, "p-6 sm:p-8")}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">Latest verification</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {fmtTime(latest.startedAt)} · trigger {latest.trigger} · attempt {latest.attempt}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/70 px-3 py-1 text-[11px] font-semibold">
                <HugeiconsIcon icon={RefreshIcon} size={11} strokeWidth={2.2} /> Live
              </span>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Stage title="Change" body={latest.changedFiles.length ? latest.changedFiles.join("\n") : "No mapped changes"} />
              <Stage title="Impact" body={latest.flows.length ? latest.flows.join(" · ") : "—"} hint={latest.unmapped.length ? `Unmapped: ${latest.unmapped.join(", ")}` : undefined} />
              <Stage title="Verify" body={`${latest.results.length} Kane run(s) in real Chrome`} hint={latest.preflight && !latest.preflight.ok ? latest.preflight.message : undefined} />
            </ol>

            <ul className="flex flex-col gap-3">
              {latest.results.map((r) => (
                <FlowRow key={r.flow} r={r} />
              ))}
            </ul>
          </section>
        )}

        <section className={cn(card, "p-6 sm:p-8")}>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-sm font-medium text-gray-500">No verifications recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((h) => (
                <li key={h.id} className="grid grid-cols-[120px_110px_1fr_auto] gap-4 py-3 items-center text-sm">
                  <span className="font-medium text-gray-500">{fmtTime(h.startedAt)}</span>
                  <VerdictPill verdict={h.verdict} />
                  <span className="font-medium text-gray-600 truncate">{h.flows.join(", ") || "—"}</span>
                  <span className="text-xs font-medium text-gray-400">{h.trigger} · #{h.attempt}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50/70 border border-gray-100 px-4 py-3">
      <dd className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">{value}</dd>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 mt-1">{label}</dt>
    </div>
  );
}

function Stage({ title, body, hint }: { title: string; body: string; hint?: string }) {
  return (
    <li className="rounded-2xl bg-gray-50/70 border border-gray-100 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{title}</div>
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm font-semibold tracking-tight text-zinc-900">{body}</pre>
      {hint && <p className="mt-1 text-xs font-medium text-amber-700">{hint}</p>}
    </li>
  );
}

function VerdictPill({ verdict }: { verdict: VerifyReport["verdict"] }) {
  const classes =
    verdict === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100/70"
    : verdict === "failed" ? "bg-rose-50 text-rose-700 border-rose-100/70"
    : "bg-amber-50 text-amber-700 border-amber-100/70";
  return (
    <span className={cn("inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", classes)}>
      {verdict}
    </span>
  );
}

function FlowRow({ r }: { r: FlowResult }) {
  const shot = evidenceUrl(r.evidence.screenshot);
  const ok = r.status === "passed";
  return (
    <li className={cn("rounded-2xl border p-4 sm:p-5", ok ? "bg-emerald-50/40 border-emerald-100/70" : "bg-rose-50/40 border-rose-100/70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("flex items-center justify-center w-8 h-8 rounded-xl text-white", ok ? "bg-emerald-500" : "bg-rose-500")}>
            <HugeiconsIcon icon={ok ? CheckmarkCircle01Icon : Alert02Icon} size={16} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">{r.title}</div>
            <div className="text-[11px] font-medium text-gray-500">{r.test} · {r.durationS}s · {r.replayed ? "replayed" : `${r.credits} credits`}</div>
          </div>
        </div>
        {r.testUrl && (
          <a href={r.testUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-zinc-900 inline-flex items-center gap-1">
            Kane run <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.2} />
          </a>
        )}
      </div>
      {!ok && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="text-sm">
            <p className="font-semibold text-rose-700">Kane: {r.reason || r.summary}</p>
            {r.failedStep && <p className="mt-1 font-medium text-gray-600">Step {r.failedStep.step}: {r.failedStep.remark}</p>}
            {Object.keys(r.finalState).length > 0 && (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {Object.entries(r.finalState).map(([k, val]) => (
                  <div key={k} className="contents">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{k}</dt>
                    <dd className="font-semibold tabular-nums text-zinc-900">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt={`Browser at the failing step of ${r.flow}`} className="w-full rounded-xl border border-gray-200" />
          )}
        </div>
      )}
    </li>
  );
}
```

Check `Alert02Icon` exists (`grep -rl "Alert02Icon" frontend/node_modules/@hugeicons/core-free-icons | head -1`); if not, use `Cancel01Icon` (already used in `status-pill.tsx`). Check `Logo` accepts no props (`frontend/components/ui/logo.tsx`); if it requires props, render `<span className="text-lg font-semibold tracking-tight">Lynx</span>` instead.

- [ ] **Step 4: Verify and commit**

Run (from `frontend/`): `npx tsc --noEmit && npm run lint`. Browser: `http://localhost:3000/proofloop` shows the latest `verify --all` report (VERIFIED, 4 flows) and updates within 4s after another `verify` run. Evidence route returns 404 for `/api/proofloop/evidence/../../package.json`.

```bash
cd "$ROOT" && git add -A frontend && git commit -m "feat(proofloop): live status page and evidence route

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 17: README, demo script, submission paragraph, push

**Files:**
- Create: `README.md` (root), `docs/demo-script.md`, `docs/submission.md`
- Modify: `CLAUDE.md` (add ProofLoop section)

- [ ] **Step 1: Root README**

Write `README.md` covering, in this order: one-paragraph pitch; a 60-second "Run it" block (clone → `cd frontend && cp .env.example .env.local` → paste `MONGODB_URI` → `npm install && npm run dev` → `http://localhost:3000/demo` → "Reset & launch demo"); "Run ProofLoop" (`npm i -g @testmuai/kane-cli && kane-cli login`, `node proofloop/src/cli.ts verify --all`, `http://localhost:3000/proofloop`); "How the loop closes" (the ASCII diagram from the spec §2 plus the Stop-hook policy table); "The Kane contract" (the four tests and what each proves); "Repo layout"; "Credits/replay" note; link to the demo video (fill in after recording).

- [ ] **Step 2: CLAUDE.md section**

Append to root `CLAUDE.md`:

```markdown
## ProofLoop (hackathon verification layer)

`proofloop/` is a zero-dependency CLI wired into Claude Code's Stop hook (`.claude/settings.json`). When you end a turn with uncommitted changes under `frontend/`, it maps them to business flows (`proofloop/proofloop.map.json`), runs the matching `kane/*_test.md` in real Chrome via Kane CLI, and **blocks the stop with Kane's failure report** until the flow passes (max 3 attempts). Requirements: `npm run dev` running in `frontend/`, `kane-cli login` done. Set `PROOFLOOP_DISABLED=1` to skip. Never edit `kane/*_test.md` to make a failing app pass. Run `node proofloop/src/cli.ts verify --all` to replay every flow; `npm test` in `proofloop/` runs the unit tests.
```

- [ ] **Step 3: Demo script + submission paragraph**

`docs/demo-script.md`: the table from spec §8 expanded into a shot list with the exact prompt: *"Add a 10% platform fee to every booking and show it in the profitability breakdown. Acceptance: for a $1,000 booking with a $120 clean, the Profitability card reads Revenue $1,000.00 / Costs $220.00 / Net $780.00, and the card shows the platform fee line."* Before recording, update the last step of `kane/profit-invariant_test.md` to assert `costs equals "$220.00" and net equals "$780.00"` and add `Assert the card shows a line for the platform fee equal to "$100.00".` — commit that as the acceptance-criteria change, then run the prompt in a fresh Claude Code session with the hook active. Record whatever happens; do not plant a bug.

`docs/submission.md`: the one-paragraph answer for the form — what (Lynx ProofLoop), who for (operators of 5–30 short-term rentals; developers shipping with coding agents), agent (Claude Code), what Kane does (runs four committed business-invariant flows in real Chrome on every attempted stop, and its `run_end` is fed back to Claude as a block reason until the flows pass), plus the run command and the `/proofloop` URL.

- [ ] **Step 4: Push**

Requires the user to have created the new empty GitHub repo (see conversation). Then:

```bash
cd "$ROOT" && git remote add origin https://github.com/damishafe/<repo-name>.git && git push -u origin main
```

(Credentials come from `.git/rivet-credentials` via the configured `credential.helper`; nothing is typed.)

- [ ] **Step 5: Commit docs**

```bash
cd "$ROOT" && git add README.md CLAUDE.md docs && git commit -m "docs: README, demo script, submission paragraph

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" && git push
```

---

## Stretch (only after Task 17 is pushed and the demo is recorded)

- **Sealed evidence pack:** `kane-cli testrun run kane/*_test.md --headless --retry --on-failure continue --name proofloop-<id>` produces one sealed execution; `kane-cli evidence serve <path>` opens the viewer. Add a `proofloop seal` command that runs it after a verified report and links it from `/proofloop`.
- **Orchestrator mode:** `proofloop run "<prompt>"` driving `claude -p` headless with the same block/allow loop.

## Self-review notes (done while writing)

- Spec coverage: §3.1–3.4 → Tasks 2–9; §4 → Task 15; §5.1 → Tasks 11–13; §5.2 → Task 14; §5.3 → Task 14 (`report` command); §5.4 → Tasks 10–14 tests; §6 → Task 16; §7–8 → Task 17; §9 timeline holds if Tasks 2–9 finish by ~20:30 BST.
- Deviations from the spec, all deliberate: block is signalled by **exit 2 + stderr** (override-proof per the hooks reference) rather than JSON `decision`; attempts are keyed on `session_id` (no reliance on `stop_hook_active`); the reset step is inlined in each Kane test instead of `@import`; the map gained `fallback` and `ignore` keys; a `nothing-to-verify` report is not persisted so a no-op turn never overwrites the last real verdict.
- Names used consistently across tasks: `getLedger`, `computeLedger`, `totalBookingRevenueCents`, `totalCompletedWorkOrderCostCents`, `hasOpenCleaningWorkOrder`, `checkoutBookingAction`, `resetAndLaunchDemo`, `runVerify`, `runHook`, `decide`, `buildBlockReason`, `buildAllowMessage`, `readLatest`, `collectEvidence`, `VerifyReport`, `FlowResult`.

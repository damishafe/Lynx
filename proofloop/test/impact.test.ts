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

test("roots: a map with roots considers files under any listed root and ignores the rest", () => {
  const rootedMap: FlowMap = { ...map, roots: ["src/"] };
  const i = computeImpact(["src/a.ts", "frontend/x.ts"], rootedMap);
  assert.deepEqual(i.considered, ["src/a.ts"]);
  assert.deepEqual(i.ignored, ["frontend/x.ts"]);
});

test("roots: a map without roots defaults to frontend/ only (unchanged behaviour)", () => {
  const i = computeImpact(["frontend/lib/bookings.ts", "src/a.ts"], map);
  assert.deepEqual(i.considered, ["frontend/lib/bookings.ts"]);
  assert.deepEqual(i.ignored, ["src/a.ts"]);
});

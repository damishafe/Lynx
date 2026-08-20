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

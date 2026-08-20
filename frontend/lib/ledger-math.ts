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

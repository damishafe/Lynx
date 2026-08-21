/**
 * Pure ledger arithmetic. No I/O, no imports — unit-tested with node:test and
 * safe to import from Server Components and client components alike.
 *
 * Revenue = gross booking value. Costs = accrued vendor cost from completed work
 * orders plus Lynx's platform fee. Net = Revenue − Costs.
 */
export type Ledger = {
  revenueCents: number;
  costsCents: number;
  platformFeeCents: number;
  netCents: number;
};

export type LedgerInputs = {
  revenueCents: number;
  workOrderCostCents: number;
};

/** Lynx charges a 10% platform fee on gross booking revenue. */
export const PLATFORM_FEE_RATE = 0.1;

export function computeLedger(inputs: LedgerInputs): Ledger {
  const revenueCents = Math.round(inputs.revenueCents);
  const workOrderCostCents = Math.abs(Math.round(inputs.workOrderCostCents));
  const platformFeeCents = Math.round(revenueCents * PLATFORM_FEE_RATE);
  const costsCents = workOrderCostCents + platformFeeCents;
  return {
    revenueCents,
    costsCents,
    platformFeeCents,
    netCents: revenueCents - costsCents,
  };
}

// Ledger figures are read by Kane in real Chrome before any change here can ship (see proofloop/).

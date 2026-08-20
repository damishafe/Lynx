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

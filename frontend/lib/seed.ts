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

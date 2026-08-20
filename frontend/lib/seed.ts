import { ObjectId } from "mongodb";

import { recordActivity } from "./activity";
import { createPayout } from "./payouts";
import { createUnit, listUnits } from "./units";
import { createVendor, listVendors } from "./vendors";
import { createWorkOrder } from "./work-orders";

/**
 * Seed a brand-new operator's account with starter data so the dashboard
 * isn't empty. All seeded docs carry `isDemo: true` so we can purge them
 * once the operator adds their own.
 *
 * Idempotent in spirit: callers should only invoke this once per user
 * (e.g., after first email verification).
 */
export async function seedDemoData(ownerId: ObjectId): Promise<void> {
  const [existingUnits, existingVendors] = await Promise.all([
    listUnits(ownerId, { limit: 1 }),
    listVendors(ownerId, { limit: 1 }),
  ]);
  if (existingUnits.length > 0 || existingVendors.length > 0) return;

  const seeds = [
    {
      name: "Studio · Riverside",
      type: "Short-term rental",
      status: "ready" as const,
      address: "112 Riverside Dr, Brooklyn, NY",
      monthlyRevenueCents: 285000,
      notes:
        "Demo unit — replace with one of your real properties when you're ready.",
    },
    {
      name: "Loft · Mission",
      type: "Short-term rental",
      status: "occupied" as const,
      address: "846 Valencia St, San Francisco, CA",
      monthlyRevenueCents: 412000,
    },
    {
      name: "Suite · Capitol Hill",
      type: "Short-term rental",
      status: "maintenance" as const,
      address: "1402 E Pike St, Seattle, WA",
      monthlyRevenueCents: 360000,
      notes: "HVAC repair scheduled — back online next week.",
    },
  ];

  const units = [];
  for (const seed of seeds) {
    const unit = await createUnit(ownerId, { ...seed, isDemo: true });
    units.push(unit);
    await recordActivity(ownerId, {
      type: "unit.created",
      summary: `${unit.name} added to your portfolio`,
      entityType: "unit",
      entityRef: unit._id.toString(),
      meta: { isDemo: true },
    });
  }

  const vendors = [];
  for (const vendor of [
    {
      name: "BrightTurn Cleaning",
      role: "cleaning" as const,
      email: "ops@brightturn.example",
    },
    {
      name: "Northline Maintenance",
      role: "maintenance" as const,
      email: "dispatch@northline.example",
    },
    {
      name: "Hostfully",
      role: "software" as const,
      email: "billing@hostfully.example",
    },
  ]) {
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

  const now = Date.now();
  const payouts = [
    {
      vendor: vendors[0],
      unit: units[0],
      category: "Cleaning",
      amountCents: -8500,
      status: "completed" as const,
      occurredAt: new Date(now - 1000 * 60 * 45),
    },
    {
      vendor: vendors[1],
      unit: units[2],
      category: "Maintenance",
      amountCents: -24000,
      status: "pending" as const,
      occurredAt: new Date(now - 1000 * 60 * 60 * 7),
    },
    {
      vendor: vendors[2],
      unit: undefined,
      category: "Software",
      amountCents: -42000,
      status: "completed" as const,
      occurredAt: new Date(now - 1000 * 60 * 60 * 28),
    },
  ];

  for (const payout of payouts) {
    const doc = await createPayout(ownerId, {
      vendorId: payout.vendor._id,
      unitId: payout.unit?._id,
      vendorName: payout.vendor.name,
      category: payout.category,
      amountCents: payout.amountCents,
      status: payout.status,
      occurredAt: payout.occurredAt,
      isDemo: true,
    });
    await recordActivity(ownerId, {
      type:
        doc.status === "completed"
          ? "payout.completed"
          : doc.status === "failed"
            ? "payout.failed"
            : "payout.created",
      summary: `${doc.vendorName} ${doc.status} payout logged`,
      entityType: "payout",
      entityRef: doc._id.toString(),
      meta: {
        vendorId: doc.vendorId?.toString(),
        unitId: doc.unitId?.toString(),
        amountCents: doc.amountCents,
        isDemo: true,
      },
    });
  }

  for (const job of [
    {
      unit: units[1],
      vendor: vendors[0],
      type: "cleaning" as const,
      title: "Turnover clean after checkout",
      costCents: 8500,
      dueAt: new Date(now + 1000 * 60 * 60 * 18),
    },
    {
      unit: units[2],
      vendor: vendors[1],
      type: "maintenance" as const,
      title: "HVAC follow-up inspection",
      costCents: 12500,
      dueAt: new Date(now + 1000 * 60 * 60 * 30),
    },
  ]) {
    const doc = await createWorkOrder(ownerId, {
      unitId: job.unit._id,
      vendorId: job.vendor._id,
      unitName: job.unit.name,
      vendorName: job.vendor.name,
      type: job.type,
      title: job.title,
      costCents: job.costCents,
      dueAt: job.dueAt,
      isDemo: true,
    });
    await recordActivity(ownerId, {
      type: "work_order.created",
      summary: `${doc.title} assigned to ${doc.vendorName}`,
      entityType: "work_order",
      entityRef: doc._id.toString(),
      meta: {
        unitId: doc.unitId.toString(),
        vendorId: doc.vendorId.toString(),
        costCents: doc.costCents,
        isDemo: true,
      },
    });
  }
}

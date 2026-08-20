import { ObjectId, type Collection, type Filter } from "mongodb";

import { getDb } from "./mongodb";

export type PayoutStatus = "completed" | "failed" | "pending";

export type PayoutDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  vendorId?: ObjectId;
  unitId?: ObjectId;
  vendorName: string;
  category: string;
  amountCents: number;
  status: PayoutStatus;
  occurredAt: Date;
  notes?: string;
  isDemo?: boolean;
  createdAt: Date;
  deletedAt?: Date;
};

const COLLECTION = "payouts";
let indexEnsured = false;

async function getCollection(): Promise<Collection<PayoutDoc>> {
  const db = await getDb();
  const c = db.collection<PayoutDoc>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, deletedAt: 1, occurredAt: -1 }),
      c.createIndex({ ownerId: 1, vendorId: 1, deletedAt: 1, occurredAt: -1 }),
      c.createIndex({ ownerId: 1, unitId: 1, deletedAt: 1, occurredAt: -1 }),
      c.createIndex({ ownerId: 1, status: 1, deletedAt: 1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

// ---------- Reads ----------

export type ListPayoutsOpts = {
  vendorId?: ObjectId;
  unitId?: ObjectId;
  status?: PayoutStatus;
  limit?: number;
};

export async function listPayouts(
  ownerId: ObjectId,
  opts: ListPayoutsOpts = {},
): Promise<PayoutDoc[]> {
  const c = await getCollection();
  const filter: Filter<PayoutDoc> = {
    ownerId,
    deletedAt: { $exists: false },
  };
  if (opts.vendorId) filter.vendorId = opts.vendorId;
  if (opts.unitId) filter.unitId = opts.unitId;
  if (opts.status) filter.status = opts.status;
  return c
    .find(filter)
    .sort({ occurredAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
}

export async function listPayoutsForUnit(
  ownerId: ObjectId,
  unitId: ObjectId,
  limit = 25,
): Promise<PayoutDoc[]> {
  return listPayouts(ownerId, { unitId, limit });
}

export async function listPayoutsForVendor(
  ownerId: ObjectId,
  vendorId: ObjectId,
  limit = 25,
): Promise<PayoutDoc[]> {
  return listPayouts(ownerId, { vendorId, limit });
}

export async function totalOwedToVendorsCents(ownerId: ObjectId): Promise<number> {
  const c = await getCollection();
  const cursor = c.aggregate<{ total: number }>([
    {
      $match: {
        ownerId,
        deletedAt: { $exists: false },
        status: "pending",
      },
    },
    { $group: { _id: null, total: { $sum: { $abs: "$amountCents" } } } },
  ]);
  const arr = await cursor.toArray();
  return arr[0]?.total ?? 0;
}

/**
 * Total completed vendor spend (positive cents). Optionally restricted to
 * payouts whose `occurredAt` falls inside a window — typically "the last
 * month" for net-profit calculations.
 */
export async function totalCompletedSpendCents(
  ownerId: ObjectId,
  opts: { since?: Date; unitId?: ObjectId } = {},
): Promise<number> {
  const c = await getCollection();
  const match: Filter<PayoutDoc> = {
    ownerId,
    deletedAt: { $exists: false },
    status: "completed",
  };
  if (opts.since) match.occurredAt = { $gte: opts.since };
  if (opts.unitId) match.unitId = opts.unitId;
  const cursor = c.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: { $abs: "$amountCents" } } } },
  ]);
  const arr = await cursor.toArray();
  return arr[0]?.total ?? 0;
}

/**
 * Per-unit completed spend, optionally bounded to a date window. Returns a
 * map keyed by stringified unitId so callers can merge with unit lookups
 * without paying a second round-trip.
 */
export async function costsByUnit(
  ownerId: ObjectId,
  opts: { since?: Date } = {},
): Promise<Map<string, number>> {
  const c = await getCollection();
  const match: Filter<PayoutDoc> = {
    ownerId,
    deletedAt: { $exists: false },
    status: "completed",
    unitId: { $exists: true },
  };
  if (opts.since) match.occurredAt = { $gte: opts.since };
  const cursor = c.aggregate<{ _id: ObjectId; total: number }>([
    { $match: match },
    { $group: { _id: "$unitId", total: { $sum: { $abs: "$amountCents" } } } },
  ]);
  const map = new Map<string, number>();
  for await (const row of cursor) {
    if (row._id) map.set(row._id.toString(), row.total);
  }
  return map;
}

/**
 * Convenience: rolling-30-days date for the "this period" math used on
 * dashboards. Centralized so every surface uses the same window.
 */
export function defaultProfitWindowStart(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

// ---------- Writes ----------

export type CreatePayoutInput = {
  vendorId?: ObjectId;
  unitId?: ObjectId;
  vendorName: string;
  category: string;
  amountCents: number;
  status?: PayoutStatus;
  occurredAt?: Date;
  notes?: string;
  isDemo?: boolean;
};

export async function createPayout(
  ownerId: ObjectId,
  input: CreatePayoutInput,
): Promise<PayoutDoc> {
  const now = new Date();
  const doc: Omit<PayoutDoc, "_id"> = {
    ownerId,
    vendorId: input.vendorId,
    unitId: input.unitId,
    vendorName: input.vendorName.trim(),
    category: input.category.trim(),
    amountCents: input.amountCents,
    status: input.status ?? "pending",
    occurredAt: input.occurredAt ?? now,
    notes: input.notes?.trim() || undefined,
    isDemo: input.isDemo,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as PayoutDoc);
  return { ...doc, _id: result.insertedId } as PayoutDoc;
}

export async function setPayoutStatus(
  ownerId: ObjectId,
  payoutId: ObjectId,
  status: PayoutStatus,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: payoutId, ownerId, deletedAt: { $exists: false } },
    { $set: { status } },
  );
  return result.matchedCount === 1;
}

// ---------- Formatting helpers ----------

export function formatAmount(cents: number): string {
  const sign = cents < 0 ? "-" : cents > 0 ? "+" : "";
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
}

export function formatUnsignedAmount(cents: number): string {
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

export function formatDate(d: Date): string {
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(" ", "");
  return `${date} at ${time}`;
}

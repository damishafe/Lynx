import { ObjectId, type Collection, type Filter } from "mongodb";

import { getDb } from "./mongodb";
import { UNIT_STATUSES, type UnitStatus } from "./unit-status";

export { UNIT_STATUSES, type UnitStatus };

export type UnitDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  /** Free-form type label (e.g., "Studio", "1BR Loft", "Coffee Shop"). */
  type: string;
  status: UnitStatus;
  address?: string;
  /** Monthly recurring revenue in cents. */
  monthlyRevenueCents?: number;
  notes?: string;
  /** Future: Vercel Blob URL for the cover image. */
  coverUrl?: string;
  /** Marks units inserted by the signup seed; lets us purge later. */
  isDemo?: boolean;
  lastStatusChangeAt: Date;
  createdAt: Date;
  /** Soft delete — non-null means hidden from queries. */
  deletedAt?: Date;
};

const COLLECTION = "units";
let indexEnsured = false;

async function getCollection(): Promise<Collection<UnitDoc>> {
  const db = await getDb();
  const c = db.collection<UnitDoc>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, status: 1, deletedAt: 1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

// ---------- Reads ----------

export type ListUnitsOpts = {
  status?: UnitStatus;
  q?: string;
  limit?: number;
};

export async function listUnits(
  ownerId: ObjectId,
  opts: ListUnitsOpts = {},
): Promise<UnitDoc[]> {
  const c = await getCollection();
  const filter: Filter<UnitDoc> = {
    ownerId,
    deletedAt: { $exists: false },
  };
  if (opts.status) filter.status = opts.status;
  if (opts.q && opts.q.trim()) {
    const q = opts.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { type: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
    ];
  }
  return c
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
}

export async function getUnitById(
  ownerId: ObjectId,
  unitId: ObjectId,
): Promise<UnitDoc | null> {
  const c = await getCollection();
  return c.findOne({
    _id: unitId,
    ownerId,
    deletedAt: { $exists: false },
  });
}

export type StatusCounts = {
  total: number;
  ready: number;
  occupied: number;
  maintenance: number;
};

export async function countUnitsByStatus(
  ownerId: ObjectId,
): Promise<StatusCounts> {
  const c = await getCollection();
  const cursor = c.aggregate<{ _id: UnitStatus; n: number }>([
    { $match: { ownerId, deletedAt: { $exists: false } } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const result: StatusCounts = {
    total: 0,
    ready: 0,
    occupied: 0,
    maintenance: 0,
  };
  for await (const row of cursor) {
    if (row._id in result) {
      result[row._id] = row.n;
      result.total += row.n;
    }
  }
  return result;
}

/**
 * Sum of monthly revenue across active units in `ready` or `occupied`.
 * Maintenance units count as 0 (no revenue while down).
 */
export async function totalMonthlyRevenueCents(
  ownerId: ObjectId,
): Promise<number> {
  const c = await getCollection();
  const cursor = c.aggregate<{ total: number }>([
    {
      $match: {
        ownerId,
        deletedAt: { $exists: false },
        status: { $in: ["ready", "occupied"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$monthlyRevenueCents" } } },
  ]);
  const arr = await cursor.toArray();
  return arr[0]?.total ?? 0;
}

// ---------- Writes ----------

export type CreateUnitInput = {
  name: string;
  type: string;
  status?: UnitStatus;
  address?: string;
  monthlyRevenueCents?: number;
  notes?: string;
  coverUrl?: string;
  isDemo?: boolean;
};

export async function createUnit(
  ownerId: ObjectId,
  input: CreateUnitInput,
): Promise<UnitDoc> {
  const now = new Date();
  const doc: Omit<UnitDoc, "_id"> = {
    ownerId,
    name: input.name.trim(),
    type: input.type.trim(),
    status: input.status ?? "ready",
    address: input.address?.trim() || undefined,
    monthlyRevenueCents: input.monthlyRevenueCents,
    notes: input.notes?.trim() || undefined,
    coverUrl: input.coverUrl,
    isDemo: input.isDemo,
    lastStatusChangeAt: now,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as UnitDoc);
  return { ...doc, _id: result.insertedId } as UnitDoc;
}

export type UpdateUnitInput = Partial<
  Pick<
    UnitDoc,
    "name" | "type" | "address" | "monthlyRevenueCents" | "notes" | "coverUrl"
  >
>;

export async function updateUnit(
  ownerId: ObjectId,
  unitId: ObjectId,
  input: UpdateUnitInput,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: unitId, ownerId, deletedAt: { $exists: false } },
    { $set: input },
  );
  return result.matchedCount === 1;
}

export async function setUnitStatus(
  ownerId: ObjectId,
  unitId: ObjectId,
  status: UnitStatus,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: unitId, ownerId, deletedAt: { $exists: false } },
    { $set: { status, lastStatusChangeAt: new Date() } },
  );
  return result.matchedCount === 1;
}

export async function softDeleteUnit(
  ownerId: ObjectId,
  unitId: ObjectId,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: unitId, ownerId, deletedAt: { $exists: false } },
    { $set: { deletedAt: new Date() } },
  );
  return result.matchedCount === 1;
}

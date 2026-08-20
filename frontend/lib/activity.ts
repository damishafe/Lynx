import { ObjectId, type Collection } from "mongodb";

import { getDb } from "./mongodb";

export type ActivityType =
  | "unit.created"
  | "unit.updated"
  | "unit.deleted"
  | "unit.status_changed"
  | "work_order.created"
  | "work_order.completed"
  | "work_order.cancelled"
  | "vendor.created"
  | "vendor.deleted"
  | "payout.created"
  | "payout.completed"
  | "payout.failed";

export type ActivityEntityType = "unit" | "vendor" | "payout" | "work_order";

export type ActivityEvent = {
  _id: ObjectId;
  ownerId: ObjectId;
  type: ActivityType;
  /** Human-readable summary, e.g. "Studio Apt set to Occupied". */
  summary: string;
  entityType?: ActivityEntityType;
  /** ObjectId string of the related entity, e.g. the unit id. */
  entityRef?: string;
  /** Free-form payload for richer rendering later. */
  meta?: Record<string, unknown>;
  occurredAt: Date;
};

const COLLECTION = "activity_events";
let indexEnsured = false;

async function getCollection(): Promise<Collection<ActivityEvent>> {
  const db = await getDb();
  const c = db.collection<ActivityEvent>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, occurredAt: -1 }),
      c.createIndex({ ownerId: 1, entityType: 1, entityRef: 1, occurredAt: -1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

export async function recordActivity(
  ownerId: ObjectId,
  input: Omit<ActivityEvent, "_id" | "ownerId" | "occurredAt"> & {
    occurredAt?: Date;
  },
): Promise<void> {
  const c = await getCollection();
  await c.insertOne({
    ownerId,
    occurredAt: input.occurredAt ?? new Date(),
    ...input,
  } as ActivityEvent);
}

export async function listRecentActivity(
  ownerId: ObjectId,
  limit = 25,
): Promise<ActivityEvent[]> {
  const c = await getCollection();
  return c
    .find({ ownerId })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .toArray();
}

export async function listActivityForEntity(
  ownerId: ObjectId,
  entityType: ActivityEntityType,
  entityRef: string,
  limit = 25,
): Promise<ActivityEvent[]> {
  const c = await getCollection();
  return c
    .find({ ownerId, entityType, entityRef })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .toArray();
}

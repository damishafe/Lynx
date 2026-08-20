import { ObjectId, type Collection, type Filter } from "mongodb";

import { getDb } from "./mongodb";

export type WorkOrderType =
  | "cleaning"
  | "maintenance"
  | "inspection"
  | "repair"
  | "other";

export type WorkOrderStatus = "assigned" | "completed" | "cancelled";

export type WorkOrderDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  unitId: ObjectId;
  vendorId: ObjectId;
  unitName: string;
  vendorName: string;
  type: WorkOrderType;
  title: string;
  costCents: number;
  status: WorkOrderStatus;
  dueAt?: Date;
  completedAt?: Date;
  notes?: string;
  isDemo?: boolean;
  createdAt: Date;
  deletedAt?: Date;
};

const COLLECTION = "work_orders";
let indexEnsured = false;

async function getCollection(): Promise<Collection<WorkOrderDoc>> {
  const db = await getDb();
  const c = db.collection<WorkOrderDoc>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, status: 1, deletedAt: 1, dueAt: 1 }),
      c.createIndex({ ownerId: 1, unitId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, vendorId: 1, deletedAt: 1, dueAt: 1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

// ---------- Reads ----------

export type ListWorkOrdersOpts = {
  unitId?: ObjectId;
  vendorId?: ObjectId;
  status?: WorkOrderStatus;
  limit?: number;
};

export async function listWorkOrders(
  ownerId: ObjectId,
  opts: ListWorkOrdersOpts = {},
): Promise<WorkOrderDoc[]> {
  const c = await getCollection();
  const filter: Filter<WorkOrderDoc> = {
    ownerId,
    deletedAt: { $exists: false },
  };
  if (opts.unitId) filter.unitId = opts.unitId;
  if (opts.vendorId) filter.vendorId = opts.vendorId;
  if (opts.status) filter.status = opts.status;
  return c
    .find(filter)
    .sort({ status: 1, dueAt: 1, createdAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
}

export async function listPublicVendorWorkOrders(
  vendorId: ObjectId,
  limit = 50,
): Promise<WorkOrderDoc[]> {
  const c = await getCollection();
  return c
    .find({
      vendorId,
      status: "assigned",
      deletedAt: { $exists: false },
    })
    .sort({ dueAt: 1, createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getWorkOrderById(
  ownerId: ObjectId,
  workOrderId: ObjectId,
): Promise<WorkOrderDoc | null> {
  const c = await getCollection();
  return c.findOne({
    _id: workOrderId,
    ownerId,
    deletedAt: { $exists: false },
  });
}

export async function getPublicWorkOrderById(
  workOrderId: ObjectId,
): Promise<WorkOrderDoc | null> {
  const c = await getCollection();
  return c.findOne({
    _id: workOrderId,
    deletedAt: { $exists: false },
  });
}

// ---------- Writes ----------

export type CreateWorkOrderInput = {
  unitId: ObjectId;
  vendorId: ObjectId;
  unitName: string;
  vendorName: string;
  type: WorkOrderType;
  title: string;
  costCents: number;
  dueAt?: Date;
  notes?: string;
  isDemo?: boolean;
};

export async function createWorkOrder(
  ownerId: ObjectId,
  input: CreateWorkOrderInput,
): Promise<WorkOrderDoc> {
  const now = new Date();
  const doc: Omit<WorkOrderDoc, "_id"> = {
    ownerId,
    unitId: input.unitId,
    vendorId: input.vendorId,
    unitName: input.unitName,
    vendorName: input.vendorName,
    type: input.type,
    title: input.title.trim(),
    costCents: input.costCents,
    status: "assigned",
    dueAt: input.dueAt,
    notes: input.notes?.trim() || undefined,
    isDemo: input.isDemo,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as WorkOrderDoc);
  return { ...doc, _id: result.insertedId } as WorkOrderDoc;
}

export async function completeWorkOrder(
  ownerId: ObjectId,
  workOrderId: ObjectId,
): Promise<WorkOrderDoc | null> {
  const c = await getCollection();
  const now = new Date();
  const result = await c.findOneAndUpdate(
    {
      _id: workOrderId,
      ownerId,
      status: "assigned",
      deletedAt: { $exists: false },
    },
    { $set: { status: "completed", completedAt: now } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function completePublicWorkOrder(
  workOrderId: ObjectId,
): Promise<WorkOrderDoc | null> {
  const c = await getCollection();
  const now = new Date();
  const result = await c.findOneAndUpdate(
    {
      _id: workOrderId,
      status: "assigned",
      deletedAt: { $exists: false },
    },
    { $set: { status: "completed", completedAt: now } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function countAssignedWorkOrders(ownerId: ObjectId): Promise<number> {
  const c = await getCollection();
  return c.countDocuments({
    ownerId,
    status: "assigned",
    deletedAt: { $exists: false },
  });
}

export async function getLatestCompletedWorkOrder(
  ownerId: ObjectId,
): Promise<WorkOrderDoc | null> {
  const c = await getCollection();
  return c.findOne(
    {
      ownerId,
      status: "completed",
      deletedAt: { $exists: false },
    },
    { sort: { completedAt: -1, createdAt: -1 } },
  );
}

// ---------- Formatting helpers ----------

export function formatWorkOrderType(type: WorkOrderType): string {
  const labels: Record<WorkOrderType, string> = {
    cleaning: "Cleaning",
    maintenance: "Maintenance",
    inspection: "Inspection",
    repair: "Repair",
    other: "Other",
  };
  return labels[type];
}

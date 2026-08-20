import { ObjectId, type Collection, type Filter } from "mongodb";

import { getDb } from "./mongodb";

export type VendorRole = "cleaning" | "maintenance" | "supplies" | "software" | "other";

export type VendorDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  role: VendorRole;
  email?: string;
  phone?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: Date;
  deletedAt?: Date;
};

const COLLECTION = "vendors";
let indexEnsured = false;

async function getCollection(): Promise<Collection<VendorDoc>> {
  const db = await getDb();
  const c = db.collection<VendorDoc>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, role: 1, deletedAt: 1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

// ---------- Reads ----------

export type ListVendorsOpts = {
  role?: VendorRole;
  q?: string;
  limit?: number;
};

export async function listVendors(
  ownerId: ObjectId,
  opts: ListVendorsOpts = {},
): Promise<VendorDoc[]> {
  const c = await getCollection();
  const filter: Filter<VendorDoc> = {
    ownerId,
    deletedAt: { $exists: false },
  };
  if (opts.role) filter.role = opts.role;
  if (opts.q && opts.q.trim()) {
    const q = opts.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }
  return c
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
}

export async function getVendorById(
  ownerId: ObjectId,
  vendorId: ObjectId,
): Promise<VendorDoc | null> {
  const c = await getCollection();
  return c.findOne({
    _id: vendorId,
    ownerId,
    deletedAt: { $exists: false },
  });
}

export async function getPublicVendorById(
  vendorId: ObjectId,
): Promise<VendorDoc | null> {
  const c = await getCollection();
  return c.findOne({
    _id: vendorId,
    deletedAt: { $exists: false },
  });
}

// ---------- Writes ----------

export type CreateVendorInput = {
  name: string;
  role?: VendorRole;
  email?: string;
  phone?: string;
  notes?: string;
  isDemo?: boolean;
};

export async function createVendor(
  ownerId: ObjectId,
  input: CreateVendorInput,
): Promise<VendorDoc> {
  const now = new Date();
  const doc: Omit<VendorDoc, "_id"> = {
    ownerId,
    name: input.name.trim(),
    role: input.role ?? "other",
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    isDemo: input.isDemo,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as VendorDoc);
  return { ...doc, _id: result.insertedId } as VendorDoc;
}

export type UpdateVendorInput = Partial<
  Pick<VendorDoc, "name" | "role" | "email" | "phone" | "notes">
>;

export async function updateVendor(
  ownerId: ObjectId,
  vendorId: ObjectId,
  input: UpdateVendorInput,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: vendorId, ownerId, deletedAt: { $exists: false } },
    { $set: input },
  );
  return result.matchedCount === 1;
}

export async function softDeleteVendor(
  ownerId: ObjectId,
  vendorId: ObjectId,
): Promise<boolean> {
  const c = await getCollection();
  const result = await c.updateOne(
    { _id: vendorId, ownerId, deletedAt: { $exists: false } },
    { $set: { deletedAt: new Date() } },
  );
  return result.matchedCount === 1;
}

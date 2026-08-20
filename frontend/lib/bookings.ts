import { ObjectId, type Collection, type Filter } from "mongodb";

import { getDb } from "./mongodb";

export type BookingStatus = "upcoming" | "checked_in" | "checked_out";

export type BookingDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  unitId: ObjectId;
  /** Denormalised for list rendering without a join. */
  unitName: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  /** Gross booking value in cents (what the guest pays). */
  grossAmountCents: number;
  status: BookingStatus;
  /** Cleaning job created by checkout (R3). */
  cleaningWorkOrderId?: ObjectId;
  isDemo?: boolean;
  createdAt: Date;
  checkedOutAt?: Date;
  deletedAt?: Date;
};

const COLLECTION = "bookings";
let indexEnsured = false;

async function getCollection(): Promise<Collection<BookingDoc>> {
  const db = await getDb();
  const c = db.collection<BookingDoc>(COLLECTION);
  if (!indexEnsured) {
    await Promise.all([
      c.createIndex({ ownerId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, unitId: 1, deletedAt: 1, createdAt: -1 }),
      c.createIndex({ ownerId: 1, status: 1, deletedAt: 1 }),
    ]);
    indexEnsured = true;
  }
  return c;
}

// ---------- Reads ----------

export type ListBookingsOpts = {
  unitId?: ObjectId;
  status?: BookingStatus;
  limit?: number;
};

export async function listBookings(
  ownerId: ObjectId,
  opts: ListBookingsOpts = {},
): Promise<BookingDoc[]> {
  const c = await getCollection();
  const filter: Filter<BookingDoc> = { ownerId, deletedAt: { $exists: false } };
  if (opts.unitId) filter.unitId = opts.unitId;
  if (opts.status) filter.status = opts.status;
  return c
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
}

export async function getBookingById(
  ownerId: ObjectId,
  bookingId: ObjectId,
): Promise<BookingDoc | null> {
  const c = await getCollection();
  return c.findOne({ _id: bookingId, ownerId, deletedAt: { $exists: false } });
}

/**
 * Gross revenue = sum of booking values created in the window (R2). Bookings are
 * recognised when created, which keeps the demo ledger simple and deterministic.
 */
export async function totalBookingRevenueCents(
  ownerId: ObjectId,
  opts: { since?: Date; unitId?: ObjectId } = {},
): Promise<number> {
  const c = await getCollection();
  const match: Filter<BookingDoc> = { ownerId, deletedAt: { $exists: false } };
  if (opts.since) match.createdAt = { $gte: opts.since };
  if (opts.unitId) match.unitId = opts.unitId;
  const rows = await c
    .aggregate<{ total: number }>([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$grossAmountCents" } } },
    ])
    .toArray();
  return rows[0]?.total ?? 0;
}

// ---------- Writes ----------

export type CreateBookingInput = {
  unitId: ObjectId;
  unitName: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  grossAmountCents: number;
  isDemo?: boolean;
};

export async function createBooking(
  ownerId: ObjectId,
  input: CreateBookingInput,
): Promise<BookingDoc> {
  const now = new Date();
  const status: BookingStatus = input.checkIn <= now ? "checked_in" : "upcoming";
  const doc: Omit<BookingDoc, "_id"> = {
    ownerId,
    unitId: input.unitId,
    unitName: input.unitName,
    guestName: input.guestName.trim(),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    grossAmountCents: input.grossAmountCents,
    status,
    isDemo: input.isDemo,
    createdAt: now,
  };
  const c = await getCollection();
  const result = await c.insertOne(doc as BookingDoc);
  return { ...doc, _id: result.insertedId } as BookingDoc;
}

/**
 * Atomically flips a booking to `checked_out`. Returns null when it was already
 * checked out (or missing), which makes checkout idempotent (R3).
 */
export async function checkoutBooking(
  ownerId: ObjectId,
  bookingId: ObjectId,
): Promise<BookingDoc | null> {
  const c = await getCollection();
  const result = await c.findOneAndUpdate(
    {
      _id: bookingId,
      ownerId,
      status: { $in: ["upcoming", "checked_in"] },
      deletedAt: { $exists: false },
    },
    { $set: { status: "checked_out", checkedOutAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function attachCleaningWorkOrder(
  ownerId: ObjectId,
  bookingId: ObjectId,
  workOrderId: ObjectId,
): Promise<void> {
  const c = await getCollection();
  await c.updateOne(
    { _id: bookingId, ownerId },
    { $set: { cleaningWorkOrderId: workOrderId } },
  );
}

export function formatBookingStatus(status: BookingStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "checked_in":
      return "Checked in";
    case "checked_out":
      return "Checked out";
  }
}

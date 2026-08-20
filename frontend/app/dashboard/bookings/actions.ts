"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import {
  attachCleaningWorkOrder,
  checkoutBooking,
  createBooking,
  getBookingById,
} from "@/lib/bookings";
import { getUnitById, setUnitStatus } from "@/lib/units";
import { getVendorById, listVendors } from "@/lib/vendors";
import { createWorkOrder } from "@/lib/work-orders";

export type CreateBookingState = { error?: string };
export type CheckoutBookingState = { error?: string };

const DEFAULT_CLEANING_FEE_CENTS = 12_000;

function parseDollarsToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseDateInput(raw: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function ownerObjectId(): Promise<ObjectId | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  return new ObjectId(session.userId);
}

function revalidateBookingSurfaces(unitId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/units");
  revalidatePath(`/dashboard/units/${unitId}`);
  revalidatePath("/dashboard/work-orders");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/reports");
}

/** R1: create booking → unit Occupied, revenue recognised. */
export async function createBookingAction(
  _prev: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };

  const unitIdRaw = String(formData.get("unitId") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const checkIn = parseDateInput(String(formData.get("checkIn") ?? ""));
  const checkOut = parseDateInput(String(formData.get("checkOut") ?? ""));
  const grossAmountCents = parseDollarsToCents(String(formData.get("amount") ?? ""));

  if (!ObjectId.isValid(unitIdRaw)) return { error: "Choose a unit." };
  if (!guestName) return { error: "Enter the guest's name." };
  if (guestName.length > 80) return { error: "Guest name is too long (max 80 characters)." };
  if (!checkIn || !checkOut) return { error: "Pick check-in and check-out dates." };
  if (checkOut <= checkIn) return { error: "Check-out must be after check-in." };
  if (grossAmountCents === null || grossAmountCents === 0)
    return { error: "Enter the booking value." };

  const unitId = new ObjectId(unitIdRaw);
  let unit;
  try {
    unit = await getUnitById(ownerId, unitId);
  } catch (err) {
    console.error("[bookings] unit read failed:", err);
    return { error: "We couldn't verify that unit. Try again." };
  }
  if (!unit) return { error: "Unit not found." };

  let booking;
  try {
    booking = await createBooking(ownerId, {
      unitId,
      unitName: unit.name,
      guestName,
      checkIn,
      checkOut,
      grossAmountCents,
    });
    await setUnitStatus(ownerId, unitId, "occupied");
  } catch (err) {
    console.error("[bookings] create failed:", err);
    return { error: "We couldn't save that booking. Please try again." };
  }

  void recordActivity(ownerId, {
    type: "booking.created",
    summary: `${booking.guestName} booked ${booking.unitName}`,
    entityType: "booking",
    entityRef: booking._id.toString(),
    meta: { unitId: unitIdRaw, grossAmountCents },
  }).catch(() => {});

  revalidateBookingSurfaces(unitIdRaw);
  redirect("/dashboard/bookings");
}

/** R3: checkout → booking checked_out, unit Needs cleaning, one cleaning work order. */
export async function checkoutBookingAction(
  bookingId: string,
): Promise<CheckoutBookingState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };
  if (!ObjectId.isValid(bookingId)) return { error: "Booking not found." };
  const bookingObjectId = new ObjectId(bookingId);

  let existing;
  try {
    existing = await getBookingById(ownerId, bookingObjectId);
  } catch (err) {
    console.error("[bookings] read failed:", err);
    return { error: "We couldn't load that booking. Try again." };
  }
  if (!existing) return { error: "Booking not found." };
  if (existing.status === "checked_out")
    return { error: "This guest has already been checked out." };

  const unit = await getUnitById(ownerId, existing.unitId);
  if (!unit) return { error: "The unit for this booking no longer exists." };

  // Resolve the cleaning vendor: the unit's preferred one, else the first cleaning vendor.
  let vendor = unit.cleaningVendorId
    ? await getVendorById(ownerId, unit.cleaningVendorId)
    : null;
  if (!vendor) {
    const [first] = await listVendors(ownerId, { role: "cleaning", limit: 1 });
    vendor = first ?? null;
  }
  if (!vendor)
    return { error: "Add a cleaning vendor before checking guests out." };

  // Atomic flip first so two concurrent checkouts can't create two cleaning jobs.
  const booking = await checkoutBooking(ownerId, bookingObjectId);
  if (!booking) return { error: "This guest has already been checked out." };

  let workOrder;
  try {
    workOrder = await createWorkOrder(ownerId, {
      unitId: unit._id,
      vendorId: vendor._id,
      unitName: unit.name,
      vendorName: vendor.name,
      type: "cleaning",
      title: `Turnover clean · ${unit.name}`,
      costCents: unit.cleaningFeeCents ?? DEFAULT_CLEANING_FEE_CENTS,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: `Auto-created at checkout for ${booking.guestName}.`,
    });
    await Promise.all([
      attachCleaningWorkOrder(ownerId, bookingObjectId, workOrder._id),
      setUnitStatus(ownerId, unit._id, "needs_cleaning"),
    ]);
  } catch (err) {
    console.error("[bookings] checkout side-effects failed:", err);
    return { error: "Checked out, but we couldn't schedule cleaning. Create the job manually." };
  }

  void recordActivity(ownerId, {
    type: "booking.checked_out",
    summary: `${booking.guestName} checked out of ${unit.name} — cleaning scheduled`,
    entityType: "booking",
    entityRef: bookingId,
    meta: { unitId: unit._id.toString(), workOrderId: workOrder._id.toString() },
  }).catch(() => {});
  void recordActivity(ownerId, {
    type: "work_order.created",
    summary: `${workOrder.title} assigned to ${workOrder.vendorName}`,
    entityType: "work_order",
    entityRef: workOrder._id.toString(),
    meta: { unitId: unit._id.toString(), vendorId: vendor._id.toString(), costCents: workOrder.costCents },
  }).catch(() => {});

  revalidateBookingSurfaces(unit._id.toString());
  return {};
}

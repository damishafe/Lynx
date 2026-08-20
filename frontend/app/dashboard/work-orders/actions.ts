"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { createPayout } from "@/lib/payouts";
import { getUnitById, setUnitStatus } from "@/lib/units";
import { getUserById } from "@/lib/users";
import { getVendorById } from "@/lib/vendors";
import {
  completeWorkOrder,
  createWorkOrder,
  formatWorkOrderType,
  type WorkOrderType,
} from "@/lib/work-orders";
import {
  sendWorkOrderAssignedEmail,
  sendWorkOrderCompletedEmail,
} from "@/lib/email";

export type CreateWorkOrderState = { error?: string };
export type CompleteWorkOrderState = { error?: string };

const TYPES = new Set<WorkOrderType>([
  "cleaning",
  "maintenance",
  "inspection",
  "repair",
  "other",
]);

function parseDollarsToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

async function ownerObjectId(): Promise<ObjectId | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  return new ObjectId(session.userId);
}

export async function createWorkOrderAction(
  _prev: CreateWorkOrderState,
  formData: FormData,
): Promise<CreateWorkOrderState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };

  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "cleaning");
  const unitIdRaw = String(formData.get("unitId") ?? "");
  const vendorIdRaw = String(formData.get("vendorId") ?? "");
  const costCents = parseDollarsToCents(String(formData.get("cost") ?? ""));
  const dueAtRaw = String(formData.get("dueAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!title) return { error: "Give the work order a clear title." };
  if (!ObjectId.isValid(unitIdRaw)) return { error: "Choose a valid unit." };
  if (!ObjectId.isValid(vendorIdRaw)) return { error: "Choose a valid vendor." };
  if (costCents === null) return { error: "Enter the job cost." };

  const type = TYPES.has(typeRaw as WorkOrderType)
    ? (typeRaw as WorkOrderType)
    : "other";
  const unitId = new ObjectId(unitIdRaw);
  const vendorId = new ObjectId(vendorIdRaw);

  let unit;
  let vendor;
  try {
    [unit, vendor] = await Promise.all([
      getUnitById(ownerId, unitId),
      getVendorById(ownerId, vendorId),
    ]);
  } catch (err) {
    console.error("[work-orders] relation read failed:", err);
    return { error: "We couldn't verify that unit and vendor. Try again." };
  }
  if (!unit) return { error: "Unit not found." };
  if (!vendor) return { error: "Vendor not found." };

  let workOrder;
  try {
    workOrder = await createWorkOrder(ownerId, {
      unitId,
      vendorId,
      unitName: unit.name,
      vendorName: vendor.name,
      type,
      title,
      costCents,
      dueAt: dueAtRaw ? new Date(`${dueAtRaw}T12:00:00`) : undefined,
      notes,
    });
    if (type !== "cleaning") {
      await setUnitStatus(ownerId, unitId, "maintenance");
    }
  } catch (err) {
    console.error("[work-orders] create failed:", err);
    return { error: "We couldn't create that work order. Please try again." };
  }

  void recordActivity(ownerId, {
    type: "work_order.created",
    summary: `${workOrder.title} assigned to ${workOrder.vendorName}`,
    entityType: "work_order",
    entityRef: workOrder._id.toString(),
    meta: {
      unitId: workOrder.unitId.toString(),
      vendorId: workOrder.vendorId.toString(),
      costCents: workOrder.costCents,
    },
  }).catch(() => {});

  // Notify the vendor by email if we have one on file. Fire-and-forget so
  // a mail outage doesn't block the work-order creation.
  if (vendor.email) {
    const session = await getSession();
    const managerName = session?.name ?? "Your manager";
    void sendWorkOrderAssignedEmail({
      to: vendor.email,
      vendorName: vendor.name,
      managerName,
      jobTitle: workOrder.title,
      jobType: formatWorkOrderType(workOrder.type),
      unitName: workOrder.unitName,
      costCents: workOrder.costCents,
      dueAt: workOrder.dueAt,
      vendorId: vendorIdRaw,
      notes,
    }).catch((err) => {
      console.error("[work-orders] sendWorkOrderAssignedEmail failed:", err);
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/work-orders");
  revalidatePath(`/dashboard/units/${unitIdRaw}`);
  redirect("/dashboard/work-orders");
}

export async function completeWorkOrderAction(
  workOrderId: string,
): Promise<CompleteWorkOrderState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };
  if (!ObjectId.isValid(workOrderId)) return { error: "Work order not found." };

  let workOrder;
  try {
    workOrder = await completeWorkOrder(ownerId, new ObjectId(workOrderId));
    if (!workOrder) return { error: "Work order is already complete or missing." };
    await Promise.all([
      createPayout(ownerId, {
        vendorId: workOrder.vendorId,
        unitId: workOrder.unitId,
        vendorName: workOrder.vendorName,
        category: workOrder.title,
        amountCents: -Math.abs(workOrder.costCents),
        status: "pending",
        occurredAt: workOrder.completedAt,
      }),
      setUnitStatus(ownerId, workOrder.unitId, "ready"),
    ]);
  } catch (err) {
    console.error("[work-orders] complete failed:", err);
    return { error: "We couldn't complete that job. Please try again." };
  }

  void recordActivity(ownerId, {
    type: "work_order.completed",
    summary: `${workOrder.title} completed by ${workOrder.vendorName}`,
    entityType: "work_order",
    entityRef: workOrder._id.toString(),
    meta: {
      unitId: workOrder.unitId.toString(),
      vendorId: workOrder.vendorId.toString(),
      costCents: workOrder.costCents,
    },
  }).catch(() => {});

  void notifyManagerOfCompletion({
    ownerId,
    title: workOrder.title,
    vendorName: workOrder.vendorName,
    unitName: workOrder.unitName,
    costCents: workOrder.costCents,
  }).catch((err) => {
    console.error("[work-orders] notifyManagerOfCompletion failed:", err);
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/work-orders");
  revalidatePath(`/dashboard/units/${workOrder.unitId.toString()}`);
  return {};
}

/**
 * Looks up the manager's account email and sends them a "job done" email.
 * Exported so the public vendor portal can reuse it without duplicating
 * the lookup-and-send dance.
 */
export async function notifyManagerOfCompletion({
  ownerId,
  title,
  vendorName,
  unitName,
  costCents,
}: {
  ownerId: ObjectId;
  title: string;
  vendorName: string;
  unitName: string;
  costCents: number;
}): Promise<void> {
  const owner = await getUserById(ownerId.toString());
  if (!owner?.email) return;
  await sendWorkOrderCompletedEmail({
    to: owner.email,
    managerName: owner.name,
    vendorName,
    jobTitle: title,
    unitName,
    costCents,
  });
}

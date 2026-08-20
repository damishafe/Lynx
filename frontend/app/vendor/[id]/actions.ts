"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

import { recordActivity } from "@/lib/activity";
import { createPayout } from "@/lib/payouts";
import { setUnitStatus } from "@/lib/units";
import { completePublicWorkOrder } from "@/lib/work-orders";
import { notifyManagerOfCompletion } from "@/app/dashboard/work-orders/actions";

export type VendorCompleteState = { error?: string };

export async function completeVendorJobAction(
  vendorId: string,
  workOrderId: string,
): Promise<VendorCompleteState> {
  if (!ObjectId.isValid(vendorId)) return { error: "Vendor not found." };
  if (!ObjectId.isValid(workOrderId)) return { error: "Job not found." };

  let workOrder;
  try {
    workOrder = await completePublicWorkOrder(new ObjectId(workOrderId));
    if (!workOrder) return { error: "This job is already complete." };
    if (workOrder.vendorId.toString() !== vendorId) {
      return { error: "This job is assigned to another vendor." };
    }
    await Promise.all([
      createPayout(workOrder.ownerId, {
        vendorId: workOrder.vendorId,
        unitId: workOrder.unitId,
        vendorName: workOrder.vendorName,
        category: workOrder.title,
        amountCents: -Math.abs(workOrder.costCents),
        status: "pending",
        occurredAt: workOrder.completedAt,
      }),
      setUnitStatus(workOrder.ownerId, workOrder.unitId, "ready"),
    ]);
  } catch (err) {
    console.error("[vendor portal] complete failed:", err);
    return { error: "We couldn't mark that job complete. Please try again." };
  }

  void recordActivity(workOrder.ownerId, {
    type: "work_order.completed",
    summary: `${workOrder.title} completed by ${workOrder.vendorName}`,
    entityType: "work_order",
    entityRef: workOrder._id.toString(),
    meta: {
      unitId: workOrder.unitId.toString(),
      vendorId: workOrder.vendorId.toString(),
      costCents: workOrder.costCents,
      source: "vendor_portal",
    },
  }).catch(() => {});

  // Email the manager confirming the unit is back online + payout queued.
  void notifyManagerOfCompletion({
    ownerId: workOrder.ownerId,
    title: workOrder.title,
    vendorName: workOrder.vendorName,
    unitName: workOrder.unitName,
    costCents: workOrder.costCents,
  }).catch((err) => {
    console.error("[vendor portal] notifyManagerOfCompletion failed:", err);
  });

  revalidatePath(`/vendor/${vendorId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/work-orders");
  revalidatePath(`/dashboard/units/${workOrder.unitId.toString()}`);
  return {};
}

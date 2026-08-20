"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import {
  createUnit,
  setUnitStatus,
  softDeleteUnit,
  type UnitStatus,
  UNIT_STATUSES,
} from "@/lib/units";
import { recordActivity } from "@/lib/activity";

export type CreateUnitState = { error?: string };

const STATUS_SET = new Set<UnitStatus>(UNIT_STATUSES);

function parseDollarsToCents(raw: string): number | undefined {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

async function ownerObjectId(): Promise<ObjectId | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  return new ObjectId(session.userId);
}

export async function createUnitAction(
  _prev: CreateUnitState,
  formData: FormData,
): Promise<CreateUnitState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "ready");
  const address = String(formData.get("address") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const monthlyRevenueCents = parseDollarsToCents(
    String(formData.get("monthlyRevenue") ?? ""),
  );

  if (!name) return { error: "Give your unit a name." };
  if (name.length > 80) return { error: "Unit name is too long (max 80 characters)." };
  if (!type) return { error: "Pick a type so you can filter later." };
  const status = STATUS_SET.has(statusRaw as UnitStatus)
    ? (statusRaw as UnitStatus)
    : "ready";

  let unit;
  try {
    unit = await createUnit(ownerId, {
      name,
      type,
      status,
      address,
      notes,
      monthlyRevenueCents,
    });
  } catch (err) {
    console.error("[units] createUnit failed:", err);
    return {
      error: "We couldn't save that unit right now. Please try again in a moment.",
    };
  }

  void recordActivity(ownerId, {
    type: "unit.created",
    summary: `${unit.name} added to your portfolio`,
    entityType: "unit",
    entityRef: unit._id.toString(),
  }).catch(() => {});

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/units");
  redirect(`/dashboard/units/${unit._id.toString()}`);
}

export type SetStatusState = { error?: string };

export async function setUnitStatusAction(
  unitId: string,
  status: UnitStatus,
): Promise<SetStatusState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };
  if (!ObjectId.isValid(unitId)) return { error: "Unit not found." };
  if (!STATUS_SET.has(status)) return { error: "Invalid status." };

  const unitObjectId = new ObjectId(unitId);
  const ok = await setUnitStatus(ownerId, unitObjectId, status);
  if (!ok) return { error: "Unit not found." };

  void recordActivity(ownerId, {
    type: "unit.status_changed",
    summary: `Unit set to ${status}`,
    entityType: "unit",
    entityRef: unitId,
    meta: { status },
  }).catch(() => {});

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/units");
  revalidatePath(`/dashboard/units/${unitId}`);
  return {};
}

export async function deleteUnitAction(unitId: string): Promise<void> {
  const ownerId = await ownerObjectId();
  if (!ownerId) redirect("/login");
  if (!ObjectId.isValid(unitId)) redirect("/dashboard/units");

  const unitObjectId = new ObjectId(unitId);
  const ok = await softDeleteUnit(ownerId, unitObjectId);
  if (ok) {
    void recordActivity(ownerId, {
      type: "unit.deleted",
      summary: "Unit archived",
      entityType: "unit",
      entityRef: unitId,
    }).catch(() => {});
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/units");
  redirect("/dashboard/units");
}

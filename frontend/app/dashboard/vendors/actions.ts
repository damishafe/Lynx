"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { createVendor, type VendorRole } from "@/lib/vendors";

export type CreateVendorState = { error?: string };

const ROLES = new Set<VendorRole>([
  "cleaning",
  "maintenance",
  "supplies",
  "software",
  "other",
]);

async function ownerObjectId(): Promise<ObjectId | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  return new ObjectId(session.userId);
}

export async function createVendorAction(
  _prev: CreateVendorState,
  formData: FormData,
): Promise<CreateVendorState> {
  const ownerId = await ownerObjectId();
  if (!ownerId) return { error: "Your session expired. Log in again." };

  const name = String(formData.get("name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "other");
  const email = String(formData.get("email") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!name) return { error: "Vendor name is required." };
  if (name.length > 80) return { error: "Vendor name is too long." };
  const role = ROLES.has(roleRaw as VendorRole)
    ? (roleRaw as VendorRole)
    : "other";

  let vendor;
  try {
    vendor = await createVendor(ownerId, { name, role, email, phone, notes });
  } catch (err) {
    console.error("[vendors] createVendor failed:", err);
    return { error: "We couldn't save that vendor. Please try again." };
  }

  void recordActivity(ownerId, {
    type: "vendor.created",
    summary: `${vendor.name} added as a vendor`,
    entityType: "vendor",
    entityRef: vendor._id.toString(),
    meta: { role: vendor.role },
  }).catch(() => {});

  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/vendors");
  redirect("/dashboard/vendors");
}

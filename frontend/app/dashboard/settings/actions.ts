"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  clearPendingVerify,
  clearSession,
  getSession,
  setSession,
} from "@/lib/auth";
import {
  deleteUserCascade,
  getUserById,
  updateUserName,
  updateUserPassword,
  verifyPassword,
} from "@/lib/users";

export type ProfileState = { ok?: boolean; error?: string };
export type PasswordState = { ok?: boolean; error?: string };
export type DeleteState = { error?: string };

async function ownerObjectId(): Promise<{ id: ObjectId; name: string; email: string } | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  return {
    id: new ObjectId(session.userId),
    name: session.name,
    email: session.email,
  };
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const owner = await ownerObjectId();
  if (!owner) return { error: "Your session expired. Log in again." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Your name can't be empty." };
  if (name.length > 80) return { error: "Name is too long (max 80 characters)." };

  try {
    const ok = await updateUserName(owner.id, name);
    if (!ok) return { error: "We couldn't update your profile. Please try again." };
  } catch (err) {
    console.error("[settings] updateProfile failed:", err);
    return {
      error:
        "We couldn't reach our servers right now. Please try again in a moment.",
    };
  }

  // Refresh session cookie so the new name shows in the topbar immediately.
  await setSession({ userId: owner.id.toString(), email: owner.email, name });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const owner = await ownerObjectId();
  if (!owner) return { error: "Your session expired. Log in again." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm) {
    return { error: "Please fill in every field." };
  }
  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "New passwords don't match." };
  }
  if (next === current) {
    return { error: "Pick a new password that's different from the current one." };
  }

  let user;
  try {
    user = await getUserById(owner.id.toString());
  } catch (err) {
    console.error("[settings] getUserById failed:", err);
    return {
      error:
        "We couldn't reach our servers right now. Please try again in a moment.",
    };
  }
  if (!user) return { error: "Your account is missing. Please log in again." };

  const valid = await verifyPassword(current, user.passwordHash);
  if (!valid) return { error: "Your current password is incorrect." };

  try {
    await updateUserPassword(owner.id, next);
  } catch (err) {
    console.error("[settings] updateUserPassword failed:", err);
    return { error: "We couldn't change your password. Please try again." };
  }

  return { ok: true };
}

export async function deleteAccount(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const owner = await ownerObjectId();
  if (!owner) return { error: "Your session expired. Log in again." };

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    return {
      error: "Type DELETE in capitals to confirm — or cancel if you've changed your mind.",
    };
  }

  try {
    await deleteUserCascade(owner.id);
  } catch (err) {
    console.error("[settings] deleteUserCascade failed:", err);
    return {
      error: "We couldn't delete your account right now. Please try again.",
    };
  }

  await clearSession();
  await clearPendingVerify();
  redirect("/?deleted=1");
}

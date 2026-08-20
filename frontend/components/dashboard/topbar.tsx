import { ObjectId } from "mongodb";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";

import { getUserById, type SubscriptionStatus } from "@/lib/users";

import { MobileNavDrawer } from "./mobile-drawer";
import { UserMenu } from "./user-menu";

type TopbarProps = {
  title: string;
  user: { name: string; email: string };
  /** Number of unread notifications. >0 shows the red dot. */
  notifications?: number;
};

/**
 * Async server component. Reads the user's subscription tier so the
 * `Pro` badge surfaces on every dashboard page without each page having
 * to fetch it.
 */
export async function Topbar({ title, user, notifications = 1 }: TopbarProps) {
  let tier: SubscriptionStatus = "free";
  // Best-effort: a Mongo blip should not crash the topbar.
  try {
    const session = await getSessionUserIdSafely();
    if (session) {
      const dbUser = await getUserById(session);
      if (dbUser?.subscriptionStatus === "pro") tier = "pro";
    }
  } catch {
    // ignore — topbar still renders without the badge
  }

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNavDrawer />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          aria-label="Notifications"
          className="cursor-pointer relative hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 text-zinc-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors"
        >
          <HugeiconsIcon
            icon={Notification01Icon}
            size={18}
            strokeWidth={2}
          />
          {notifications > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>
        <UserMenu name={user.name} email={user.email} tier={tier} />
      </div>
    </header>
  );
}

/** Pulls the current session id without recompiling the auth lib here. */
async function getSessionUserIdSafely(): Promise<string | null> {
  // We import lazily to keep the topbar's import graph small and to avoid
  // any module-load-time cookie reads.
  const { getSession } = await import("@/lib/auth");
  const s = await getSession();
  if (!s) return null;
  if (!ObjectId.isValid(s.userId)) return null;
  return s.userId;
}

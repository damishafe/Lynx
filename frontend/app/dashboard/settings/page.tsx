import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { Topbar } from "@/components/dashboard/topbar";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { DeleteAccountForm } from "./delete-account-form";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  return (
    <>
      <Topbar
        title="Settings"
        user={{ name: session.name, email: session.email }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Side rail — quick stats / account context */}
        <aside className="lg:col-span-4 rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#09090B] text-white text-base font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              {session.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight text-zinc-900 truncate">
                {session.name}
              </div>
              <div className="text-[11px] font-medium text-gray-500 truncate">
                {session.email}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Member since
              </p>
              <p className="mt-1 text-sm font-semibold tracking-tight text-zinc-900">
                {formatDate(new Date(user.createdAt))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Status
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified
              </p>
            </div>
          </div>

          {user.lastLoginAt && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Last login
                </p>
                <p className="mt-1 text-sm font-semibold tracking-tight text-zinc-900">
                  {formatDate(new Date(user.lastLoginAt))}
                </p>
              </div>
            </>
          )}
        </aside>

        {/* Main content stack */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Profile */}
          <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
            <header className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                Profile
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                What other people on your team see when they look at activity
                you&rsquo;ve done.
              </p>
            </header>
            <ProfileForm initialName={user.name} email={user.email} />
          </section>

          {/* Security */}
          <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
            <header className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                Security
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Change your password. Any pending password-reset link will be
                invalidated.
              </p>
            </header>
            <PasswordForm />
          </section>

          {/* Danger zone */}
          <section className="rounded-[2rem] bg-rose-50/40 border border-rose-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8">
            <header className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight text-rose-900">
                Danger zone
              </h2>
              <p className="mt-1 text-sm font-medium text-rose-700/80">
                Deleting your account permanently removes every unit, every
                activity event, and your account itself. This can&rsquo;t be
                undone.
              </p>
            </header>
            <DeleteAccountForm email={session.email} />
          </section>
        </div>
      </div>
    </>
  );
}

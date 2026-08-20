import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Building01Icon } from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import {
  UNIT_STATUSES,
  countUnitsByStatus,
  listUnits,
  type UnitStatus,
} from "@/lib/units";

import { Topbar } from "@/components/dashboard/topbar";
import { UnitCard } from "@/components/dashboard/unit-card";
import { buttonClasses } from "@/components/ui/button";
import { UnitsToolbar } from "./units-toolbar";

const STATUS_SET = new Set<UnitStatus>(UNIT_STATUSES);

type Search = Promise<{ status?: string; q?: string }>;

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  const sp = await searchParams;
  const status =
    sp.status && STATUS_SET.has(sp.status as UnitStatus)
      ? (sp.status as UnitStatus)
      : undefined;
  const q = sp.q?.trim();

  let counts = { total: 0, ready: 0, occupied: 0, maintenance: 0 };
  let units: Awaited<ReturnType<typeof listUnits>> = [];
  let error: string | null = null;

  try {
    [counts, units] = await Promise.all([
      countUnitsByStatus(ownerId),
      listUnits(ownerId, { status, q }),
    ]);
  } catch (err) {
    console.error("[units page] read failed:", err);
    error =
      "We couldn't load your units right now. Refresh in a moment, or check back shortly.";
  }

  return (
    <>
      <Topbar
        title="Units"
        user={{ name: session.name, email: session.email }}
      />

      <UnitsToolbar counts={counts} />

      {error ? (
        <ErrorState message={error} />
      ) : units.length === 0 ? (
        <EmptyState filtered={Boolean(status || q)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {units.map((u) => (
            <UnitCard key={u._id.toString()} unit={u} />
          ))}
        </div>
      )}
    </>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-12 sm:p-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mb-5">
        <HugeiconsIcon icon={Building01Icon} size={24} strokeWidth={2} />
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
        {filtered ? "No units match those filters" : "No units yet"}
      </h3>
      <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
        {filtered
          ? "Clear the search or pick a different status to see more."
          : "Add your first unit to start tracking its status, revenue, and activity in one place."}
      </p>
      {!filtered && (
        <Link
          href="/dashboard/units/new"
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
          Add your first unit
        </Link>
      )}
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-[2rem] bg-white border border-rose-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-10 text-center">
      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2">
        Couldn&rsquo;t load your units
      </h3>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </section>
  );
}

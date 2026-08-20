import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { listUnits } from "@/lib/units";
import { listVendors } from "@/lib/vendors";
import { Topbar } from "@/components/dashboard/topbar";
import { NewWorkOrderForm } from "./new-work-order-form";

export default async function NewWorkOrderPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let units: Awaited<ReturnType<typeof listUnits>> = [];
  let vendors: Awaited<ReturnType<typeof listVendors>> = [];

  try {
    [units, vendors] = await Promise.all([
      listUnits(ownerId, { limit: 200 }),
      listVendors(ownerId, { limit: 200 }),
    ]);
  } catch (err) {
    console.error("[new work order] read failed:", err);
  }

  return (
    <>
      <Topbar
        title="Create work order"
        user={{ name: session.name, email: session.email }}
      />

      <nav className="text-sm font-medium text-gray-500 -mt-2">
        <Link
          href="/dashboard/work-orders"
          className="hover:text-zinc-900 transition-colors"
        >
          Work orders
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-zinc-900">New</span>
      </nav>

      <div className="max-w-3xl">
        <NewWorkOrderForm
          units={units.map((unit) => ({
            id: unit._id.toString(),
            label: unit.name,
            sub: unit.type,
          }))}
          vendors={vendors.map((vendor) => ({
            id: vendor._id.toString(),
            label: vendor.name,
            sub: vendor.role,
          }))}
        />
      </div>
    </>
  );
}

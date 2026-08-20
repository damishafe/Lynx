import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { listUnits } from "@/lib/units";
import { Topbar } from "@/components/dashboard/topbar";
import { NewBookingForm } from "./new-booking-form";

export default async function NewBookingPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let units: Awaited<ReturnType<typeof listUnits>> = [];
  try {
    units = await listUnits(ownerId, { limit: 200 });
  } catch (err) {
    console.error("[new booking] read failed:", err);
  }

  return (
    <>
      <Topbar title="New booking" user={{ name: session.name, email: session.email }} />
      <nav className="text-sm font-medium text-gray-500 -mt-2">
        <Link href="/dashboard/bookings" className="hover:text-zinc-900 transition-colors">
          Bookings
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-zinc-900">New</span>
      </nav>
      <div className="max-w-3xl">
        <NewBookingForm units={units.map((u) => ({ id: u._id.toString(), label: u.name }))} />
      </div>
    </>
  );
}

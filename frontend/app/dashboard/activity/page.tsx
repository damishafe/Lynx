import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { listPayouts } from "@/lib/payouts";
import { listVendors } from "@/lib/vendors";
import { Topbar } from "@/components/dashboard/topbar";
import { QuickPayout } from "@/components/dashboard/quick-payout";
import { PayoutVolume } from "@/components/dashboard/payout-volume";
import { ActivityTable } from "@/components/dashboard/activity-table";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);
  const name = session?.name ?? "Operator";
  const email = session?.email ?? "";

  let vendors: Awaited<ReturnType<typeof listVendors>> = [];
  let payouts: Awaited<ReturnType<typeof listPayouts>> = [];

  try {
    [vendors, payouts] = await Promise.all([
      listVendors(ownerId, { limit: 4 }),
      listPayouts(ownerId, { limit: 25 }),
    ]);
  } catch (err) {
    console.error("[activity] read failed:", err);
  }

  return (
    <>
      <Topbar title="Activity" user={{ name, email }} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 flex flex-col gap-5">
          <QuickPayout vendors={vendors} payouts={payouts} />
          <PayoutVolume payouts={payouts} />
        </div>
        <div className="lg:col-span-8">
          <ActivityTable payouts={payouts} />
        </div>
      </div>
    </>
  );
}

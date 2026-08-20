import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Building01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { listBookings, type BookingDoc } from "@/lib/bookings";
import { formatUnsignedAmount } from "@/lib/payouts";
import { Topbar } from "@/components/dashboard/topbar";
import { BookingStatusPill } from "@/components/dashboard/booking-status-pill";
import { CheckoutBookingButton } from "@/components/dashboard/checkout-booking-button";
import { buttonClasses } from "@/components/ui/button";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let bookings: BookingDoc[] = [];
  let error: string | null = null;
  try {
    bookings = await listBookings(ownerId, { limit: 200 });
  } catch (err) {
    console.error("[bookings page] read failed:", err);
    error = "We couldn't load bookings right now. Refresh in a moment.";
  }

  const active = bookings.filter((b) => b.status !== "checked_out").length;
  const grossCents = bookings.reduce((sum, b) => sum + b.grossAmountCents, 0);

  return (
    <>
      <Topbar title="Bookings" user={{ name: session.name, email: session.email }} />

      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Reservations
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {active} active · {formatUnsignedAmount(grossCents)} gross booked. Checking a
              guest out schedules the turnover clean automatically.
            </p>
          </div>
          <Link
            href="/dashboard/bookings/new"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
            New booking
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-10 text-center">
            <span className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
              <HugeiconsIcon icon={Calendar03Icon} size={24} strokeWidth={2} />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900">No bookings yet</h3>
            <p className="mt-2 text-sm font-medium text-gray-500 max-w-md mx-auto leading-relaxed">
              Add a reservation to mark the unit occupied and recognise its revenue.
            </p>
            <Link
              href="/dashboard/bookings/new"
              className={buttonClasses({ variant: "primary", size: "md", className: "mt-6" })}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
              Create first booking
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[1.4fr_1.2fr_1fr_120px_130px_120px] gap-4 rounded-xl bg-gray-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                <span>Guest</span>
                <span>Unit</span>
                <span>Stay</span>
                <span className="text-right">Value</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <li
                    key={b._id.toString()}
                    className="grid grid-cols-[1.4fr_1.2fr_1fr_120px_130px_120px] gap-4 px-4 py-4 items-center hover:bg-gray-50/60 transition-colors rounded-xl"
                  >
                    <span className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                      {b.guestName}
                    </span>
                    <span className="min-w-0 flex items-center gap-2 text-sm font-medium text-gray-600">
                      <HugeiconsIcon icon={Building01Icon} size={14} strokeWidth={2} className="text-gray-400 shrink-0" />
                      <span className="truncate">{b.unitName}</span>
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </span>
                    <span className="text-right text-sm font-semibold tracking-tight text-zinc-900">
                      {formatUnsignedAmount(b.grossAmountCents)}
                    </span>
                    <BookingStatusPill status={b.status} />
                    <div className="flex justify-end">
                      {b.status === "checked_out" ? (
                        <span className="text-xs font-medium text-gray-400">Done</span>
                      ) : (
                        <CheckoutBookingButton bookingId={b._id.toString()} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

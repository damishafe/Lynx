import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  MoneyBag01Icon,
  Note01Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

import { formatUnsignedAmount } from "@/lib/payouts";
import { getPublicVendorById } from "@/lib/vendors";
import {
  formatWorkOrderType,
  listPublicVendorWorkOrders,
} from "@/lib/work-orders";
import { CompleteVendorJobButton } from "@/components/vendor/complete-vendor-job-button";

type Params = Promise<{ id: string }>;

function formatDate(d?: Date): string {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function VendorPortalPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  const vendorId = new ObjectId(id);

  const [vendor, jobs] = await Promise.all([
    getPublicVendorById(vendorId),
    listPublicVendorWorkOrders(vendorId),
  ]);
  if (!vendor) notFound();

  const totalOwed = jobs.reduce((sum, job) => sum + Math.abs(job.costCents), 0);

  return (
    <main className="min-h-screen bg-[#F3F4F6] p-4 sm:p-6">
      <div className="mx-auto max-w-md flex flex-col gap-4">
        <section className="rounded-[2rem] bg-[#09090B] text-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.16)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                Lynx vendor portal
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight leading-none">
                {vendor.name}
              </h1>
              <p className="mt-2 text-sm font-medium text-white/55">
                {jobs.length} assigned {jobs.length === 1 ? "job" : "jobs"}
              </p>
            </div>
            <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 text-white">
              <HugeiconsIcon icon={WorkHistoryIcon} size={20} strokeWidth={2} />
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
              <p className="text-[11px] font-medium text-white/45">
                Open jobs
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {jobs.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
              <p className="text-[11px] font-medium text-white/45">
                Pending value
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatUnsignedAmount(totalOwed)}
              </p>
            </div>
          </div>
        </section>

        {jobs.length === 0 ? (
          <section className="rounded-[2rem] bg-white border border-gray-100 p-8 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
            <span className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={24}
                strokeWidth={2}
              />
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              You are all caught up
            </h2>
            <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">
              New assigned jobs will appear here when your manager sends them.
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            {jobs.map((job) => (
              <article
                key={job._id.toString()}
                className="rounded-[2rem] bg-white border border-gray-100 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-100/70 px-3 py-1 text-[11px] font-semibold tracking-tight">
                      {formatWorkOrderType(job.type)}
                    </span>
                    <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 leading-snug">
                      {job.title}
                    </h2>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900">
                    {formatUnsignedAmount(job.costCents)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm font-medium text-gray-600">
                  <InfoRow icon={Building01Icon} label={job.unitName} />
                  <InfoRow icon={Calendar03Icon} label={formatDate(job.dueAt)} />
                  {job.notes && <InfoRow icon={Note01Icon} label={job.notes} />}
                  <InfoRow
                    icon={MoneyBag01Icon}
                    label={`${formatUnsignedAmount(job.costCents)} pending when complete`}
                  />
                </div>

                <div className="mt-5">
                  <CompleteVendorJobButton
                    vendorId={id}
                    workOrderId={job._id.toString()}
                  />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  label,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  label: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <HugeiconsIcon
        icon={icon}
        size={14}
        strokeWidth={2}
        className="mt-0.5 text-gray-400 shrink-0"
      />
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

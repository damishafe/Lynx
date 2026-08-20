import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";

import { getSession } from "@/lib/auth";
import { listVendors, type VendorDoc, type VendorRole } from "@/lib/vendors";
import { Topbar } from "@/components/dashboard/topbar";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roleLabels: Record<VendorRole, string> = {
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  supplies: "Supplies",
  software: "Software",
  other: "Other",
};

const roleStyles: Record<VendorRole, string> = {
  cleaning: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
  maintenance: "bg-rose-50 text-rose-700 border-rose-100/70",
  supplies: "bg-amber-50 text-amber-700 border-amber-100/70",
  software: "bg-violet-50 text-violet-700 border-violet-100/70",
  other: "bg-gray-50 text-gray-600 border-gray-100",
};

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function VendorsPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");
  const ownerId = new ObjectId(session.userId);

  let vendors: VendorDoc[] = [];
  let error: string | null = null;

  try {
    vendors = await listVendors(ownerId);
  } catch (err) {
    console.error("[vendors page] read failed:", err);
    error = "We couldn't load vendors right now. Refresh in a moment.";
  }

  return (
    <>
      <Topbar
        title="Vendors"
        user={{ name: session.name, email: session.email }}
      />

      <section className="rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Vendor network
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              The people and companies that can receive payouts or work orders.
            </p>
          </div>
          <Link
            href="/dashboard/vendors/new"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
            Add vendor
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : vendors.length === 0 ? (
          <div className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-10 text-center">
            <span className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)]">
              <HugeiconsIcon
                icon={UserMultipleIcon}
                size={24}
                strokeWidth={2}
              />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
              No vendors yet
            </h3>
            <p className="mt-2 text-sm font-medium text-gray-500 max-w-md mx-auto leading-relaxed">
              Add your first cleaner, maintenance partner, or supplier to make
              payouts and work orders feel connected.
            </p>
            <Link
              href="/dashboard/vendors/new"
              className={buttonClasses({
                variant: "primary",
                size: "md",
                className: "mt-6",
              })}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.2} />
              Add first vendor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <article
                key={vendor._id.toString()}
                className="rounded-[1.5rem] bg-gray-50/70 border border-gray-100 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white text-zinc-900 text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                      {initialsForName(vendor.name)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-900 truncate">
                        {vendor.name}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-500">
                        Added {new Date(vendor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight",
                      roleStyles[vendor.role],
                    )}
                  >
                    {roleLabels[vendor.role]}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs font-medium text-gray-500">
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={13}
                        strokeWidth={2}
                      />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={SmartPhone01Icon}
                        size={13}
                        strokeWidth={2}
                      />
                      <span className="truncate">{vendor.phone}</span>
                    </div>
                  )}
                  {!vendor.email && !vendor.phone && (
                    <span>No contact details yet</span>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <Link
                    href={`/vendor/${vendor._id.toString()}`}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
                  >
                    Open vendor portal
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={12}
                      strokeWidth={2.2}
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

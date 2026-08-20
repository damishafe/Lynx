import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { NewVendorForm } from "./new-vendor-form";

export default async function NewVendorPage() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) redirect("/login");

  return (
    <>
      <Topbar
        title="Add a vendor"
        user={{ name: session.name, email: session.email }}
      />

      <nav className="text-sm font-medium text-gray-500 -mt-2">
        <Link
          href="/dashboard/vendors"
          className="hover:text-zinc-900 transition-colors"
        >
          Vendors
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-zinc-900">New</span>
      </nav>

      <div className="max-w-3xl">
        <NewVendorForm />
      </div>
    </>
  );
}

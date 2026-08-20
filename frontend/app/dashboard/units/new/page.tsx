import Link from "next/link";

import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { NewUnitForm } from "./new-unit-form";

export default async function NewUnitPage() {
  const session = await getSession();
  const name = session?.name ?? "Operator";
  const email = session?.email ?? "";

  return (
    <>
      <Topbar title="Add a unit" user={{ name, email }} />

      <nav className="text-sm font-medium text-gray-500 -mt-2">
        <Link
          href="/dashboard/units"
          className="hover:text-zinc-900 transition-colors"
        >
          Units
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-zinc-900">New</span>
      </nav>

      <div className="max-w-3xl">
        <NewUnitForm />
      </div>
    </>
  );
}

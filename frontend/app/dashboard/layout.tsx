import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="flex gap-5">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}

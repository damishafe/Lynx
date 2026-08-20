import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If already signed in, skip auth pages and go straight to the dashboard.
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="relative z-10 min-h-screen p-3 sm:p-5 flex">
      <div className="flex-1 flex">{children}</div>
    </main>
  );
}

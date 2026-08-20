import { redirect } from "next/navigation";
import { getPendingVerify } from "@/lib/auth";
import { VerifyForm } from "./verify-form";

export default async function VerifyPage() {
  const pending = await getPendingVerify();
  if (!pending) redirect("/signup");
  return <VerifyForm email={pending.email} />;
}

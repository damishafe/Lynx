import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { buttonClasses } from "@/components/ui/button";
import { ResetForm } from "./reset-form";

type Search = Promise<{ token?: string }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell
        panelHeadline="That link's no good. Let's get you a new one."
        title="Reset link missing"
        subtitle="This page needs a token from a password-reset email. Request a fresh link to continue."
      >
        <Link
          href="/forgot-password"
          className={buttonClasses({
            variant: "primary",
            size: "lg",
            className: "w-full",
          })}
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return <ResetForm token={token} />;
}

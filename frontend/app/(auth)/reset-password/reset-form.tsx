"use client";

import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword, type ResetState } from "./actions";

const initialState: ResetState = {};

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <AuthShell
      panelHeadline="Pick a stronger one. We'll handle the rest."
      title="Set a new password"
      subtitle="Choose at least 8 characters. You'll be signed in to Lynx with the new password as soon as you're done."
      footer={
        <p className="text-center text-sm font-medium text-gray-500">
          Changed your mind?{" "}
          <Link
            href="/login"
            className="cursor-pointer text-zinc-900 font-semibold hover:underline"
          >
            Back to login
          </Link>
        </p>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <PasswordInput
          name="password"
          required
          autoComplete="new-password"
          label="New password"
          placeholder="At least 8 characters"
          minLength={8}
        />
        <PasswordInput
          name="confirm"
          required
          autoComplete="new-password"
          label="Confirm new password"
          placeholder="Re-enter your password"
          minLength={8}
        />

        {state.error && (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700"
          >
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending}
          className="w-full mt-2"
        >
          {pending ? "Resetting…" : "Reset password"}
          {!pending && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={2}
            />
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

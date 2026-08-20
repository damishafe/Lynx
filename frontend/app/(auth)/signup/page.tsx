"use client";

import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <AuthShell
      panelHeadline="The whole portfolio. Finally in one hand."
      title="Create your account"
      subtitle="Join Lynx and start running every unit, every location, and every dollar from one operations dashboard."
      footer={
        <p className="text-center text-sm font-medium text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="cursor-pointer text-zinc-900 font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          label="Your email"
          placeholder="you@company.com"
        />
        <PasswordInput
          name="password"
          required
          autoComplete="new-password"
          label="Create password"
          placeholder="At least 8 characters"
          minLength={8}
        />
        <PasswordInput
          name="confirm"
          required
          autoComplete="new-password"
          label="Confirm password"
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
          {pending ? "Creating account…" : "Create account"}
          {!pending && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={2}
            />
          )}
        </Button>
      </form>

      <p className="text-center text-[11px] font-medium text-gray-400 leading-relaxed max-w-sm mx-auto">
        By creating an account you agree to Lynx&rsquo;s{" "}
        <Link href="#terms" className="cursor-pointer underline hover:text-zinc-700">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="#privacy" className="cursor-pointer underline hover:text-zinc-700">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}

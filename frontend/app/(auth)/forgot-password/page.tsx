"use client";

import Link from "next/link";
import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, MailIcon } from "@hugeicons/core-free-icons";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestReset, type ForgotState } from "./actions";

const initialState: ForgotState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestReset,
    initialState,
  );

  if (state.ok) {
    return (
      <AuthShell
        panelHeadline="Help is on the way. Check your inbox."
        title="Check your email"
        subtitle="If an account exists for that address, we just sent a password reset link. The link expires in 1 hour."
        footer={
          <p className="text-center text-sm font-medium text-gray-500">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="cursor-pointer text-zinc-900 font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        }
      >
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100/60 px-4 py-3.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-emerald-700 shrink-0">
            <HugeiconsIcon icon={MailIcon} size={18} strokeWidth={2} />
          </span>
          <p className="text-sm font-medium text-emerald-800 leading-snug">
            Reset link sent. Don&rsquo;t see it? Check spam or try again in a
            minute.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      panelHeadline="Forgot your way in? We've got you."
      title="Reset your password"
      subtitle="Enter your account email. We'll send a link that lets you pick a new password."
      footer={
        <p className="text-center text-sm font-medium text-gray-500">
          Remembered your password?{" "}
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
          {pending ? "Sending…" : "Send reset link"}
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

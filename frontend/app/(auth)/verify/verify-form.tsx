"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { verify, resendOtp, type VerifyState } from "./actions";

const initialState: VerifyState = {};
const RESEND_COOLDOWN = 30; // seconds

export function VerifyForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(verify, initialState);
  const [code, setCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const [resendMsg, setResendMsg] = React.useState<string | null>(null);
  const [resendError, setResendError] = React.useState<string | null>(null);
  const [, startResend] = useTransition();

  // Countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onResend = () => {
    if (cooldown > 0) return;
    setResendMsg(null);
    setResendError(null);
    startResend(async () => {
      const res = await resendOtp();
      if (res.ok) {
        setResendMsg("New code sent — check your inbox.");
        setCooldown(RESEND_COOLDOWN);
      } else if (res.error) {
        setResendError(res.error);
      }
    });
  };

  return (
    <AuthShell
      panelHeadline="One last step. Verify it's really you."
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}. Enter it below to finish setting up your account.`}
      footer={
        <p className="text-center text-sm font-medium text-gray-500">
          Wrong email?{" "}
          <Link
            href="/signup"
            className="cursor-pointer text-zinc-900 font-semibold hover:underline"
          >
            Start over
          </Link>
        </p>
      }
    >
      <form action={formAction} className="flex flex-col gap-5">
        <OtpInput onChange={setCode} disabled={pending} invalid={!!state.error} />

        {state.error && (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700"
          >
            {state.error}
          </p>
        )}
        {resendError && (
          <p
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700"
          >
            {resendError}
          </p>
        )}
        {resendMsg && (
          <p className="rounded-2xl bg-emerald-50 border border-emerald-100/60 px-4 py-2.5 text-sm font-medium text-emerald-700">
            {resendMsg}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending || code.length !== 6}
          className="w-full"
        >
          {pending ? "Verifying…" : "Verify and continue"}
          {!pending && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={2}
            />
          )}
        </Button>

        <div className="text-center text-sm font-medium text-gray-500">
          Didn&rsquo;t get the email?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0}
            className="cursor-pointer text-zinc-900 font-semibold hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { LaunchDemoButton } from "@/components/demo/launch-demo-button";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const params = useSearchParams();
  const justReset = params.get("reset") === "ok";

  return (
    <AuthShell
      panelHeadline="Welcome back. Your portfolio is waiting."
      title="Log in to Lynx"
      subtitle="Pick up where you left off — across every unit, every site, and every team."
      footer={
        <p className="text-center text-sm font-medium text-gray-500">
          New to Lynx?{" "}
          <Link
            href="/signup"
            className="cursor-pointer text-zinc-900 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {justReset && (
        <p
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-100/60 px-4 py-2.5 text-sm font-medium text-emerald-700"
        >
          Password reset successful. Sign in with your new password.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          label="Your email"
          placeholder="you@company.com"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-tight text-gray-500">
              Password
            </span>
            <Link
              href="/forgot-password"
              className="cursor-pointer text-[11px] font-semibold text-zinc-900 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            name="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>

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
          {pending ? "Signing in…" : "Sign in"}
          {!pending && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={2}
            />
          )}
        </Button>
      </form>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[11px] font-medium text-gray-400">
          Try a demo
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <LaunchDemoButton
        variant="secondary"
        label="Launch seeded demo"
        className="w-full"
      />
    </AuthShell>
  );
}

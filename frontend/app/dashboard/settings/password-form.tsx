"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword, type PasswordState } from "./actions";

const initialState: PasswordState = {};

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PasswordInput
        name="current"
        required
        autoComplete="current-password"
        label="Current password"
        placeholder="Enter your current password"
      />
      <PasswordInput
        name="next"
        required
        autoComplete="new-password"
        minLength={8}
        label="New password"
        placeholder="At least 8 characters"
      />
      <PasswordInput
        name="confirm"
        required
        autoComplete="new-password"
        minLength={8}
        label="Confirm new password"
        placeholder="Re-enter your new password"
      />

      {state.error && (
        <p
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700"
        >
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-2xl bg-emerald-50 border border-emerald-100/60 px-4 py-2.5 text-sm font-medium text-emerald-700">
          Password changed. You&rsquo;ll stay signed in on this device.
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}

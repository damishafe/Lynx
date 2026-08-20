"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, type ProfileState } from "./actions";

const initialState: ProfileState = {};

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Input
        name="name"
        required
        defaultValue={initialName}
        maxLength={80}
        label="Display name"
        placeholder="Jane Operator"
      />
      <Input
        name="email"
        type="email"
        readOnly
        value={email}
        label="Email"
        hint="Email changes are coming soon and require re-verification."
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
          Profile updated.
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

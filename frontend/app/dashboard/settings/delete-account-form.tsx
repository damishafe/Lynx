"use client";

import * as React from "react";
import { useActionState } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { deleteAccount, type DeleteState } from "./actions";

const initialState: DeleteState = {};

export function DeleteAccountForm({ email }: { email: string }) {
  const [armed, setArmed] = React.useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="cursor-pointer inline-flex items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 px-5 h-10 text-sm font-medium transition-colors"
      >
        Delete account
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm font-medium text-zinc-700 leading-relaxed">
        This wipes <span className="font-semibold">{email}</span>, every unit
        you&rsquo;ve added, and your full activity history. We can&rsquo;t undo
        it. Type{" "}
        <code className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-xs">
          DELETE
        </code>{" "}
        below to confirm.
      </p>
      <Input
        name="confirmation"
        required
        autoComplete="off"
        autoFocus
        placeholder="Type DELETE to confirm"
      />

      {state.error && (
        <p
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "cursor-pointer inline-flex items-center justify-center rounded-full bg-rose-600 text-white px-5 h-10 text-sm font-semibold transition-all",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_8px_20px_-8px_rgba(244,63,94,0.55)]",
            "hover:bg-rose-700",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {pending ? "Deleting…" : "Yes, delete my account"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="cursor-pointer inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-zinc-700 hover:bg-gray-50 px-5 h-10 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

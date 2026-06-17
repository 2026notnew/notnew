"use client";

import { useActionState, useState } from "react";
import { submitFlag, type FlagState } from "@/lib/actions";

const REASONS: { value: string; label: string }[] = [
  { value: "ALREADY_SOLD", label: "Already sold / expired" },
  { value: "NOT_VINTAGE", label: "Not vintage or collectible" },
  { value: "UNDER_100", label: "Under $100" },
  { value: "WRONG_CATEGORY", label: "Wrong category" },
  { value: "BROKEN_LINK", label: "Broken link" },
  { value: "SPAM", label: "Spam or self-promotion" },
  { value: "OTHER", label: "Something else" },
];

export function FlagButton({
  findId,
  canFlag,
}: {
  findId: string;
  canFlag: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FlagState, FormData>(
    submitFlag,
    null,
  );

  if (state?.ok) {
    return (
      <p className="text-xs text-zinc-500">
        Thanks — a moderator will take a look.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
      >
        Flag this listing
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <input type="hidden" name="findId" value={findId} />
      <p className="text-sm font-medium">Report a problem</p>

      {!canFlag && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          You&apos;ll need to sign in to submit a flag.
        </p>
      )}

      <select
        name="reason"
        required
        defaultValue=""
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="" disabled>
          Choose a reason…
        </option>
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <textarea
        name="notes"
        rows={2}
        placeholder="Anything else we should know? (optional)"
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || !canFlag}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Submitting…" : "Submit flag"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

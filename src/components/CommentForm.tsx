"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type CommentState } from "@/lib/actions";

export function CommentForm({ findId }: { findId: string }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(
    addComment,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="findId" value={findId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Add to the discussion…"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
      {state?.error && (
        <p
          className={`text-sm ${
            state.ok
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {state.error}
        </p>
      )}
      {state?.ok && !state.error && (
        <p className="text-sm text-green-600 dark:text-green-400">Posted.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}

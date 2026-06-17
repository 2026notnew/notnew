"use client";

import { useActionState } from "react";
import { submitFind, type SubmitState } from "@/lib/actions";
import { CATEGORIES, SOURCE_LABELS } from "@/lib/categories";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitFind,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Link to the listing
        <input
          name="url"
          type="url"
          required
          placeholder="https://www.ebay.com/itm/..."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          name="title"
          required
          placeholder="1967 Avalon Ballroom Poster, First Printing"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Why is it notable?
        <textarea
          name="description"
          required
          rows={4}
          placeholder="A short paragraph a collector would care about — what makes this one worth stopping for."
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Category
          <select name="category" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Source site
          <select name="sourceSite" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose…
            </option>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Price (USD)
          <input
            name="price"
            type="number"
            min={100}
            placeholder="100"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Era / decade (optional)
          <input name="eraTag" placeholder="1960s" className={inputClass} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>

      <p className="text-xs text-zinc-500">
        Submissions are reviewed before they appear. NotNew is for vintage and
        collectible items $100 and up — not commodities.
      </p>
    </form>
  );
}

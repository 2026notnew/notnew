"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateFind, type EditState } from "@/lib/actions";
import { CATEGORIES, SOURCE_LABELS } from "@/lib/categories";
import { ImageManager } from "@/components/ImageManager";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export type EditFind = {
  id: string;
  title: string;
  description: string;
  category: string;
  sourceSite: string;
  url: string;
  price: number | null;
  eraTag: string | null;
  location: string | null;
  expiresAt: string | null; // yyyy-mm-dd
  images: string[];
  sourceImages: string[];
};

export function EditFindForm({ find }: { find: EditFind }) {
  const [state, action, pending] = useActionState<EditState, FormData>(
    updateFind,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={find.id} />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Saved.{" "}
          <Link href={`/finds/${find.id}`} className="font-semibold underline">
            View it
          </Link>
          .
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input name="title" defaultValue={find.title} required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          name="description"
          defaultValue={find.description}
          rows={4}
          required
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Link to the listing
        <input name="url" type="url" defaultValue={find.url} required className={inputClass} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Category
          <select name="category" defaultValue={find.category} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Source site
          <select name="sourceSite" defaultValue={find.sourceSite} className={inputClass}>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
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
            defaultValue={find.price ?? ""}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Era / decade
          <input name="eraTag" defaultValue={find.eraTag ?? ""} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Location
          <input
            name="location"
            defaultValue={find.location ?? ""}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Available until
          <input
            name="expiresAt"
            type="date"
            defaultValue={find.expiresAt ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <ImageManager
        name="images"
        label="Hosted photos"
        initial={find.images}
        mode="upload"
        hint="Stored by NotNew — durable. The first is the card hero. Drag order with the arrows."
      />

      <ImageManager
        name="sourceImages"
        label="Source photos (hotlinked)"
        initial={find.sourceImages}
        mode="url"
        hint="Linked from the seller — these vanish when the listing ends."
      />

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href={`/finds/${find.id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

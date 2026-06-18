"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateFind, type EditState } from "@/lib/actions";
import {
  CATEGORIES,
  CATEGORY_BY_VALUE,
  SOURCE_LABELS,
} from "@/lib/categories";
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

  // Live-preview state for the card.
  const [title, setTitle] = useState(find.title);
  const [price, setPrice] = useState(find.price?.toString() ?? "");
  const [location, setLocation] = useState(find.location ?? "");
  const [category, setCategory] = useState(find.category);
  const [sourceSite, setSourceSite] = useState(find.sourceSite);
  const [hero, setHero] = useState(find.images[0] ?? find.sourceImages[0] ?? "");

  const priceLabel = price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(price))
    : "—";
  const categoryLabel =
    CATEGORY_BY_VALUE.get(category as never)?.label ?? category;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,18rem)]">
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
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
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
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Source site
          <select
            name="sourceSite"
            value={sourceSite}
            onChange={(e) => setSourceSite(e.target.value)}
            className={inputClass}
          >
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
        hint="Stored by NotNew — durable. The first is the card hero. Reorder with the arrows."
        onChange={(urls) => setHero(urls[0] ?? find.sourceImages[0] ?? "")}
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

    <aside className="lg:sticky lg:top-20 lg:self-start">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        Live preview
      </p>
      <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {categoryLabel}
          </span>
          <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {title || "Untitled find"}
          </h3>
          <div className="mt-1 flex items-end justify-between text-sm">
            <span className="font-semibold">{priceLabel}</span>
            <span className="text-right text-xs text-zinc-500">
              Seen on {SOURCE_LABELS[sourceSite as keyof typeof SOURCE_LABELS]}
              {location && (
                <span className="mt-0.5 block text-zinc-400">📍 {location}</span>
              )}
            </span>
          </div>
        </div>
      </article>
    </aside>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import {
  submitFind,
  fetchListingMeta,
  type SubmitState,
} from "@/lib/actions";
import { CATEGORIES, SOURCE_LABELS } from "@/lib/categories";
import { ImageUploader } from "@/components/ImageUploader";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitFind,
    null,
  );

  // Controlled so "Fetch from listing" can pre-fill them.
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [sourceImages, setSourceImages] = useState<string[]>([]);

  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState<string | null>(null);

  async function handleFetch() {
    if (!/^https?:\/\//.test(url)) {
      setFetchNote("Enter a valid link first.");
      return;
    }
    setFetching(true);
    setFetchNote(null);
    const res = await fetchListingMeta(url);
    setFetching(false);

    if ("error" in res) {
      setFetchNote(res.error);
      return;
    }
    if (res.title && !title) setTitle(res.title);
    if (res.price != null && !price) setPrice(String(res.price));
    if (res.location && !location) setLocation(res.location);
    if (res.images.length) setSourceImages(res.images);

    const got = [
      res.title && "title",
      res.price != null && "price",
      res.location && "location",
      res.images.length && `${res.images.length} image(s)`,
    ].filter(Boolean);
    setFetchNote(
      got.length
        ? `Pulled ${got.join(", ")}. Review and edit before submitting.`
        : "Couldn't read anything from that page — fill it in manually.",
    );
  }

  function removeSourceImage(u: string) {
    setSourceImages((prev) => prev.filter((x) => x !== u));
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Link to the listing
        <div className="flex gap-2">
          <input
            name="url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.ebay.com/itm/..."
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={fetching}
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {fetching ? "Fetching…" : "Fetch from listing"}
          </button>
        </div>
      </label>
      {fetchNote && <p className="-mt-2 text-xs text-zinc-500">{fetchNote}</p>}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="100"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Era / decade (optional)
          <input name="eraTag" placeholder="1960s" className={inputClass} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Location (optional)
          <input
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Portland, OR"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Available until (optional)
          <input name="expiresAt" type="date" className={inputClass} />
        </label>
      </div>

      {/* Optional uploaded hero — hosted by us, survives after the listing ends. */}
      <ImageUploader />
      <p className="-mt-2 text-xs text-zinc-500">
        Upload a hero image, or skip it — if you fetched photos from the
        listing, we&apos;ll keep a copy of the first one so the card stays put
        after the original listing goes away.
      </p>

      {sourceImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            Images from the listing ({sourceImages.length})
          </span>
          <p className="text-xs text-zinc-500">
            These link straight to the seller&apos;s photos — they&apos;ll
            disappear on their own when the listing ends.
          </p>
          {sourceImages.map((u) => (
            <input key={u} type="hidden" name="sourceImages" value={u} />
          ))}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {sourceImages.map((u) => (
              <div
                key={u}
                className="group relative aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u}
                  alt="From listing"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeSourceImage(u)}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { quickAddFind, type QuickAddState } from "@/lib/actions";
import { CATEGORIES, SOURCE_LABELS } from "@/lib/categories";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function RapidAddForm({ defaultCategory }: { defaultCategory: string }) {
  const [state, action, pending] = useActionState<QuickAddState, FormData>(
    quickAddFind,
    null,
  );

  // Sticky fields persist across entries; per-item fields clear after each add.
  const [category, setCategory] = useState(defaultCategory);
  const [sourceSite, setSourceSite] = useState("OTHER");
  const [eraTag, setEraTag] = useState("");
  const [location, setLocation] = useState("");

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");

  const [added, setAdded] = useState<{ id: string; title: string }[]>([]);
  const lastHandled = useRef<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok && state.id && state.id !== lastHandled.current) {
      lastHandled.current = state.id;
      setAdded((prev) => [{ id: state.id!, title: state.title! }, ...prev]);
      // Clear only the per-item fields; keep sticky ones.
      setTitle("");
      setPrice("");
      setUrl("");
      titleRef.current?.focus();
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        {/* Sticky context — set once, reused for every entry. */}
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Applies to every entry (sticky)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-medium">
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
            <label className="flex flex-col gap-1 text-xs font-medium">
              Source
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
            <label className="flex flex-col gap-1 text-xs font-medium">
              Era
              <input
                name="eraTag"
                value={eraTag}
                onChange={(e) => setEraTag(e.target.value)}
                placeholder="1960s"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Location
              <input
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="optional"
                className={inputClass}
              />
            </label>
          </div>
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium">
          Title
          <input
            ref={titleRef}
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="1967 Avalon Ballroom — Quicksilver, 1st printing"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Price (USD, optional)
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
            Source link (optional)
            <input
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add & next"}
        </button>
        <p className="text-xs text-zinc-500">
          Saved as a draft (not public, not in the review queue). Add photos
          later from Drafts. Tip: after typing the title, press Enter to save and
          jump to the next.
        </p>
      </form>

      {added.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Added this session ({added.length})
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {added.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-1.5 dark:border-zinc-800"
              >
                <span className="truncate">{a.title}</span>
                <Link
                  href={`/admin/finds/${a.id}/edit`}
                  className="shrink-0 text-xs text-zinc-500 hover:underline"
                >
                  add photos / edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

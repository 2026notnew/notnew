import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  createSavedSearch,
  toggleSavedSearch,
  deleteSavedSearch,
  runIngestionNow,
} from "@/lib/actions";
import { CATEGORIES, CATEGORY_BY_VALUE, SOURCE_LABELS } from "@/lib/categories";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ebayAdapter } from "@/lib/ingest/ebay";
import { etsyAdapter } from "@/lib/ingest/etsy";

export const metadata: Metadata = { title: "Sources — NotNew" };

const DAILY_CAP = Number(process.env.INGEST_DAILY_CAP ?? 30);
const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default async function AdminSourcesPage() {
  await requireAdmin();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [searches, ingestedToday] = await Promise.all([
    prisma.savedSearch.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.find.count({
      where: { autoIngested: true, createdAt: { gte: startOfToday } },
    }),
  ]);

  const ebayReady = ebayAdapter.isConfigured();
  const etsyReady = etsyAdapter.isConfigured();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          ← Moderation
        </Link>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Automated Sources
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {ingestedToday} of {DAILY_CAP} auto-imported today. New items land in
          the moderation queue as <strong>pending</strong>.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        <span
          className={`rounded px-2 py-1 font-semibold ${ebayReady ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          eBay {ebayReady ? "connected" : "not configured"}
        </span>
        <span
          className={`rounded px-2 py-1 font-semibold ${etsyReady ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          Etsy {etsyReady ? "connected" : "not configured"}
        </span>
      </div>

      {(!ebayReady || !etsyReady) && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          To enable a source, add its credentials to <code>.env.local</code>:{" "}
          eBay needs <code>EBAY_CLIENT_ID</code> + <code>EBAY_CLIENT_SECRET</code>
          ; Etsy needs <code>ETSY_API_KEY</code>. Searches for unconfigured or
          unsupported sources sit idle.
        </div>
      )}

      <section className="mb-10 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Add a saved search
        </h2>
        <form action={createSavedSearch} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Source
            <select name="source" defaultValue="EBAY" className={inputClass}>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Category
            <select name="category" defaultValue="" className={inputClass} required>
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
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium">
            Query
            <input
              name="query"
              required
              placeholder="vintage concert poster fillmore"
              className={`${inputClass} w-full`}
            />
          </label>
          <label className="flex w-24 flex-col gap-1 text-xs font-medium">
            Min $
            <input
              name="minPrice"
              type="number"
              min={100}
              defaultValue={100}
              className={inputClass}
            />
          </label>
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
            Add
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Saved searches ({searches.length})
          </h2>
          <form action={runIngestionNow}>
            <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Run ingestion now
            </button>
          </form>
        </div>

        {searches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No saved searches yet. Add one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {searches.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    “{s.query}”{" "}
                    {!s.active && (
                      <span className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        paused
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {SOURCE_LABELS[s.source]} ·{" "}
                    {CATEGORY_BY_VALUE.get(s.category)?.label} · min ${s.minPrice}{" "}
                    ·{" "}
                    {s.lastRunAt
                      ? `last run added ${s.lastCount}`
                      : "never run"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleSavedSearch}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                      {s.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteSavedSearch}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton
                      message={`Delete saved search “${s.query}”?`}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

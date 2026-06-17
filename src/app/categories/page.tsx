import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories — NotNew",
  description: "Browse every NotNew vertical.",
};

export default function CategoriesIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight">Categories</h1>
      <p className="mt-1 mb-8 text-zinc-600 dark:text-zinc-400">
        Every NotNew vertical, curated to the same standard.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="group rounded-lg border border-zinc-200 p-5 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
              {c.label}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {c.blurb}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

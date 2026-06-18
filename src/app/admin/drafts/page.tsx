import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin";
import { approveFind, deleteFind } from "@/lib/actions";
import { CATEGORY_BY_VALUE } from "@/lib/categories";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Drafts — NotNew" };

const PAGE_SIZE = 50;

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireStaff();
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const [drafts, total] = await Promise.all([
    prisma.find.findMany({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.find.count({ where: { status: "DRAFT" } }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← Moderation
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Drafts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} catalogued. Add photos, then publish.
          </p>
        </div>
        <Link
          href="/admin/catalog"
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
        >
          + Catalog more
        </Link>
      </header>

      {drafts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No drafts. Catalog some items to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {drafts.map((d) => {
            const noPhoto = d.images.length === 0;
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-zinc-500">
                    {CATEGORY_BY_VALUE.get(d.category)?.label}
                    {d.eraTag && ` · ${d.eraTag}`}
                    {d.price ? ` · $${d.price}` : ""}
                    {noPhoto && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        needs photo
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/finds/${d.id}/edit`}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Edit / photos
                  </Link>
                  <form action={approveFind}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      disabled={noPhoto}
                      title={noPhoto ? "Add a photo before publishing" : ""}
                      className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-40"
                    >
                      Publish
                    </button>
                  </form>
                  <form action={deleteFind}>
                    <input type="hidden" name="id" value={d.id} />
                    <ConfirmButton
                      message={`Delete draft “${d.title}”?`}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/admin/drafts?page=${page - 1}`} className="hover:underline">
              ← Prev
            </Link>
          )}
          <span className="text-zinc-500">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={`/admin/drafts?page=${page + 1}`} className="hover:underline">
              Next →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

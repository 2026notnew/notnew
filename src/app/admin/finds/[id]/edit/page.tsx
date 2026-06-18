import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin";
import { restoreRevision } from "@/lib/actions";
import { EditFindForm } from "./EditFindForm";

function timeAgo(date: Date): string {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const metadata: Metadata = { title: "Edit find — NotNew" };

export default async function EditFindPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const find = await prisma.find.findUnique({ where: { id } });
  if (!find) notFound();

  const revisions = await prisma.findRevision.findMany({
    where: { findId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const expiresAt = find.expiresAt
    ? find.expiresAt.toISOString().slice(0, 10)
    : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        ← Moderation
      </Link>
      <h1 className="mb-1 mt-1 text-3xl font-black tracking-tight">Edit find</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Status: {find.status.toLowerCase()} · changes are live immediately for
        approved finds.
      </p>

      <EditFindForm
        find={{
          id: find.id,
          title: find.title,
          description: find.description,
          category: find.category,
          sourceSite: find.sourceSite,
          url: find.url,
          price: find.price,
          eraTag: find.eraTag,
          location: find.location,
          expiresAt,
          images: find.images,
          sourceImages: find.sourceImages,
        }}
      />

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Edit history
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Restoring brings back that version — and snapshots the current one
          first, so you can always undo the undo.
        </p>

        {revisions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No prior versions yet. Your first save will start the history.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {revisions.map((r) => {
              const snap = r.snapshot as { title?: string };
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <span className="truncate font-medium">
                      {snap.title ?? "(untitled)"}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {timeAgo(r.createdAt)}
                      {r.editorName ? ` · ${r.editorName}` : ""}
                    </span>
                  </div>
                  <form action={restoreRevision}>
                    <input type="hidden" name="revisionId" value={r.id} />
                    <button className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                      Restore
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

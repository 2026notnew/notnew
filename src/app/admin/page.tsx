import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin";
import {
  approveFind,
  rejectFind,
  resolveFlag,
  setFeatured,
  unpublishFind,
  deleteFind,
} from "@/lib/actions";
import { CATEGORY_BY_VALUE, SOURCE_LABELS } from "@/lib/categories";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Moderation — NotNew" };

const FLAG_LABELS: Record<string, string> = {
  ALREADY_SOLD: "Already sold",
  NOT_VINTAGE: "Not vintage",
  UNDER_100: "Under $100",
  SPAM: "Spam",
  WRONG_CATEGORY: "Wrong category",
  BROKEN_LINK: "Broken link",
  OTHER: "Other",
};

export default async function AdminPage() {
  const staff = await requireStaff();

  const [pending, openFlags, published] = await Promise.all([
    prisma.find.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { submittedByUser: { select: { username: true } } },
    }),
    prisma.flag.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: {
        find: { select: { id: true, title: true } },
        user: { select: { username: true } },
      },
    }),
    prisma.find.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { submittedByUser: { select: { username: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Moderation</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Signed in as {staff.username} · {staff.role.toLowerCase()}
          </p>
        </div>
        {staff.role === "ADMIN" && (
          <Link
            href="/admin/users"
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Manage accounts →
          </Link>
        )}
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Pending submissions ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Queue is clear. Nothing waiting for review.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {pending.map((find) => {
              const category = CATEGORY_BY_VALUE.get(find.category);
              return (
                <li
                  key={find.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{find.title}</h3>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {category?.label} · {SOURCE_LABELS[find.sourceSite]} ·{" "}
                        {find.price ? `$${find.price}` : "no price"} · by{" "}
                        {find.submittedByUser.username}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {find.description}
                      </p>
                      <a
                        href={find.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {find.url}
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <form action={approveFind} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={find.id} />
                      <label className="flex items-center gap-1 text-xs text-zinc-500">
                        <input type="checkbox" name="featured" />
                        Feature
                      </label>
                      <button className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500">
                        Approve
                      </button>
                    </form>
                    <form action={rejectFind}>
                      <input type="hidden" name="id" value={find.id} />
                      <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        Reject
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Open flags ({openFlags.length})
        </h2>

        {openFlags.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No open flags.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {openFlags.map((flag) => (
              <li
                key={flag.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="min-w-0 text-sm">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {FLAG_LABELS[flag.reason]}
                  </span>{" "}
                  on{" "}
                  <Link
                    href={`/finds/${flag.find.id}`}
                    className="font-medium hover:underline"
                  >
                    {flag.find.title}
                  </Link>
                  <span className="text-zinc-500"> · by {flag.user.username}</span>
                  {flag.notes && (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                      “{flag.notes}”
                    </p>
                  )}
                </div>
                <form action={resolveFlag}>
                  <input type="hidden" name="id" value={flag.id} />
                  <button className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    Resolve
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Published ({published.length})
        </h2>

        {published.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Nothing published yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {published.map((find) => {
              const category = CATEGORY_BY_VALUE.get(find.category);
              return (
                <li
                  key={find.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/finds/${find.id}`}
                      className="font-medium hover:underline"
                    >
                      {find.title}
                    </Link>
                    {find.featured && (
                      <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-black">
                        Featured
                      </span>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {category?.label} · {SOURCE_LABELS[find.sourceSite]} · ▲{" "}
                      {find.score} · by {find.submittedByUser.username}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setFeatured}>
                      <input type="hidden" name="id" value={find.id} />
                      <input
                        type="hidden"
                        name="featured"
                        value={find.featured ? "false" : "true"}
                      />
                      <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                        {find.featured ? "Unfeature" : "Feature"}
                      </button>
                    </form>
                    <form action={unpublishFind}>
                      <input type="hidden" name="id" value={find.id} />
                      <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                        Unpublish
                      </button>
                    </form>
                    <form action={deleteFind}>
                      <input type="hidden" name="id" value={find.id} />
                      <ConfirmButton
                        message={`Permanently delete “${find.title}”? This removes its comments, votes, flags, and images and cannot be undone.`}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
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
      </section>
    </main>
  );
}

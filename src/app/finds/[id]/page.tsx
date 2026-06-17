import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SignInButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_BY_VALUE, SOURCE_LABELS } from "@/lib/categories";
import { setFeatured, unpublishFind, setAvailability } from "@/lib/actions";
import { effectiveAvailability } from "@/lib/availability";
import { VoteButtons } from "@/components/VoteButtons";
import { CommentForm } from "@/components/CommentForm";
import { FlagButton } from "@/components/FlagButton";

async function getFind(id: string) {
  return prisma.find.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      submittedByUser: { select: { username: true } },
      comments: {
        where: { approved: true, parentId: null },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true } } },
      },
    },
  });
}

function formatPrice(price: number | null): string {
  if (price == null) return "Price on listing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const find = await getFind(id);
  if (!find) return { title: "Not found — NotNew" };
  return { title: `${find.title} — NotNew`, description: find.description };
}

export default async function FindDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const find = await getFind(id);
  if (!find) notFound();

  const user = await getCurrentUser();
  const myVote = user
    ? await prisma.vote.findUnique({
        where: { findId_userId: { findId: find.id, userId: user.id } },
        select: { value: true },
      })
    : null;

  const category = CATEGORY_BY_VALUE.get(find.category);
  const cover = find.images[0];
  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const avail = effectiveAvailability(find);
  const unavailable = avail !== "AVAILABLE";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 text-sm text-zinc-500">
        {category && (
          <Link href={`/categories/${category.slug}`} className="hover:underline">
            {category.label}
          </Link>
        )}
        {find.eraTag && <span> · {find.eraTag}</span>}
      </div>

      <h1 className="text-3xl font-black tracking-tight">{find.title}</h1>

      {unavailable && (
        <div className="mt-3 rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {avail === "SOLD"
            ? "Too late — this item has sold."
            : "This item is no longer available."}{" "}
          <span className="font-normal opacity-80">
            We keep the listing here as a record.
          </span>
        </div>
      )}

      {isStaff && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="font-semibold text-zinc-500">Staff:</span>
          <form action={setFeatured}>
            <input type="hidden" name="id" value={find.id} />
            <input
              type="hidden"
              name="featured"
              value={find.featured ? "false" : "true"}
            />
            <button className="rounded border border-zinc-300 px-2 py-1 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              {find.featured ? "Unfeature" : "Feature"}
            </button>
          </form>
          <form action={unpublishFind}>
            <input type="hidden" name="id" value={find.id} />
            <button className="rounded border border-zinc-300 px-2 py-1 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Unpublish
            </button>
          </form>

          <span className="mx-1 text-zinc-300 dark:text-zinc-700">|</span>

          {find.availability !== "SOLD" && (
            <form action={setAvailability}>
              <input type="hidden" name="id" value={find.id} />
              <input type="hidden" name="availability" value="SOLD" />
              <button className="rounded border border-zinc-300 px-2 py-1 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Mark sold
              </button>
            </form>
          )}
          {find.availability !== "EXPIRED" && (
            <form action={setAvailability}>
              <input type="hidden" name="id" value={find.id} />
              <input type="hidden" name="availability" value="EXPIRED" />
              <button className="rounded border border-zinc-300 px-2 py-1 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Mark unavailable
              </button>
            </form>
          )}
          {find.availability !== "AVAILABLE" && (
            <form action={setAvailability}>
              <input type="hidden" name="id" value={find.id} />
              <input type="hidden" name="availability" value="AVAILABLE" />
              <button className="rounded border border-zinc-300 px-2 py-1 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Mark available
              </button>
            </form>
          )}

          <Link
            href="/admin"
            className="text-zinc-500 underline-offset-2 hover:underline"
          >
            Open moderation →
          </Link>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={find.title} className="w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center text-zinc-400">
            No image yet
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold">{formatPrice(find.price)}</p>
          <p className="mb-2 text-sm text-zinc-500">
            Seen on {SOURCE_LABELS[find.sourceSite]}
            {find.location && <> · 📍 {find.location}</>} · submitted by{" "}
            {find.submittedByUser.username}
          </p>
          <VoteButtons
            findId={find.id}
            initialScore={find.score}
            initialUserVote={myVote?.value ?? 0}
            canVote={!!user}
          />
        </div>
        <a
          href={find.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          View original listing →
        </a>
      </div>

      <p className="mt-6 whitespace-pre-line leading-relaxed text-zinc-700 dark:text-zinc-300">
        {find.description}
      </p>

      <div className="mt-6">
        <FlagButton findId={find.id} canFlag={!!user} />
      </div>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-4 text-lg font-bold">
          Discussion ({find.comments.length})
        </h2>

        <div className="mb-6">
          {user ? (
            <CommentForm findId={find.id} />
          ) : (
            <SignInButton mode="modal">
              <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Sign in to comment
              </button>
            </SignInButton>
          )}
        </div>

        {find.comments.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No comments yet. Be the first.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {find.comments.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="text-sm font-semibold">{c.user.username}</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

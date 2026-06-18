import Link from "next/link";
import { CATEGORY_BY_VALUE, SOURCE_LABELS } from "@/lib/categories";
import { effectiveAvailability } from "@/lib/availability";
import type { FindCardData } from "@/lib/queries";

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function FindCard({ find, featured = false }: { find: FindCardData; featured?: boolean }) {
  const category = CATEGORY_BY_VALUE.get(find.category);
  const cover = find.images[0] ?? find.sourceImages[0];
  const avail = effectiveAvailability(find);
  const unavailable = avail !== "AVAILABLE";

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 ${
        featured ? "sm:col-span-2 sm:row-span-2" : ""
      }`}
    >
      <Link href={`/finds/${find.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {cover ? (
            // Sources vary widely; cached S3/CloudFront images render via next/image elsewhere.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={find.title}
              className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
                unavailable ? "opacity-50 grayscale" : ""
              }`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <span className="text-sm">No image</span>
            </div>
          )}
          {find.featured && !unavailable && (
            <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-black">
              Staff Pick
            </span>
          )}
          {unavailable && (
            <span className="absolute left-2 top-2 rounded bg-zinc-900/85 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              {avail === "SOLD" ? "Too Late" : "No longer available"}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {category && (
            <Link
              href={`/categories/${category.slug}`}
              className="font-medium uppercase tracking-wide hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {category.label}
            </Link>
          )}
          {find.eraTag && <span>· {find.eraTag}</span>}
        </div>

        <Link href={`/finds/${find.id}`}>
          <h3
            className={`font-semibold leading-snug text-zinc-900 group-hover:underline dark:text-zinc-50 ${
              featured ? "text-xl" : "text-base"
            }`}
          >
            {find.title}
          </h3>
        </Link>

        {featured && (
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
            {find.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatPrice(find.price)}
          </span>
          <span className="text-right text-xs text-zinc-500">
            Seen on {SOURCE_LABELS[find.sourceSite]} on{" "}
            {formatDate(find.createdAt)}
            {find.location && (
              <span className="mt-0.5 block text-zinc-400">📍 {find.location}</span>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

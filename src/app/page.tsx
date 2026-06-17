import Link from "next/link";
import { FindCard } from "@/components/FindCard";
import { getFeaturedFinds, getHotFinds } from "@/lib/queries";

export default async function Home() {
  const [featured, hot] = await Promise.all([
    getFeaturedFinds(4),
    getHotFinds(24),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Things worth stopping for.
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          A curated feed of vintage and collectible finds from across the web —
          chosen because a knowledgeable collector would look twice.
        </p>
      </section>

      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
            Featured
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((find, i) => (
              <FindCard key={find.id} find={find} featured={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Hot Finds
          </h2>
          <Link
            href="/categories"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Browse all categories →
          </Link>
        </div>

        {hot.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-20 text-center text-zinc-500 dark:border-zinc-700">
            No finds yet. Be the first to{" "}
            <Link href="/submit" className="font-semibold underline">
              submit one
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hot.map((find) => (
              <FindCard key={find.id} find={find} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FindCard } from "@/components/FindCard";
import { getFindsByCategory } from "@/lib/queries";
import { CATEGORY_BY_SLUG } from "@/lib/categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug);
  if (!category) return { title: "Not found — NotNew" };
  return {
    title: `${category.label} — NotNew`,
    description: category.blurb,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug);
  if (!category) notFound();

  const finds = await getFindsByCategory(category.value);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">{category.label}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{category.blurb}</p>
      </header>

      {finds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-20 text-center text-zinc-500 dark:border-zinc-700">
          No finds in {category.label} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {finds.map((find) => (
            <FindCard key={find.id} find={find} />
          ))}
        </div>
      )}
    </main>
  );
}

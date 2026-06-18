import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin";
import { CATEGORIES } from "@/lib/categories";
import { RapidAddForm } from "./RapidAddForm";

export const metadata: Metadata = { title: "Catalog — NotNew" };

export default async function CatalogPage() {
  await requireStaff();
  const draftCount = await prisma.find.count({ where: { status: "DRAFT" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
            ← Moderation
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Catalog</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Rapidly enter items as drafts. Photos and final polish come later.
          </p>
        </div>
        <Link
          href="/admin/drafts"
          className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Drafts ({draftCount}) →
        </Link>
      </header>

      <RapidAddForm defaultCategory={CATEGORIES[0].value} />
    </main>
  );
}

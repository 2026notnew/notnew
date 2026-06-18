import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin";
import { EditFindForm } from "./EditFindForm";

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
    </main>
  );
}

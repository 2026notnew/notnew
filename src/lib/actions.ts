"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireStaff } from "@/lib/admin";
import { CATEGORIES } from "@/lib/categories";
import type { Category, SourceSite } from "@prisma/client";

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.value));
const VALID_SOURCES = new Set<SourceSite>([
  "EBAY",
  "ETSY",
  "CRAIGSLIST",
  "FACEBOOK",
  "HAMB",
  "GARAGE_JOURNAL",
  "OTHER",
]);

export type SubmitState = { error?: string } | null;

export async function submitFind(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in to submit a find." };

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const sourceSite = String(formData.get("sourceSite") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const eraTag = String(formData.get("eraTag") ?? "").trim() || null;

  if (!url || !/^https?:\/\//.test(url))
    return { error: "Enter a valid link starting with http(s)://" };
  if (title.length < 4) return { error: "Give it a real title." };
  if (description.length < 20)
    return { error: "Add a sentence or two on why it's notable (20+ chars)." };
  if (!VALID_CATEGORIES.has(category))
    return { error: "Pick a category." };
  if (!VALID_SOURCES.has(sourceSite as SourceSite))
    return { error: "Pick a source site." };

  const price = priceRaw ? Number(priceRaw) : null;
  if (price !== null && (Number.isNaN(price) || price < 100))
    return { error: "NotNew is for items $100 and up." };

  // Dedup on exact URL.
  const dupe = await prisma.find.findFirst({ where: { url } });
  if (dupe) return { error: "That link has already been submitted." };

  await prisma.find.create({
    data: {
      url,
      title,
      description,
      category: category as Category,
      sourceSite: sourceSite as SourceSite,
      price,
      eraTag,
      images: [],
      status: "PENDING",
      submittedBy: user.id,
    },
  });

  revalidatePath("/");
  redirect("/submit?submitted=1");
}

// --- Moderation (staff only) ---

export async function approveFind(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "on";
  if (!id) return;

  await prisma.find.update({
    where: { id },
    data: { status: "APPROVED", featured },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectFind(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.find.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin");
}

export async function resolveFlag(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.flag.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/admin");
}

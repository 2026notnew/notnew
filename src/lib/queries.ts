import { prisma } from "@/lib/prisma";
import type { Category } from "@prisma/client";

// Hot score: net score decayed by age. Recent + well-voted floats up.
// We sort approximately in SQL by (score, createdAt); true decay is applied
// in-memory for the small front-page set.
function hotScore(score: number, createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / 36e5;
  return score / Math.pow(ageHours + 2, 0.6);
}

const findCardSelect = {
  id: true,
  url: true,
  title: true,
  description: true,
  price: true,
  sourceSite: true,
  images: true,
  category: true,
  eraTag: true,
  featured: true,
  score: true,
  createdAt: true,
} as const;

export async function getFeaturedFinds(limit = 4) {
  return prisma.find.findMany({
    where: { status: "APPROVED", featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: findCardSelect,
  });
}

export async function getHotFinds(limit = 24) {
  const finds = await prisma.find.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: limit * 2,
    select: findCardSelect,
  });
  return finds
    .sort((a, b) => hotScore(b.score, b.createdAt) - hotScore(a.score, a.createdAt))
    .slice(0, limit);
}

export async function getFindsByCategory(category: Category, limit = 48) {
  return prisma.find.findMany({
    where: { status: "APPROVED", category },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: findCardSelect,
  });
}

export type FindCardData = Awaited<ReturnType<typeof getHotFinds>>[number];

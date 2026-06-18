import { prisma } from "@/lib/prisma";
import { cacheExternalImage } from "@/lib/s3";
import { ebayAdapter } from "./ebay";
import { etsyAdapter } from "./etsy";
import { craigslistAdapter } from "./craigslist";
import type { Candidate, SourceAdapter } from "./types";
import type { SourceSite } from "@prisma/client";

const ADAPTERS: Partial<Record<SourceSite, SourceAdapter>> = {
  EBAY: ebayAdapter,
  ETSY: etsyAdapter,
  CRAIGSLIST: craigslistAdapter,
};

const DAILY_CAP = Number(process.env.INGEST_DAILY_CAP ?? 30);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** A system account that owns auto-ingested finds. */
async function ingestBotId(): Promise<string> {
  const bot = await prisma.user.upsert({
    where: { username: "notnew-bot" },
    update: {},
    create: {
      clerkId: "system_ingest",
      email: "bot@notnew.com",
      username: "notnew-bot",
      role: "ADMIN",
    },
  });
  return bot.id;
}

export type IngestResult = {
  added: number;
  skipped: number;
  capReached: boolean;
  perSearch: { query: string; source: SourceSite; added: number }[];
};

export async function runIngestion(): Promise<IngestResult> {
  const result: IngestResult = {
    added: 0,
    skipped: 0,
    capReached: false,
    perSearch: [],
  };

  const usedToday = await prisma.find.count({
    where: { autoIngested: true, createdAt: { gte: startOfToday() } },
  });
  let remaining = Math.max(0, DAILY_CAP - usedToday);
  if (remaining === 0) {
    result.capReached = true;
    return result;
  }

  const searches = await prisma.savedSearch.findMany({ where: { active: true } });
  const botId = await ingestBotId();

  for (const s of searches) {
    if (remaining === 0) {
      result.capReached = true;
      break;
    }
    const adapter = ADAPTERS[s.source];
    if (!adapter || !adapter.isConfigured()) continue;

    let candidates: Candidate[] = [];
    try {
      candidates = await adapter.search({
        query: s.query,
        minPrice: s.minPrice,
        limit: Math.min(remaining, 25),
        region: s.region,
      });
    } catch {
      continue;
    }

    // Dedup against existing finds by external id or url.
    const ids = candidates.map((c) => c.externalId);
    const urls = candidates.map((c) => c.url);
    const existing = await prisma.find.findMany({
      where: { OR: [{ externalId: { in: ids } }, { url: { in: urls } }] },
      select: { externalId: true, url: true },
    });
    const seen = new Set([
      ...existing.map((e) => e.externalId).filter(Boolean),
      ...existing.map((e) => e.url),
    ]);

    let addedHere = 0;
    for (const c of candidates) {
      if (remaining === 0) {
        result.capReached = true;
        break;
      }
      if (seen.has(c.externalId) || seen.has(c.url)) {
        result.skipped++;
        continue;
      }
      if (c.price !== null && c.price < s.minPrice) {
        result.skipped++;
        continue;
      }

      const hero = c.imageUrl ? await cacheExternalImage(c.imageUrl) : null;

      await prisma.find.create({
        data: {
          url: c.url,
          title: c.title.slice(0, 200),
          description: `Auto-imported from ${s.source}. A curator will review before it appears.`,
          category: s.category,
          sourceSite: s.source,
          price: c.price,
          location: c.location,
          images: hero ? [hero] : [],
          sourceImages: c.sourceImages,
          externalId: c.externalId,
          autoIngested: true,
          status: "PENDING",
          submittedBy: botId,
        },
      });

      seen.add(c.externalId);
      seen.add(c.url);
      remaining--;
      addedHere++;
      result.added++;
    }

    await prisma.savedSearch.update({
      where: { id: s.id },
      data: { lastRunAt: new Date(), lastCount: addedHere },
    });
    result.perSearch.push({ query: s.query, source: s.source, added: addedHere });
  }

  return result;
}

import type { Candidate, SearchParams, SourceAdapter } from "./types";

// Etsy Open API v3 — public listing search uses just the app keystring.
const SEARCH_URL = "https://openapi.etsy.com/v3/application/listings/active";

type EtsyImage = { url_fullxfull?: string; url_570xN?: string };
type EtsyListing = {
  listing_id: number;
  title?: string;
  url?: string;
  price?: { amount?: number; divisor?: number };
  images?: EtsyImage[];
};

function priceOf(l: EtsyListing): number | null {
  const a = l.price?.amount;
  const d = l.price?.divisor;
  if (typeof a === "number" && typeof d === "number" && d > 0) {
    return Math.round((a / d) * 100) / 100;
  }
  return null;
}

function imageUrls(l: EtsyListing): string[] {
  return (l.images ?? [])
    .map((i) => i.url_fullxfull ?? i.url_570xN)
    .filter((u): u is string => !!u);
}

export const etsyAdapter: SourceAdapter = {
  source: "ETSY",

  isConfigured() {
    return !!process.env.ETSY_API_KEY;
  },

  async search({ query, minPrice, limit }: SearchParams): Promise<Candidate[]> {
    const key = process.env.ETSY_API_KEY;
    if (!key) return [];

    const url = new URL(SEARCH_URL);
    url.searchParams.set("keywords", query);
    url.searchParams.set("min_price", String(minPrice));
    url.searchParams.set("limit", String(Math.min(limit, 50)));
    url.searchParams.set("includes", "Images");

    const res = await fetch(url, { headers: { "x-api-key": key } });
    if (!res.ok) return [];

    const data = (await res.json()) as { results?: EtsyListing[] };
    const listings = data.results ?? [];

    return listings
      .filter((l) => l.listing_id && l.url && l.title)
      .map((l) => {
        const imgs = imageUrls(l);
        return {
          externalId: `etsy:${l.listing_id}`,
          url: l.url!,
          title: l.title!,
          price: priceOf(l),
          location: null, // Etsy listings don't expose a reliable location
          imageUrl: imgs[0] ?? null,
          sourceImages: imgs.slice(1, 12),
        };
      });
  },
};

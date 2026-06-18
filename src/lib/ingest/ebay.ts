import type { Candidate, SearchParams, SourceAdapter } from "./types";

const OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

type EbayItem = {
  itemId: string;
  title?: string;
  itemWebUrl?: string;
  price?: { value?: string };
  image?: { imageUrl?: string };
  additionalImages?: { imageUrl?: string }[];
  itemLocation?: { city?: string; stateOrProvince?: string; country?: string };
};

function locationOf(item: EbayItem): string | null {
  const l = item.itemLocation;
  if (!l) return null;
  const parts = [l.city, l.stateOrProvince, l.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export const ebayAdapter: SourceAdapter = {
  source: "EBAY",

  isConfigured() {
    return !!process.env.EBAY_CLIENT_ID && !!process.env.EBAY_CLIENT_SECRET;
  },

  async search({ query, minPrice, limit }: SearchParams): Promise<Candidate[]> {
    const token = await getToken();
    if (!token) return [];

    const url = new URL(SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(Math.min(limit, 50)));
    url.searchParams.set(
      "filter",
      `price:[${minPrice}..],priceCurrency:USD,buyingOptions:{FIXED_PRICE|AUCTION}`,
    );

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { itemSummaries?: EbayItem[] };
    const items = data.itemSummaries ?? [];

    return items
      .filter((i) => i.itemId && i.itemWebUrl && i.title)
      .map((i) => ({
        externalId: i.itemId,
        url: i.itemWebUrl!,
        title: i.title!,
        price: i.price?.value ? Number(i.price.value) : null,
        location: locationOf(i),
        imageUrl: i.image?.imageUrl ?? null,
        sourceImages: (i.additionalImages ?? [])
          .map((a) => a.imageUrl)
          .filter((u): u is string => !!u)
          .slice(0, 11),
      }));
  },
};

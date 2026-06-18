import type { Candidate, SearchParams, SourceAdapter } from "./types";

// Craigslist has no API, but every search publishes an RSS feed. That's a
// supported, public format — far more stable than scraping the HTML. It's
// regional, so each saved search needs a site subdomain (e.g. "sfbay").

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : null;
}

function parseItems(xml: string): {
  link: string;
  title: string;
  image: string | null;
}[] {
  const out: { link: string; title: string; image: string | null }[] = [];
  for (const m of xml.matchAll(/<item[\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const about = block.match(/<item[^>]*rdf:about=["']([^"']+)["']/i)?.[1];
    const link = about ?? tag(block, "link");
    const title = tag(block, "title");
    const image =
      block.match(/<enc:enclosure[^>]*rdf:resource=["']([^"']+)["']/i)?.[1] ??
      block.match(/<enclosure[^>]*url=["']([^"']+)["']/i)?.[1] ??
      null;
    if (link && title) out.push({ link, title, image });
  }
  return out;
}

function parsePrice(title: string): number | null {
  const m = title.match(/\$\s?([\d,]+)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function parseLocation(title: string): string | null {
  // CL titles often end with "(neighborhood)".
  const m = title.match(/\(([^)]+)\)\s*$/);
  return m ? m[1].trim() : null;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\$\s?[\d,]+\s*$/, "")
    .replace(/\s*\([^)]+\)\s*$/, "")
    .trim();
}

export const craigslistAdapter: SourceAdapter = {
  source: "CRAIGSLIST",

  // No credentials needed; each search supplies its own region instead.
  isConfigured() {
    return true;
  },

  async search({
    query,
    minPrice,
    limit,
    region,
  }: SearchParams): Promise<Candidate[]> {
    if (!region) return []; // Craigslist searches must specify a site

    const site = region.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!site) return [];

    const url = new URL(`https://${site}.craigslist.org/search/sss`);
    url.searchParams.set("format", "rss");
    url.searchParams.set("query", query);
    if (minPrice > 0) url.searchParams.set("min_price", String(minPrice));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "NotNewBot/1.0 (+https://notnew.com)",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });
      if (!res.ok) return [];
      const xml = await res.text();

      return parseItems(xml)
        .slice(0, Math.min(limit, 50))
        .map(({ link, title, image }) => {
          const price = parsePrice(title);
          return {
            externalId: link,
            url: link,
            title: cleanTitle(title) || title,
            price,
            location: parseLocation(title),
            imageUrl: image,
            sourceImages: image ? [image] : [],
          };
        })
        .filter((c) => c.price === null || c.price >= minPrice);
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  },
};

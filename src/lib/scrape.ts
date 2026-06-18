/**
 * Best-effort location extraction from a listing URL. Sites vary wildly and
 * some (Facebook, Craigslist) block bots, so this often returns null — it's a
 * convenience fallback, never a guarantee. Never throws.
 */

// Block obvious internal/loopback targets to avoid SSRF against local services.
function isSafePublicUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return null;
  }
  return u;
}

function clean(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .trim()
    .slice(0, 120);
}

function fromJsonLd(html: string): string | null {
  const blocks = html.match(
    /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!blocks) return null;
  for (const block of blocks) {
    const json = block.replace(/<\/?script[^>]*>/gi, "");
    try {
      const data = JSON.parse(json);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const addr = node?.address ?? node?.availableAtOrFrom?.address;
        if (typeof addr === "string") return clean(addr);
        if (addr && typeof addr === "object") {
          const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
            .filter(Boolean)
            .join(", ");
          if (parts) return clean(parts);
        }
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return null;
}

function fromMeta(html: string): string | null {
  const locality = html.match(
    /<meta[^>]+(?:og:locality|business:contact_data:locality)[^>]+content=["']([^"']+)["']/i,
  );
  const region = html.match(
    /<meta[^>]+(?:og:region|business:contact_data:region)[^>]+content=["']([^"']+)["']/i,
  );
  if (locality) {
    return clean([locality[1], region?.[1]].filter(Boolean).join(", "));
  }
  return null;
}

function fromText(html: string): string | null {
  // eBay and similar render "Item location:" near the place.
  const patterns = [
    /Item location:[\s<>\/a-z"'=-]*?>\s*([A-Za-z][A-Za-z .,'-]{2,60})/i,
    /Located in[:\s]+([A-Z][A-Za-z .,'-]{2,60})/,
    /Ships? from[:\s]+([A-Z][A-Za-z .,'-]{2,60})/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return clean(m[1]);
  }
  return null;
}

function titleFromHtml(html: string): string | null {
  const og = html.match(
    /<meta[^>]+og:title[^>]+content=["']([^"']+)["']/i,
  );
  if (og) return clean(og[1]);
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return t ? clean(t[1]) : null;
}

function priceFromHtml(html: string): number | null {
  const candidates = [
    /<meta[^>]+(?:og:price:amount|product:price:amount)[^>]+content=["']([\d.,]+)["']/i,
    /"price"\s*:\s*"?([\d.,]+)"?/i,
    /itemprop=["']price["'][^>]+content=["']([\d.,]+)["']/i,
  ];
  for (const re of candidates) {
    const m = html.match(re);
    if (m) {
      const n = Number(m[1].replace(/,/g, ""));
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

function imagesFromHtml(html: string, base: URL): string[] {
  const urls = new Set<string>();
  // OpenGraph images first (usually the best hero candidates).
  for (const m of html.matchAll(
    /<meta[^>]+og:image(?::secure_url)?[^>]+content=["']([^"']+)["']/gi,
  )) {
    urls.add(m[1]);
  }
  // JSON-LD image fields.
  for (const m of html.matchAll(/"image"\s*:\s*"([^"]+)"/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/"contentUrl"\s*:\s*"([^"]+)"/gi)) urls.add(m[1]);

  return Array.from(urls)
    .map((u) => {
      try {
        return new URL(u, base).toString();
      } catch {
        return null;
      }
    })
    .filter((u): u is string => !!u && /^https?:\/\//.test(u))
    .slice(0, 12);
}

export type ListingMeta = {
  title: string | null;
  price: number | null;
  location: string | null;
  images: string[];
};

/** Fetch a listing once and pull whatever metadata we can. Never throws. */
export async function extractListing(rawUrl: string): Promise<ListingMeta> {
  const empty: ListingMeta = {
    title: null,
    price: null,
    location: null,
    images: [],
  };
  const url = isSafePublicUrl(rawUrl);
  if (!url) return empty;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NotNewBot/1.0; +https://notnew.com)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return empty;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return empty;

    const html = (await res.text()).slice(0, 500_000);
    return {
      title: titleFromHtml(html),
      price: priceFromHtml(html),
      location: fromJsonLd(html) ?? fromMeta(html) ?? fromText(html),
      images: imagesFromHtml(html, url),
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timeout);
  }
}

/** Back-compat helper used by submit fallback. */
export async function extractLocation(rawUrl: string): Promise<string | null> {
  return (await extractListing(rawUrl)).location;
}

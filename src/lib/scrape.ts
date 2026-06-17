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

export async function extractLocation(rawUrl: string): Promise<string | null> {
  const url = isSafePublicUrl(rawUrl);
  if (!url) return null;

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
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;

    // Cap how much we read — listings put metadata near the top anyway.
    const html = (await res.text()).slice(0, 500_000);
    return fromJsonLd(html) ?? fromMeta(html) ?? fromText(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

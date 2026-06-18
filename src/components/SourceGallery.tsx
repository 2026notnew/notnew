"use client";

import { useState } from "react";

/**
 * Renders hotlinked images from the source listing. Any image that fails to
 * load (e.g. the ad was taken down) is silently dropped, so the gallery
 * gracefully shrinks to nothing as the listing dies.
 */
export function SourceGallery({ images }: { images: string[] }) {
  const [dead, setDead] = useState<Set<string>>(new Set());
  const live = images.filter((u) => !dead.has(u));

  if (live.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
        From the listing
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {live.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={u}
            src={u}
            alt="From the original listing"
            loading="lazy"
            onError={() => setDead((prev) => new Set(prev).add(u))}
            className="aspect-square w-full rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Photos hosted by the original seller — they may disappear when the
        listing ends.
      </p>
    </section>
  );
}

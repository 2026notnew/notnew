"use client";

import { useState } from "react";
import { requestUploadUrl } from "@/lib/actions";

type Uploaded = { url: string; name: string };

export function ImageUploader() {
  const [images, setImages] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);

    try {
      for (const file of Array.from(files).slice(0, 12 - images.length)) {
        const res = await requestUploadUrl(file.type);
        if ("error" in res) {
          setError(res.error);
          continue;
        }
        const put = await fetch(res.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) {
          setError("Upload failed. Try again.");
          continue;
        }
        setImages((prev) => [...prev, { url: res.publicUrl, name: file.name }]);
      }
    } finally {
      setBusy(false);
    }
  }

  function remove(url: string) {
    setImages((prev) => prev.filter((i) => i.url !== url));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Photos (optional)</span>

      {images.map((img) => (
        <input key={img.url} type="hidden" name="images" value={img.url} />
      ))}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.url}
              className="group relative aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(img.url)}
                className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < 12 && (
        <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 hover:border-zinc-500 dark:border-zinc-700">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          {busy ? "Uploading…" : "Click to add photos"}
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { requestUploadUrl } from "@/lib/actions";

/**
 * Manages a set of image URLs for a form field. In "upload" mode it uploads
 * files to S3 (durable images); in "url" mode it adds hotlinked URLs (source
 * images). Emits one hidden input per URL under `name`.
 */
export function ImageManager({
  name,
  label,
  initial,
  mode,
  hint,
  onChange,
}: {
  name: string;
  label: string;
  initial: string[];
  mode: "upload" | "url";
  hint?: string;
  onChange?: (urls: string[]) => void;
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    onChange?.(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, 12 - urls.length)) {
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
        setUrls((prev) => [...prev, res.publicUrl]);
      }
    } finally {
      setBusy(false);
    }
  }

  function addUrl() {
    const u = draft.trim();
    if (!/^https?:\/\//.test(u)) {
      setError("Enter a valid image URL.");
      return;
    }
    setUrls((prev) => (prev.includes(u) ? prev : [...prev, u]));
    setDraft("");
    setError(null);
  }

  function move(u: string, dir: -1 | 1) {
    setUrls((prev) => {
      const i = prev.indexOf(u);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function remove(u: string) {
    setUrls((prev) => prev.filter((x) => x !== u));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {hint && <p className="-mt-1 text-xs text-zinc-500">{hint}</p>}

      {urls.map((u) => (
        <input key={u} type="hidden" name={name} value={u} />
      ))}

      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((u, i) => (
            <div
              key={u}
              className="group relative aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] font-semibold text-white">
                  Hero
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(u, -1)}
                  className="text-xs text-white disabled:opacity-30"
                  disabled={i === 0}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => remove(u)}
                  className="text-xs text-white"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => move(u, 1)}
                  className="text-xs text-white disabled:opacity-30"
                  disabled={i === urls.length - 1}
                >
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "upload"
        ? urls.length < 12 && (
            <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-300 px-4 py-4 text-sm text-zinc-500 hover:border-zinc-500 dark:border-zinc-700">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={busy}
                onChange={(e) => onFiles(e.target.files)}
                className="hidden"
              />
              {busy ? "Uploading…" : "Upload image(s)"}
            </label>
          )
        : urls.length < 12 && (
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="https://…/photo.jpg"
                className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={addUrl}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Add
              </button>
            </div>
          )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

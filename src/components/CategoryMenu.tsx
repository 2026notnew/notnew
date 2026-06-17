"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Categories
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {c.label}
              </span>
            </Link>
          ))}
          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
          <Link
            href="/categories"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Browse all →
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "notnew-cookie-ack";

export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // localStorage only exists on the client, so we read it after mount.
    // Setting state here is intentional and avoids an SSR hydration mismatch.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      // localStorage unavailable (private mode) — just don't show.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-black/95">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-3 text-sm sm:flex-row sm:justify-between">
        <p className="text-zinc-600 dark:text-zinc-400">
          NotNew uses only the cookies needed to keep you signed in and run the
          site. We don&apos;t use advertising or tracking cookies. See our{" "}
          <a href="/privacy" className="font-medium underline">
            Privacy Policy
          </a>
          .
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

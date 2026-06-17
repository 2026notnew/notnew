"use client";

import { useState, useTransition } from "react";
import { voteOnFind } from "@/lib/actions";

export function VoteButtons({
  findId,
  initialScore,
  initialUserVote = 0,
  canVote,
}: {
  findId: string;
  initialScore: number;
  initialUserVote?: number;
  canVote: boolean;
}) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cast(value: 1 | -1) {
    if (!canVote) {
      setError("Sign in to vote.");
      return;
    }
    // Optimistic: compute the delta locally.
    const prevVote = userVote;
    const nextVote = prevVote === value ? 0 : value;
    setUserVote(nextVote);
    setScore((s) => s - prevVote + nextVote);
    setError(null);

    startTransition(async () => {
      const res = await voteOnFind(findId, value);
      if ("error" in res) {
        // Roll back on failure.
        setUserVote(prevVote);
        setScore((s) => s - nextVote + prevVote);
        setError(res.error);
      } else {
        setScore(res.score);
        setUserVote(res.userVote);
      }
    });
  }

  const base =
    "flex h-8 w-8 items-center justify-center rounded-md border text-sm transition disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Upvote"
        disabled={pending}
        onClick={() => cast(1)}
        className={`${base} ${
          userVote === 1
            ? "border-green-500 bg-green-500 text-white"
            : "border-zinc-300 hover:border-green-500 dark:border-zinc-700"
        }`}
      >
        ▲
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
        {score}
      </span>
      <button
        aria-label="Downvote"
        disabled={pending}
        onClick={() => cast(-1)}
        className={`${base} ${
          userVote === -1
            ? "border-red-500 bg-red-500 text-white"
            : "border-zinc-300 hover:border-red-500 dark:border-zinc-700"
        }`}
      >
        ▼
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

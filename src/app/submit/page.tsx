import type { Metadata } from "next";
import { SignInButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Submit a Find — NotNew",
};

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-black tracking-tight">Submit a Find</h1>
        <p className="mt-1 mb-8 text-zinc-600 dark:text-zinc-400">
          You need an account to submit. It takes a few seconds.
        </p>
        <SignInButton mode="modal">
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Sign in to submit
          </button>
        </SignInButton>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Submit a Find</h1>
      <p className="mt-1 mb-8 text-zinc-600 dark:text-zinc-400">
        Found something worth stopping for? Share the link and tell us why.
      </p>

      {submitted ? (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-6 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <p className="font-semibold">Thanks — your find is in the queue.</p>
          <p className="mt-1 text-sm">
            A curator will review it shortly. Submit another whenever you like.
          </p>
        </div>
      ) : (
        <SubmitForm />
      )}
    </main>
  );
}

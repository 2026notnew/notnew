import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — NotNew",
  description:
    "NotNew is a curated home for vintage and collectible items worth stopping for.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">About NotNew</h1>

      <div className="mt-8 flex flex-col gap-4 text-zinc-700 dark:text-zinc-300">
        <p>
          NotNew is a curated home for vintage and collectible items worth
          stopping for. Not the new, not the mass-produced, not the disposable —
          the things with a story, a maker, and a reason to last.
        </p>
        <p>
          The web is full of places to buy and sell. Almost none of them have
          taste. NotNew is built on a simple belief: a knowledgeable eye is worth
          more than an infinite search box. Every find here is reviewed before it
          appears, voted on by people who actually know the category, and held to
          one standard — would a collector look twice?
        </p>
        <p>
          We start where the good stuff already lives: rock posters, automotive
          and petroliana, garage and tools, motorcycles, and watches. Listings
          link out to where the item is sold today; NotNew is the place that
          tells you it&apos;s worth your attention.
        </p>
        <p>
          This is the beginning. The long-term goal is a marketplace with a
          higher bar — no garbage, no commodities, only things that earned their
          place. If that sounds like your kind of corner of the internet,{" "}
          <a href="/submit" className="font-semibold underline">
            submit a find
          </a>{" "}
          and help us build it.
        </p>
      </div>

      <p className="mt-10 text-sm text-zinc-500">
        Questions or partnerships: [hello@notnew.com]
      </p>
    </main>
  );
}

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">Last updated: {updated}</p>

      <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        Draft for review — have a licensed attorney review and finalize before
        public launch. Replace all [bracketed] placeholders.
      </div>

      <div className="legal-prose mt-8 flex flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </main>
  );
}

/**
 * Run automated ingestion once. Intended for a scheduler (cron / EventBridge).
 * Usage: npx tsx scripts/ingest.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  // Dynamic import so env is loaded before the Prisma client initializes.
  const { runIngestion } = await import("../src/lib/ingest/run");
  const r = await runIngestion();
  console.log(
    `Ingestion done: +${r.added} added, ${r.skipped} skipped${
      r.capReached ? " (daily cap reached)" : ""
    }`,
  );
  for (const s of r.perSearch) {
    console.log(`  ${s.source} "${s.query}": +${s.added}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Ingestion failed:", e);
    process.exit(1);
  });

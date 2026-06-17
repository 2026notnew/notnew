import { PrismaClient, type Category, type SourceSite } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_FINDS: {
  title: string;
  description: string;
  price: number;
  category: Category;
  sourceSite: SourceSite;
  eraTag: string;
  featured: boolean;
  score: number;
}[] = [
  {
    title: "1967 Avalon Ballroom Quicksilver Messenger Service Poster",
    description:
      "An original first-printing Family Dog handbill from the Avalon, not a reproduction. The registration on the orange ink is crisp and the corners are clean. These rarely surface outside of serious collections.",
    price: 850,
    category: "ROCK_POSTERS",
    sourceSite: "EBAY",
    eraTag: "1960s",
    featured: true,
    score: 42,
  },
  {
    title: "Steel Sinclair Dino Gas Station Sign, 48\"",
    description:
      "Double-sided porcelain with the green Dino still vivid. A few edge chips that tell you it actually hung somewhere, which is exactly what you want.",
    price: 2400,
    category: "PETROLIANA",
    sourceSite: "FACEBOOK",
    eraTag: "1950s",
    featured: true,
    score: 31,
  },
  {
    title: "1948 Indian Chief Project, Mostly Complete",
    description:
      "Numbers-matching roller that's been dry-stored since the 80s. Needs everything but it's all there, including the original tanks with usable paint underneath the grime.",
    price: 9500,
    category: "MOTORCYCLES",
    sourceSite: "HAMB",
    eraTag: "1940s",
    featured: false,
    score: 28,
  },
  {
    title: "Snap-on KRA Roll Cab, 1960s, Original Red",
    description:
      "Pre-merger Snap-on chest with the early badge and working tambour. Patina without rust-through. Drawers slide like the day it left Kenosha.",
    price: 650,
    category: "GARAGE_TOOLS",
    sourceSite: "GARAGE_JOURNAL",
    eraTag: "1960s",
    featured: false,
    score: 19,
  },
  {
    title: "Omega Seamaster 300 Ref. 165.024, 1966",
    description:
      "Honest tropical dial, fat-lume hands, and a case that hasn't been polished to death. The kind of Seamaster the market hasn't fully figured out yet.",
    price: 7800,
    category: "WATCHES",
    sourceSite: "ETSY",
    eraTag: "1960s",
    featured: true,
    score: 37,
  },
  {
    title: "1932 Ford 3-Window Coupe Body, Steel",
    description:
      "Original Henry steel three-window, not a glass repop. Cowl is solid, floor is gone — as expected. Title in hand, which makes this a real starting point rather than a headache.",
    price: 18500,
    category: "AUTOMOTIVE",
    sourceSite: "HAMB",
    eraTag: "1930s",
    featured: false,
    score: 24,
  },
  {
    title: "Mobil Pegasus Neon Sign, Working",
    description:
      "The flying red horse, lit and humming. Transformer was rebuilt last year. Big enough to anchor a shop wall and make everyone ask where you found it.",
    price: 3200,
    category: "PETROLIANA",
    sourceSite: "EBAY",
    eraTag: "1950s",
    featured: false,
    score: 22,
  },
  {
    title: "Fillmore West BG-140 Santana Poster, 1st Print",
    description:
      "Lee Conklin artwork in full first-print saturation. Pinholes only, no tape, no trimming. A cornerstone Bill Graham piece.",
    price: 425,
    category: "ROCK_POSTERS",
    sourceSite: "ETSY",
    eraTag: "1960s",
    featured: false,
    score: 33,
  },
  {
    title: "Vintage Starrett Machinist Tool Set in Oak Case",
    description:
      "Micrometers, squares, and gauges, all matching, all in the original fitted oak box. Tools that were bought once and used for forty years.",
    price: 280,
    category: "GARAGE_TOOLS",
    sourceSite: "CRAIGSLIST",
    eraTag: "1940s",
    featured: false,
    score: 12,
  },
  {
    title: "1971 Triumph Bonneville T120R, Running",
    description:
      "Matching numbers, oil-in-frame, and it starts on the second kick. Some thoughtful recommissioning done, none of it irreversible. A rider, not a trailer queen.",
    price: 8900,
    category: "MOTORCYCLES",
    sourceSite: "FACEBOOK",
    eraTag: "1970s",
    featured: false,
    score: 16,
  },
];

async function main() {
  const curator = await prisma.user.upsert({
    where: { username: "notnew" },
    update: {},
    create: {
      clerkId: "seed_curator",
      email: "curator@notnew.com",
      username: "notnew",
      role: "ADMIN",
    },
  });

  for (const f of SEED_FINDS) {
    await prisma.find.create({
      data: {
        ...f,
        url: "https://example.com/listing",
        images: [],
        status: "APPROVED",
        submittedBy: curator.id,
      },
    });
  }

  console.log(`Seeded ${SEED_FINDS.length} finds under curator "${curator.username}".`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

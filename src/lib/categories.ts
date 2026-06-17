import type { Category, SourceSite } from "@prisma/client";

export const CATEGORIES: {
  value: Category;
  slug: string;
  label: string;
  blurb: string;
}[] = [
  {
    value: "ROCK_POSTERS",
    slug: "rock-posters",
    label: "Rock Posters",
    blurb: "Concert posters, handbills, and music memorabilia.",
  },
  {
    value: "AUTOMOTIVE",
    slug: "automotive",
    label: "Automotive",
    blurb: "Hot rods, classics, parts, and project cars.",
  },
  {
    value: "PETROLIANA",
    slug: "petroliana",
    label: "Petroliana",
    blurb: "Gas station signs, pumps, oil cans, and garage advertising.",
  },
  {
    value: "GARAGE_TOOLS",
    slug: "garage-tools",
    label: "Garage & Tools",
    blurb: "Vintage tools, workshop equipment, and shop ephemera.",
  },
  {
    value: "MOTORCYCLES",
    slug: "motorcycles",
    label: "Motorcycles",
    blurb: "Vintage bikes, parts, and two-wheeled curiosities.",
  },
  {
    value: "WATCHES",
    slug: "watches",
    label: "Watches",
    blurb: "Vintage and collectible timepieces.",
  },
  {
    value: "MID_CENTURY_MODERN",
    slug: "mid-century-modern",
    label: "Mid-Century Modern",
    blurb: "Furniture, lighting, and design from the mid-century era.",
  },
];

export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
export const CATEGORY_BY_VALUE = new Map(CATEGORIES.map((c) => [c.value, c]));

export const SOURCE_LABELS: Record<SourceSite, string> = {
  EBAY: "eBay",
  ETSY: "Etsy",
  CRAIGSLIST: "Craigslist",
  FACEBOOK: "Facebook",
  HAMB: "The HAMB",
  GARAGE_JOURNAL: "Garage Journal",
  OTHER: "Other",
};

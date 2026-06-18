import type { SourceSite } from "@prisma/client";

/** A normalized candidate item returned by a source adapter. */
export type Candidate = {
  externalId: string; // stable id from the source, for dedup
  url: string;
  title: string;
  price: number | null;
  location: string | null;
  imageUrl: string | null; // hero candidate, will be cached to S3
  sourceImages: string[]; // additional hotlinked photos
};

export type SearchParams = {
  query: string;
  minPrice: number;
  limit: number;
};

export interface SourceAdapter {
  source: SourceSite;
  /** True when the adapter has the credentials it needs to run. */
  isConfigured(): boolean;
  search(params: SearchParams): Promise<Candidate[]>;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireStaff, requireAdmin } from "@/lib/admin";
import { CATEGORIES } from "@/lib/categories";
import {
  createUploadUrl,
  isAllowedImageUrl,
  deleteImages,
  cacheExternalImage,
} from "@/lib/s3";
import { extractLocation, extractListing, type ListingMeta } from "@/lib/scrape";
import type { Category, SourceSite } from "@prisma/client";

// Shown to paused/banned users when they attempt to contribute.
const BLOCKED_MSG =
  "Your account can't do that right now. If you think this is a mistake, contact support.";

// --- Image uploads ---

export async function requestUploadUrl(
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to upload." };
  if (user.status !== "ACTIVE") return { error: BLOCKED_MSG };
  try {
    const { uploadUrl, publicUrl } = await createUploadUrl(contentType);
    return { uploadUrl, publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

// Pre-fill the submit form by scraping the listing on demand.
export async function fetchListingMeta(
  url: string,
): Promise<ListingMeta | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (user.status !== "ACTIVE") return { error: BLOCKED_MSG };
  if (!/^https?:\/\//.test(url)) return { error: "Enter a valid link first." };
  return extractListing(url);
}

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.value));
const VALID_SOURCES = new Set<SourceSite>([
  "EBAY",
  "ETSY",
  "CRAIGSLIST",
  "FACEBOOK",
  "HAMB",
  "GARAGE_JOURNAL",
  "OTHER",
]);

export type SubmitState = { error?: string } | null;

export async function submitFind(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in to submit a find." };
  if (user.status !== "ACTIVE") return { error: BLOCKED_MSG };

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const sourceSite = String(formData.get("sourceSite") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const eraTag = String(formData.get("eraTag") ?? "").trim() || null;
  let location = String(formData.get("location") ?? "").trim().slice(0, 120) || null;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  let expiresAt: Date | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (!Number.isNaN(d.getTime())) expiresAt = d;
  }

  if (!url || !/^https?:\/\//.test(url))
    return { error: "Enter a valid link starting with http(s)://" };
  if (title.length < 4) return { error: "Give it a real title." };
  if (description.length < 20)
    return { error: "Add a sentence or two on why it's notable (20+ chars)." };
  if (!VALID_CATEGORIES.has(category))
    return { error: "Pick a category." };
  if (!VALID_SOURCES.has(sourceSite as SourceSite))
    return { error: "Pick a source site." };

  const price = priceRaw ? Number(priceRaw) : null;
  if (price !== null && (Number.isNaN(price) || price < 100))
    return { error: "NotNew is for items $100 and up." };

  // Durable hero/gallery images we host (uploaded to our own bucket/CDN).
  const images = formData
    .getAll("images")
    .map(String)
    .filter((u) => isAllowedImageUrl(u))
    .slice(0, 12);

  // Hotlinked images from the source listing — stored as hrefs, not copied.
  // They gracefully disappear in the UI when the source ad goes away.
  const sourceImages = formData
    .getAll("sourceImages")
    .map(String)
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 12);

  // Need at least one image from somewhere.
  if (images.length === 0 && sourceImages.length === 0)
    return { error: "Add at least one image, or fetch them from the listing." };

  // No uploaded hero? Cache the first scraped image so the card has a durable
  // face that survives after the source listing dies.
  if (images.length === 0) {
    for (const u of sourceImages) {
      const cached = await cacheExternalImage(u);
      if (cached) {
        images.push(cached);
        break;
      }
    }
  }

  // Dedup on exact URL.
  const dupe = await prisma.find.findFirst({ where: { url } });
  if (dupe) return { error: "That link has already been submitted." };

  // Fall back to scraping the listing for a location when none was entered.
  if (!location) location = await extractLocation(url);

  await prisma.find.create({
    data: {
      url,
      title,
      description,
      category: category as Category,
      sourceSite: sourceSite as SourceSite,
      price,
      eraTag,
      location,
      expiresAt,
      images,
      sourceImages,
      status: "PENDING",
      submittedBy: user.id,
    },
  });

  revalidatePath("/");
  redirect("/submit?submitted=1");
}

// --- Moderation (staff only) ---

export async function approveFind(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "on";
  if (!id) return;

  await prisma.find.update({
    where: { id },
    data: { status: "APPROVED", featured },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectFind(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.find.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin");
}

export async function resolveFlag(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.flag.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/admin");
}

// --- Post-publication management (staff only) ---

export async function setFeatured(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";
  if (!id) return;

  await prisma.find.update({ where: { id }, data: { featured } });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/finds/${id}`);
}

const VALID_AVAILABILITY = new Set(["AVAILABLE", "SOLD", "EXPIRED"]);

/** Mark a find sold / no-longer-available / available again. Card is kept. */
export async function setAvailability(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const availability = String(formData.get("availability") ?? "");
  if (!id || !VALID_AVAILABILITY.has(availability)) return;

  await prisma.find.update({
    where: { id },
    data: { availability: availability as never },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/finds/${id}`);
}

/** Pull a published find back off the site (reversible — sets it to PENDING). */
export async function unpublishFind(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.find.update({
    where: { id },
    data: { status: "PENDING", featured: false },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/finds/${id}`);
}

/** Permanently delete a find. Comments/votes/flags cascade; images are purged. */
export async function deleteFind(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const find = await prisma.find.findUnique({
    where: { id },
    select: { images: true, revisions: { select: { snapshot: true } } },
  });
  if (!find) return;

  // Gather every hosted image we ever held for this find — current + history.
  const all = new Set(find.images);
  for (const r of find.revisions) {
    const snap = r.snapshot as { images?: string[] } | null;
    for (const u of snap?.images ?? []) all.add(u);
  }

  await prisma.find.delete({ where: { id } }); // revisions cascade
  await deleteImages([...all]);

  revalidatePath("/admin");
  revalidatePath("/");
}

// --- Voting ---

export async function voteOnFind(
  findId: string,
  value: 1 | -1,
): Promise<{ score: number; userVote: number } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to vote." };
  if (user.status !== "ACTIVE") return { error: BLOCKED_MSG };

  const existing = await prisma.vote.findUnique({
    where: { findId_userId: { findId, userId: user.id } },
  });

  // Clicking the same direction again clears the vote (toggle off).
  const clearing = existing?.value === value;

  await prisma.$transaction(async (tx) => {
    if (clearing) {
      await tx.vote.delete({
        where: { findId_userId: { findId, userId: user.id } },
      });
    } else {
      await tx.vote.upsert({
        where: { findId_userId: { findId, userId: user.id } },
        create: { findId, userId: user.id, value },
        update: { value },
      });
    }

    const agg = await tx.vote.aggregate({
      where: { findId },
      _sum: { value: true },
    });
    await tx.find.update({
      where: { id: findId },
      data: { score: agg._sum.value ?? 0 },
    });
  });

  const agg = await prisma.vote.aggregate({
    where: { findId },
    _sum: { value: true },
  });

  revalidatePath(`/finds/${findId}`);
  revalidatePath("/");
  return { score: agg._sum.value ?? 0, userVote: clearing ? 0 : value };
}

// --- Commenting ---

export type CommentState = { error?: string; ok?: boolean } | null;

export async function addComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to comment." };
  if (user.status !== "ACTIVE") return { error: BLOCKED_MSG };

  const findId = String(formData.get("findId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;

  if (!findId) return { error: "Missing find." };
  if (body.length < 2) return { error: "Say a little more." };
  if (body.length > 5000) return { error: "That's too long." };

  // WordPress-style: a user's first comment is held for approval; once they
  // have one approved comment, the rest post immediately.
  const priorApproved = await prisma.comment.count({
    where: { userId: user.id, approved: true },
  });
  const approved = priorApproved > 0;

  await prisma.comment.create({
    data: { findId, userId: user.id, body, parentId, approved },
  });

  revalidatePath(`/finds/${findId}`);
  return {
    ok: true,
    error: approved
      ? undefined
      : "Thanks — your first comment is held for review before it appears.",
  };
}

// --- Flagging ---

const VALID_FLAG_REASONS = new Set([
  "ALREADY_SOLD",
  "NOT_VINTAGE",
  "UNDER_100",
  "SPAM",
  "WRONG_CATEGORY",
  "BROKEN_LINK",
  "OTHER",
]);

export type FlagState = { error?: string; ok?: boolean } | null;

export async function submitFlag(
  _prev: FlagState,
  formData: FormData,
): Promise<FlagState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to flag a listing." };
  if (user.status !== "ACTIVE") return { error: BLOCKED_MSG };

  const findId = String(formData.get("findId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || null;

  if (!findId) return { error: "Missing listing." };
  if (!VALID_FLAG_REASONS.has(reason)) return { error: "Pick a reason." };

  // One open flag per user per find — re-flagging is a no-op while it's pending.
  const existing = await prisma.flag.findFirst({
    where: { findId, userId: user.id, status: "OPEN" },
  });
  if (existing) return { ok: true };

  await prisma.flag.create({
    data: {
      findId,
      userId: user.id,
      reason: reason as never,
      notes,
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

// --- Account management (ADMIN only) ---

const VALID_STATUSES = new Set(["ACTIVE", "PAUSED", "BANNED"]);
const VALID_ROLES = new Set(["USER", "MODERATOR", "ADMIN"]);

export async function setUserStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!userId || !VALID_STATUSES.has(status)) return;

  // Can't change your own status — prevents locking yourself out.
  if (userId === admin.id) return;

  await prisma.user.update({
    where: { id: userId },
    data: { status: status as never },
  });
  revalidatePath("/admin/users");
}

export async function setUserRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !VALID_ROLES.has(role)) return;

  // Can't change your own role — prevents accidental self-demotion.
  if (userId === admin.id) return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as never },
  });
  revalidatePath("/admin/users");
}

// --- Ingestion / saved searches (ADMIN only) ---

export async function createSavedSearch(formData: FormData): Promise<void> {
  await requireAdmin();
  const query = String(formData.get("query") ?? "").trim().slice(0, 200);
  const source = String(formData.get("source") ?? "");
  const category = String(formData.get("category") ?? "");
  const minPrice = Math.max(100, Number(formData.get("minPrice") ?? 100) || 100);
  const region =
    String(formData.get("region") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40) || null;

  if (!query || !VALID_SOURCES.has(source as SourceSite) || !VALID_CATEGORIES.has(category))
    return;
  // Craigslist is regional — it needs a site subdomain.
  if (source === "CRAIGSLIST" && !region) return;

  await prisma.savedSearch.create({
    data: {
      query,
      source: source as SourceSite,
      category: category as Category,
      region,
      minPrice,
    },
  });
  revalidatePath("/admin/sources");
}

export async function toggleSavedSearch(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const s = await prisma.savedSearch.findUnique({ where: { id } });
  if (!s) return;
  await prisma.savedSearch.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/admin/sources");
}

export async function deleteSavedSearch(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.savedSearch.delete({ where: { id } });
  revalidatePath("/admin/sources");
}

export async function runIngestionNow(): Promise<void> {
  await requireAdmin();
  const { runIngestion } = await import("@/lib/ingest/run");
  await runIngestion();
  revalidatePath("/admin/sources");
  revalidatePath("/admin");
}

// --- Editing a find (staff only) ---

export type EditState = { error?: string; ok?: boolean } | null;

// Editable state we snapshot into revision history for undo.
type FindSnapshot = {
  title: string;
  description: string;
  url: string;
  category: string;
  sourceSite: string;
  price: number | null;
  eraTag: string | null;
  location: string | null;
  expiresAt: string | null;
  availability: string;
  featured: boolean;
  images: string[];
  sourceImages: string[];
};

function snapshotOf(f: {
  title: string;
  description: string;
  url: string;
  category: string;
  sourceSite: string;
  price: number | null;
  eraTag: string | null;
  location: string | null;
  expiresAt: Date | null;
  availability: string;
  featured: boolean;
  images: string[];
  sourceImages: string[];
}): FindSnapshot {
  return {
    title: f.title,
    description: f.description,
    url: f.url,
    category: f.category,
    sourceSite: f.sourceSite,
    price: f.price,
    eraTag: f.eraTag,
    location: f.location,
    expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null,
    availability: f.availability,
    featured: f.featured,
    images: f.images,
    sourceImages: f.sourceImages,
  };
}

export async function updateFind(
  _prev: EditState,
  formData: FormData,
): Promise<EditState> {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing find." };

  const existing = await prisma.find.findUnique({ where: { id } });
  if (!existing) return { error: "Find not found." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const sourceSite = String(formData.get("sourceSite") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const eraTag = String(formData.get("eraTag") ?? "").trim() || null;
  const location =
    String(formData.get("location") ?? "").trim().slice(0, 120) || null;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();

  if (title.length < 4) return { error: "Give it a real title." };
  if (description.length < 20)
    return { error: "Description needs to be a bit longer (20+ chars)." };
  if (!VALID_CATEGORIES.has(category)) return { error: "Pick a category." };
  if (!VALID_SOURCES.has(sourceSite as SourceSite))
    return { error: "Pick a source site." };
  if (!/^https?:\/\//.test(url))
    return { error: "Enter a valid link starting with http(s)://" };

  const price = priceRaw ? Number(priceRaw) : null;
  if (price !== null && (Number.isNaN(price) || price < 100))
    return { error: "NotNew is for items $100 and up." };

  let expiresAt: Date | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (!Number.isNaN(d.getTime())) expiresAt = d;
  }

  const images = formData
    .getAll("images")
    .map(String)
    .filter((u) => isAllowedImageUrl(u))
    .slice(0, 12);
  const sourceImages = formData
    .getAll("sourceImages")
    .map(String)
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 12);

  if (images.length === 0 && sourceImages.length === 0)
    return { error: "Keep at least one image." };

  // Snapshot the pre-edit state so the change can be undone. Images are kept
  // (not deleted) precisely so a restore can bring them back.
  await prisma.findRevision.create({
    data: {
      findId: id,
      snapshot: snapshotOf(existing),
      editorName: staff.username,
    },
  });
  await pruneRevisions(id);

  await prisma.find.update({
    where: { id },
    data: {
      title,
      description,
      category: category as Category,
      sourceSite: sourceSite as SourceSite,
      url,
      price,
      eraTag,
      location,
      expiresAt,
      images,
      sourceImages,
    },
  });

  revalidatePath(`/finds/${id}`);
  revalidatePath(`/admin/finds/${id}/edit`);
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

// Keep history bounded — retain the most recent 25 revisions per find.
async function pruneRevisions(findId: string): Promise<void> {
  const old = await prisma.findRevision.findMany({
    where: { findId },
    orderBy: { createdAt: "desc" },
    skip: 25,
    select: { id: true },
  });
  if (old.length)
    await prisma.findRevision.deleteMany({
      where: { id: { in: old.map((r) => r.id) } },
    });
}

/** Restore a find to a prior revision. The current state is snapshotted first,
 *  so a restore is itself undoable. */
export async function restoreRevision(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const revisionId = String(formData.get("revisionId") ?? "");
  if (!revisionId) return;

  const rev = await prisma.findRevision.findUnique({ where: { id: revisionId } });
  if (!rev) return;
  const current = await prisma.find.findUnique({ where: { id: rev.findId } });
  if (!current) return;

  const snap = rev.snapshot as unknown as FindSnapshot;

  await prisma.findRevision.create({
    data: {
      findId: rev.findId,
      snapshot: snapshotOf(current),
      editorName: `${staff.username} (restore)`,
    },
  });
  await pruneRevisions(rev.findId);

  await prisma.find.update({
    where: { id: rev.findId },
    data: {
      title: snap.title,
      description: snap.description,
      url: snap.url,
      category: snap.category as Category,
      sourceSite: snap.sourceSite as SourceSite,
      price: snap.price,
      eraTag: snap.eraTag,
      location: snap.location,
      expiresAt: snap.expiresAt ? new Date(snap.expiresAt) : null,
      availability: snap.availability as never,
      featured: snap.featured,
      images: snap.images,
      sourceImages: snap.sourceImages,
    },
  });

  revalidatePath(`/finds/${rev.findId}`);
  revalidatePath(`/admin/finds/${rev.findId}/edit`);
  revalidatePath("/admin");
  revalidatePath("/");
}

// --- Rapid cataloguing (staff only) — creates DRAFT finds, photos added later ---

export type QuickAddState =
  | { error?: string; ok?: boolean; title?: string; id?: string }
  | null;

export async function quickAddFind(
  _prev: QuickAddState,
  formData: FormData,
): Promise<QuickAddState> {
  const staff = await requireStaff();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const sourceSite = String(formData.get("sourceSite") ?? "OTHER") || "OTHER";
  const url = String(formData.get("url") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eraTag = String(formData.get("eraTag") ?? "").trim() || null;
  const location =
    String(formData.get("location") ?? "").trim().slice(0, 120) || null;

  if (title.length < 4) return { error: "Title is too short." };
  if (!VALID_CATEGORIES.has(category)) return { error: "Pick a category." };
  if (!VALID_SOURCES.has(sourceSite as SourceSite))
    return { error: "Pick a source." };

  const price = priceRaw ? Number(priceRaw) : null;
  if (price !== null && (Number.isNaN(price) || price < 100))
    return { error: "Price must be $100+ (or leave blank)." };

  const find = await prisma.find.create({
    data: {
      title,
      description: description || "Catalogued — details to follow.",
      url: url || "",
      category: category as Category,
      sourceSite: sourceSite as SourceSite,
      price,
      eraTag,
      location,
      images: [],
      sourceImages: [],
      status: "DRAFT",
      submittedBy: staff.id,
    },
  });

  revalidatePath("/admin/drafts");
  return { ok: true, title, id: find.id };
}

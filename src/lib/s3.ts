import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION ?? "us-west-2";
const BUCKET = process.env.AWS_S3_MEDIA_BUCKET ?? "notnew-media";
const CDN = process.env.CLOUDFRONT_DOMAIN ?? "";

export const s3 = new S3Client({ region: REGION });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Returns a presigned PUT URL for a browser upload plus the public CloudFront
 * URL the object will be reachable at once uploaded.
 */
export async function createUploadUrl(contentType: string): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
}> {
  if (!ALLOWED.has(contentType)) {
    throw new Error("Unsupported image type.");
  }
  const key = `finds/${randomUUID()}.${EXT[contentType]}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 120 },
  );

  const publicUrl = CDN
    ? `https://${CDN}/${key}`
    : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
}

export function isAllowedImageUrl(url: string): boolean {
  if (CDN && url.startsWith(`https://${CDN}/finds/`)) return true;
  return url.startsWith(`https://${BUCKET}.s3.${REGION}.amazonaws.com/finds/`);
}

const CACHE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

function isSafePublicHost(u: URL): boolean {
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  return !(
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/**
 * Download one external image and store it in our bucket so it survives after
 * the source listing dies. Returns the durable public URL, or null on failure.
 */
export async function cacheExternalImage(rawUrl: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!isSafePublicHost(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NotNewBot/1.0 (+https://notnew.com)" },
      redirect: "follow",
    });
    if (!res.ok) return null;

    const ct = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = CACHE_EXT[ct];
    if (!ext) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > 10_000_000) return null;

    const key = `finds/${randomUUID()}.${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bytes,
        ContentType: ct,
      }),
    );

    return CDN
      ? `https://${CDN}/${key}`
      : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract the S3 object key from one of our public image URLs. */
function keyFromUrl(url: string): string | null {
  if (!isAllowedImageUrl(url)) return null;
  const idx = url.indexOf("/finds/");
  return idx === -1 ? null : url.slice(idx + 1); // drop leading slash
}

/** Best-effort delete of uploaded images; never throws. */
export async function deleteImages(urls: string[]): Promise<void> {
  const keys = urls.map(keyFromUrl).filter((k): k is string => !!k);
  if (keys.length === 0) return;
  try {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  } catch {
    // Orphaned objects are harmless; don't block the delete on cleanup.
  }
}

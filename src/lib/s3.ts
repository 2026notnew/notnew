import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

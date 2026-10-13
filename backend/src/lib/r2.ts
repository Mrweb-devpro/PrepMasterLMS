import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

/** Short-lived download link (default 5 min). Only issued after access is checked. */
export const downloadUrl = (key: string, seconds = 300) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), { expiresIn: seconds });

/** Upload link — the browser uploads the file straight to R2. */
export const uploadUrl = (key: string, contentType: string, seconds = 600) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }), {
    expiresIn: seconds,
  });

export const safeName = (name: string) => name.replace(/[^\w.-]/g, "_").slice(0, 150);

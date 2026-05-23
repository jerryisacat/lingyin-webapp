import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { MediaFile } from "@/types";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

function isNoSuchKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "NoSuchKey"
  );
}

export function buildMarkdownPath(userId: string, date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `users/${userId}/entries/${year}/${month}/${year}-${month}-${day}.md`;
}

export function buildEncryptedMarkdownPath(userId: string, date: string): string {
  return buildMarkdownPath(userId, date).replace(/\.md$/, ".enc.md");
}

export function isEncryptedPath(path: string): boolean {
  return path.endsWith(".enc.md");
}

export function buildAssetPath(
  userId: string,
  date: string,
  filename: string
): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `users/${userId}/entries/${year}/${month}/assets/${filename}`;
}

export async function getPresignedUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

export interface SaveResult {
  path: string;
  encrypted: boolean;
}

export async function saveMarkdown(
  userId: string,
  date: string,
  content: string,
  encrypted = false
): Promise<SaveResult> {
  const key = encrypted
    ? buildEncryptedMarkdownPath(userId, date)
    : buildMarkdownPath(userId, date);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: encrypted
        ? "application/octet-stream"
        : "text/markdown; charset=utf-8",
      Metadata: encrypted ? { encrypted: "true" } : undefined,
    })
  );

  return { path: key, encrypted };
}

export interface ReadResult {
  content: string;
  encrypted: boolean;
}

export async function readMarkdown(
  userId: string,
  date: string
): Promise<ReadResult | null> {
  const encKey = buildEncryptedMarkdownPath(userId, date);
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: encKey })
    );
    const content = (await Body?.transformToString("utf-8")) ?? "";
    return { content, encrypted: true };
  } catch (error: unknown) {
    if (!isNoSuchKey(error)) throw error;
  }

  const key = buildMarkdownPath(userId, date);
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    const content = (await Body?.transformToString("utf-8")) ?? "";
    return { content, encrypted: false };
  } catch (error: unknown) {
    if (isNoSuchKey(error)) return null;
    throw error;
  }
}

export async function readMarkdownByPath(path: string): Promise<string | null> {
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: path })
    );
    return (await Body?.transformToString("utf-8")) ?? null;
  } catch (error: unknown) {
    if (isNoSuchKey(error)) return null;
    throw error;
  }
}

export async function uploadImage(
  userId: string,
  imageBuffer: Buffer,
  filename: string,
  contentType: string,
  date?: string
): Promise<MediaFile> {
  const uploadDate = date ?? new Date().toISOString().slice(0, 10);
  const key = buildAssetPath(userId, uploadDate, filename);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
    })
  );

  const signedUrl = await getPresignedUrl(key);

  return {
    url: signedUrl,
    path: key,
    type: "image",
    mime: contentType,
    size: imageBuffer.length,
  };
}

export async function deleteEntry(
  userId: string,
  date: string
): Promise<void> {
  const encKey = buildEncryptedMarkdownPath(userId, date);
  const plainKey = buildMarkdownPath(userId, date);

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: encKey }));
  } catch (error: unknown) {
    if (!isNoSuchKey(error)) throw error;
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: plainKey }));
  } catch (error: unknown) {
    if (!isNoSuchKey(error)) throw error;
  }
}

export async function deleteMarkdownByPath(path: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }));
}

export async function deleteImage(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

export async function deleteDirectory(prefix: string): Promise<number> {
  let deleted = 0;

  while (true) {
    const listResult = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        MaxKeys: 1000,
      })
    );

    const keys = (listResult.Contents ?? [])
      .map((obj) => obj.Key)
      .filter((k): k is string => k !== undefined);

    if (keys.length === 0) break;

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );

    deleted += keys.length;

    if (!listResult.IsTruncated) break;
  }

  return deleted;
}

export async function listEntriesByPrefix(
  prefix: string
): Promise<{ key: string }[]> {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 1000,
    })
  );

  return (result.Contents ?? [])
    .filter((obj) => obj.Key !== undefined)
    .map((obj) => ({ key: obj.Key! }));
}

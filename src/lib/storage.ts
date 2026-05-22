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

export function buildMarkdownPath(userId: string, date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `users/${userId}/entries/${year}/${month}/${year}-${String(month).padStart(2, "0")}-${day}.md`;
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

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

export async function saveMarkdown(
  userId: string,
  date: string,
  content: string
): Promise<string> {
  const key = buildMarkdownPath(userId, date);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: "text/markdown; charset=utf-8",
    })
  );
  return key;
}

export async function readMarkdown(
  userId: string,
  date: string
): Promise<string | null> {
  const key = buildMarkdownPath(userId, date);
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    return (await Body?.transformToString("utf-8")) ?? null;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "NoSuchKey"
    ) {
      return null;
    }
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
  const key = buildMarkdownPath(userId, date);
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
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

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

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

  return {
    url: `${PUBLIC_URL}/${key}`,
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
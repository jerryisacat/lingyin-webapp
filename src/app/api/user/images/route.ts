import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers";
import { listUserImages, batchDeleteImages, getPresignedUrl } from "@/lib/storage";
import { NextRequest } from "next/server";
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";
import { formatZodError, imageListSchema, imageDeleteSchema } from "@/lib/validations";

function parseEntryDate(key: string): string | null {
  const match = key.match(/\/entries\/(\d{4})\/(\d{2})\//);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

function extractFilename(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1] ?? key;
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = getClientIP(request);
  const { success, reset } = await checkRateLimit(rateLimiters.imageManage, ip);
  if (!success) return rateLimitError(reset);

  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = imageListSchema.safeParse(queryParams);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { cursor, limit } = parseResult.data;
  const offset = cursor ? parseInt(cursor, 10) : 0;

  const allImages = await listUserImages(user.id);
  allImages.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  const slice = allImages.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  const nextCursor = nextOffset < allImages.length ? String(nextOffset) : null;

  const images = await Promise.all(
    slice.map(async (img) => ({
      key: img.key,
      filename: extractFilename(img.key),
      size: img.size,
      uploadedAt: img.lastModified.toISOString(),
      entryDate: parseEntryDate(img.key),
      thumbnailUrl: await getPresignedUrl(img.key, 3600),
    }))
  );

  return jsonOk({
    images,
    nextCursor,
    totalCount: allImages.length,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = getClientIP(request);
  const { success, reset } = await checkRateLimit(rateLimiters.imageManage, ip);
  if (!success) return rateLimitError(reset);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = imageDeleteSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { keys } = parseResult.data;
  const userPrefix = `users/${user.id}/`;
  const validKeys = keys.filter((key) => key.startsWith(userPrefix));

  if (validKeys.length === 0) {
    return jsonError("No valid image keys provided", 400);
  }

  const deleted = await batchDeleteImages(validKeys);

  return jsonOk({ deleted });
}

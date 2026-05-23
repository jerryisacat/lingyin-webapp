import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers";
import { getEntries, getCalendarEntries, saveDiary } from "@/lib/diary";
import { NextRequest } from "next/server";
import { formatZodError, entriesListSchema, createEntrySchema } from "@/lib/validations";
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = getClientIP(request);
  const { success, reset } = await checkRateLimit(rateLimiters.entriesRead, ip);
  if (!success) return rateLimitError(reset);

  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = entriesListSchema.safeParse(queryParams);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { view, year, month, cursor, limit } = parseResult.data;

  if (view === "calendar") {
    if (year === undefined || month === undefined) {
      return jsonError("year and month are required for calendar view");
    }
    const entries = await getCalendarEntries(user.id, year, month);
    return jsonOk({ entries });
  }

  const entries = await getEntries(user.id, cursor, limit);

  const nextCursor =
    entries.length >= limit ? entries[entries.length - 1]?.id ?? null : null;

  return jsonOk({ entries, nextCursor });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { success, reset } = await checkRateLimit(rateLimiters.entriesWrite, user.id);
  if (!success) return rateLimitError(reset);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parseResult = createEntrySchema.safeParse(rawBody);
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400);
  }

  const { date: inputDate, markdown, imagePaths, encrypted } = parseResult.data;
  const date = inputDate ?? new Date().toISOString().slice(0, 10);

  const entry = await saveDiary({
    userId: user.id,
    date,
    markdown,
    imagePaths,
    encrypted,
  });

  return jsonOk(entry, 201);
}
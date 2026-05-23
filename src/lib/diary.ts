import { prisma } from "@/lib/db";
import * as storage from "@/lib/storage";
import {
  describeImages,
  generateStream,
} from "@/lib/ai/client";
import {
  buildSystemPrompt,
  buildDiaryPrompt,
  VISION_PROMPT,
} from "@/lib/ai/prompts";
import { trackStorageUsage } from "@/lib/quota-service";
import type { ApiProvider, MediaFile, WritingStyle, DiarySummary, CalendarEntry } from "@/types";
import { DEFAULT_WRITING_STYLE } from "@/config/personas";

export async function* generateDiary(params: {
  text: string;
  images: MediaFile[];
  writingStyle?: WritingStyle;
  date: string;
  apiKey: string;
  provider: ApiProvider;
}): AsyncGenerator<string> {
  const { text, images, writingStyle, date, apiKey, provider } = params;

  const imageUrls = images.map((img) => img.url);
  const imageDescriptions =
    imageUrls.length > 0
      ? await describeImages({
          apiKey,
          provider,
          imageUrls,
          prompt: VISION_PROMPT,
        })
      : [];

  // Pair URLs with descriptions for the prompt
  const imageData = images.map((img, i) => ({
    url: img.url,
    description: imageDescriptions[i] ?? "",
  }));

  const systemPrompt = buildSystemPrompt(writingStyle ?? DEFAULT_WRITING_STYLE)
  const userPrompt = buildDiaryPrompt({
    userText: text,
    imageDescriptions: imageData,
    date,
  });

  yield* generateStream({ apiKey, provider, systemPrompt, userPrompt });
}

export async function saveDiary(params: {
  userId: string;
  date: string;
  markdown: string;
  imagePaths: string[];
  encrypted?: boolean;
}): Promise<DiarySummary> {
  const { userId, date, markdown, encrypted = false } = params;

  const saved = await storage.saveMarkdown(userId, date, markdown, encrypted);

  // Track markdown storage size
  const contentSize = new TextEncoder().encode(markdown).length;
  try {
    await trackStorageUsage(userId, contentSize);
  } catch {
    console.error("[saveDiary] Failed to track storage usage");
  }

  const preview = encrypted
    ? null
    : markdown.replace(/[#*!\[\]`>\-_\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  const wordCount = encrypted ? 0 : markdown.replace(/[#*!\[\]`>\-_\n]/g, "").replace(/\s+/g, "").length;
  const hasImages = encrypted ? false : markdown.includes("![");
  const imageCount = encrypted ? 0 : (markdown.match(/!\[.*?\]\(.*?\)/g) ?? []).length;
  const tagMatches = encrypted ? [] : (markdown.match(/#\S+/g) ?? []);
  const tags = tagMatches.length > 0 ? JSON.stringify(tagMatches.slice(0, 10)) : null;

  const entry = await prisma.entry.upsert({
    where: {
      userId_date: { userId, date: new Date(date) },
    },
    create: {
      userId,
      date: new Date(date),
      preview,
      wordCount,
      hasImages,
      imageCount,
      markdownPath: saved.path,
      tags,
    },
    update: {
      preview,
      wordCount,
      hasImages,
      imageCount,
      markdownPath: saved.path,
      tags,
    },
  });

  return {
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    title: entry.title ?? undefined,
    preview: entry.preview ?? "",
    hasImages: entry.hasImages,
    wordCount: entry.wordCount,
    tags: entry.tags ? JSON.parse(entry.tags) : [],
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function getEntries(
  userId: string,
  cursor?: string,
  limit = 20
): Promise<DiarySummary[]> {
  const entries = await prisma.entry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
  });

  return entries.slice(0, limit).map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    title: entry.title ?? undefined,
    preview: entry.preview ?? "",
    hasImages: entry.hasImages,
    wordCount: entry.wordCount,
    tags: entry.tags ? JSON.parse(entry.tags) : [],
    createdAt: entry.createdAt.toISOString(),
  }));
}

export async function getCalendarEntries(
  userId: string,
  year: number,
  month: number
): Promise<CalendarEntry[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const entries = await prisma.entry.findMany({
    where: {
      userId,
      date: { gte: startDate, lt: endDate },
    },
    select: { id: true, date: true },
    orderBy: { date: "asc" },
  });

  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
  }));
}

export async function getEntry(
  userId: string,
  entryId: string
): Promise<{ markdown: string; isEncrypted: boolean; metadata: DiarySummary } | null> {
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) return null;

  const dateStr = entry.date.toISOString().slice(0, 10);
  const result = await storage.readMarkdown(userId, dateStr);

  return {
    markdown: result?.content ?? "",
    isEncrypted: result?.encrypted ?? false,
    metadata: {
      id: entry.id,
      date: dateStr,
      title: entry.title ?? undefined,
      preview: entry.preview ?? "",
      hasImages: entry.hasImages,
      wordCount: entry.wordCount,
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      createdAt: entry.createdAt.toISOString(),
    },
  };
}

export async function deleteDiary(
  userId: string,
  entryId: string
): Promise<void> {
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) return;

  const d = entry.date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const assetsPrefix = `users/${userId}/entries/${year}/${month}/assets/`;

  await storage.deleteEntry(userId, d.toISOString().slice(0, 10));
  await storage.deleteDirectory(assetsPrefix);
  await prisma.entry.delete({ where: { id: entryId } });
}
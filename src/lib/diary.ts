import { prisma } from "@/lib/db";
import * as storage from "@/lib/storage";
import {
  describeImages,
  generateStream,
} from "@/lib/ai/client";
import { WARM_SYSTEM_PROMPT, buildDiaryPrompt, VISION_PROMPT } from "@/lib/ai/prompts";
import type { ApiProvider, MediaFile, Tone, DiarySummary } from "@/types";

export async function* generateDiary(params: {
  text: string;
  images: MediaFile[];
  tone: Tone;
  date: string;
  apiKey: string;
  provider: ApiProvider;
}): AsyncGenerator<string> {
  const { text, images, tone, date, apiKey, provider } = params;

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

  const systemPrompt = tone === "warm" ? WARM_SYSTEM_PROMPT : WARM_SYSTEM_PROMPT;
  const userPrompt = buildDiaryPrompt({
    userText: text,
    imageDescriptions,
    date,
  });

  yield* generateStream({ apiKey, provider, systemPrompt, userPrompt });
}

export async function saveDiary(params: {
  userId: string;
  date: string;
  markdown: string;
  tone: Tone;
  imagePaths: string[];
}): Promise<DiarySummary> {
  const { userId, date, markdown, tone } = params;

  const markdownPath = await storage.saveMarkdown(userId, date, markdown);

  const preview = markdown.replace(/[#*!\[\]`>\-_\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  const wordCount = markdown.replace(/[#*!\[\]`>\-_\n]/g, "").replace(/\s+/g, "").length;
  const hasImages = markdown.includes("![");
  const imageCount = (markdown.match(/!\[.*?\]\(.*?\)/g) ?? []).length;
  const tagMatches = markdown.match(/#\S+/g) ?? [];
  const tags = tagMatches.length > 0 ? JSON.stringify(tagMatches.slice(0, 10)) : null;

  const entry = await prisma.entry.upsert({
    where: {
      userId_date: { userId, date: new Date(date) },
    },
    create: {
      userId,
      date: new Date(date),
      tone,
      preview,
      wordCount,
      hasImages,
      imageCount,
      markdownPath,
      tags,
    },
    update: {
      tone,
      preview,
      wordCount,
      hasImages,
      imageCount,
      markdownPath,
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

export async function getEntry(
  userId: string,
  entryId: string
): Promise<{ markdown: string; metadata: DiarySummary } | null> {
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) return null;

  const dateStr = entry.date.toISOString().slice(0, 10);
  const markdown = (await storage.readMarkdown(userId, dateStr)) ?? "";

  return {
    markdown,
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

  const dateStr = entry.date.toISOString().slice(0, 10);
  await storage.deleteEntry(userId, dateStr);
  await prisma.entry.delete({ where: { id: entryId } });
}
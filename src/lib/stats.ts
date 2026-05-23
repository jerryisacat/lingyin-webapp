import { prisma } from "@/lib/db";
import type { StatsData, MonthlyData, TagCount } from "@/types";

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToStr(d);
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const dateSet = new Set(dates);
  const today = dateToStr(new Date());
  const yesterday = addDays(today, -1);

  let ref: string | null = null;
  if (dateSet.has(today)) {
    ref = today;
  } else if (dateSet.has(yesterday)) {
    ref = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (dateSet.has(ref)) {
    streak++;
    ref = addDays(ref, -1);
  }
  return streak;
}

function groupByMonth(
  entries: { date: Date; wordCount: number }[],
): MonthlyData[] {
  const map = new Map<string, { count: number; words: number }>();

  for (const e of entries) {
    const month = dateToStr(e.date).slice(0, 7); // "2026-05"
    const bucket = map.get(month);
    if (bucket) {
      bucket.count++;
      bucket.words += e.wordCount;
    } else {
      map.set(month, { count: 1, words: e.wordCount });
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

function calcTopTags(
  entries: { tags: string | null }[],
): TagCount[] {
  const freq = new Map<string, number>();

  for (const e of entries) {
    if (!e.tags) continue;
    try {
      const tags: string[] = JSON.parse(e.tags);
      for (const tag of tags) {
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    } catch {
      // ignore malformed tags
    }
  }

  return Array.from(freq.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));
}

export async function getStats(userId: string): Promise<StatsData> {
  const entries = await prisma.entry.findMany({
    where: { userId },
    select: { date: true, wordCount: true, tags: true, imageCount: true },
    orderBy: { date: "desc" },
  });

  if (entries.length === 0) {
    return {
      totalWords: 0,
      totalDays: 0,
      currentStreak: 0,
      totalImages: 0,
      monthlyData: [],
      topTags: [],
    };
  }

  const dateStrings = entries.map((e) => dateToStr(e.date));

  const totalWords = entries.reduce((s, e) => s + e.wordCount, 0);
  const totalImages = entries.reduce((s, e) => s + e.imageCount, 0);
  const totalDays = new Set(dateStrings).size;
  const currentStreak = calcStreak(dateStrings);
  const monthlyData = groupByMonth(entries);
  const topTags = calcTopTags(entries);

  return { totalWords, totalDays, currentStreak, totalImages, monthlyData, topTags };
}

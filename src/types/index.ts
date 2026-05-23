export type Tone = "warm" | "genki" | "minimal" | "literary";

export type ApiProvider = "openrouter";

export interface DiarySummary {
  id: string;
  date: string;
  title?: string;
  preview: string;
  hasImages: boolean;
  wordCount: number;
  tags: string[];
  createdAt: string;
}

export interface MediaFile {
  url: string;
  path: string;
  type: "image" | "video";
  mime: string;
  size: number;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface CalendarEntry {
  id: string;
  date: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface MonthlyData {
  month: string;
  count: number;
  words: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface StatsData {
  totalWords: number;
  totalDays: number;
  currentStreak: number;
  totalImages: number;
  monthlyData: MonthlyData[];
  topTags: TagCount[];
}

export type Tone = "warm" | "genki" | "minimal" | "literary";

export type ApiProvider = "openrouter";

export interface UserConfig {
  apiProvider: ApiProvider;
  tone: Tone;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  title?: string;
  markdown: string;
  tone: Tone;
  tags: string[];
  images: MediaFile[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface AIGenerateRequest {
  text: string;
  images: MediaFile[];
  tone: Tone;
  date: string;
}

export interface AIGenerateResponse {
  markdown: string;
  title?: string;
  tags: string[];
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

export interface LocalApiKeyStore {
  provider: ApiProvider;
  apiKey: string;
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

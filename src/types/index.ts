export type Tone = "warm" | "genki" | "minimal" | "literary";

export type ApiProvider = "openrouter";

export type SubscriptionPlan = "free" | "basic" | "advanced";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete" | "trialing";

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

export interface SubscriptionData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  subscribedAt: string | null;
  canceledAt: string | null;
}

export interface PriceInfo {
  price: number;
  currency: string;
  interval: string;
  plan: SubscriptionPlan;
  label: string;
  features: string[];
  isCurrent: boolean;
}

export interface PricingData {
  stripeConfigured: boolean;
  plans: PriceInfo[];
}

export interface QuotaStatusData {
  tokenBudget: {
    used: number;
    limit: number;
    remaining: number;
    usedInCents: number;
  };
  storage: {
    used: number;
    limit: number;
    remaining: number;
  };
  modelRestriction: {
    allowedModels: string[] | "*";
    currentModel: string;
  };
  plan: string;
  planLabel: string;
  systemKeyAvailable: boolean;
}

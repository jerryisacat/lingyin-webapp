import { NextRequest } from "next/server";
import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers";
import { isStripeConfigured } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscription-service";
import pricing from "../../../../config/billing-pricing.json";
import type { PriceInfo, PricingData } from "@/types";

const TIER_LABELS: Record<string, string> = {
  free: "免费版",
  basic: "基础版",
  advanced: "高级版",
};

const FEATURES_MAP: Record<string, string[]> = {
  free: [
    "深色/浅色主题",
    "AI 写作（$1 Token 预算）",
    "50MB 存储空间",
    "PWA 离线使用",
  ],
  basic: [
    "深色/浅色主题",
    "全模型 AI 写作（$4 Token 预算）",
    "500MB 存储空间",
    "PWA 离线使用",
    "额度 25% 上月结转",
    "Telegram 通知",
  ],
  advanced: [
    "深色/浅色主题",
    "全模型 AI 写作（$20 Token 预算）",
    "5GB 存储空间",
    "PWA 离线使用",
    "额度 50% 上月结转",
    "Telegram 通知",
    "优先支持",
  ],
};

export async function GET(_request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  const subscription = await getUserSubscription(user.id);
  const currentPlan = subscription?.plan ?? "free";

  const plans: PriceInfo[] = Object.entries(pricing.tiers).map(([key, tier]) => ({
    price: tier.priceMonth,
    currency: "CNY",
    interval: "月",
    plan: key as "free" | "basic" | "advanced",
    label: TIER_LABELS[key] ?? tier.label,
    features: FEATURES_MAP[key] ?? [],
    isCurrent: key === currentPlan,
  }));

  const result: PricingData = {
    stripeConfigured: isStripeConfigured(),
    plans,
  };

  return jsonOk(result);
}

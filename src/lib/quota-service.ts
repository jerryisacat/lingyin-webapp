import { prisma } from "@/lib/db";
import billingPricing from "../../config/billing-pricing.json";

interface TierConfig {
  label: string;
  priceMonth: number;
  tokenBudgetUsd: number;
  storageBytes: number;
  allowedModels: string[] | "*";
}

interface ModelPricing {
  input: number;
  output: number;
}

function getTierConfig(plan: string): TierConfig {
  const tiers = billingPricing.tiers as Record<string, TierConfig>;
  return tiers[plan] ?? tiers.free;
}

function getModelPricing(model: string): ModelPricing {
  const models = billingPricing.models as Record<string, ModelPricing>;
  return models[model] ?? { input: 0, output: 0 };
}

export async function getUserPlan(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription: true },
  });
  return user?.subscription ?? "free";
}

export async function getUserTier(userId: string): Promise<TierConfig> {
  const plan = await getUserPlan(userId);
  return getTierConfig(plan);
}

export function isModelAllowed(tier: TierConfig, model: string): boolean {
  if (tier.allowedModels === "*") return true;
  return (tier.allowedModels as string[]).includes(model);
}

export async function checkModelAccess(
  userId: string,
  model: string
): Promise<{ allowed: boolean; plan: string; allowedModels: string[] | "*" }> {
  const plan = await getUserPlan(userId);
  const tier = getTierConfig(plan);
  return {
    allowed: isModelAllowed(tier, model),
    plan,
    allowedModels: tier.allowedModels,
  };
}

export async function getMonthlyTokenCost(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
    _sum: { costUsd: true },
  });

  return result._sum.costUsd ?? 0;
}

export async function getMonthlyTokenUsage(
  userId: string
): Promise<{ inputTokens: number; outputTokens: number; costUsd: number }> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      costUsd: true,
    },
  });

  return {
    inputTokens: result._sum.inputTokens ?? 0,
    outputTokens: result._sum.outputTokens ?? 0,
    costUsd: result._sum.costUsd ?? 0,
  };
}

export async function getStorageUsed(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageBytes: true },
  });
  return Number(user?.storageBytes ?? 0);
}

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}

export async function checkTokenBudget(
  userId: string
): Promise<QuotaCheckResult> {
  const plan = await getUserPlan(userId);
  const tier = getTierConfig(plan);
  const used = await getMonthlyTokenCost(userId);

  return {
    allowed: used < tier.tokenBudgetUsd,
    used: Math.round(used * 100) / 100,
    limit: tier.tokenBudgetUsd,
    remaining: Math.round((tier.tokenBudgetUsd - used) * 100) / 100,
    plan,
  };
}

export async function checkStorageBudget(
  userId: string,
  additionalBytes: number = 0
): Promise<QuotaCheckResult> {
  const plan = await getUserPlan(userId);
  const tier = getTierConfig(plan);
  const used = await getStorageUsed(userId);

  return {
    allowed: used + additionalBytes <= tier.storageBytes,
    used,
    limit: tier.storageBytes,
    remaining: tier.storageBytes - used - additionalBytes,
    plan,
  };
}

export function estimateTokensFromChars(
  text: string,
  isChinese: boolean = false
): number {
  if (!text) return 0;
  // Heuristic: ~1.5 chars per token for Chinese, ~4 for English
  const ratio = isChinese ? 1.5 : 3.5;
  return Math.ceil(text.length / ratio);
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(model);
  // Prices in billing are per 1M tokens
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

export async function recordTokenUsage(params: {
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const { userId, model, inputTokens, outputTokens } = params;
  const costUsd = estimateCost(model, inputTokens, outputTokens);

  await prisma.tokenUsage.create({
    data: {
      userId,
      model,
      inputTokens,
      outputTokens,
      costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
    },
  });
}

export async function trackStorageUsage(
  userId: string,
  bytes: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      storageBytes: { increment: bytes },
    },
  });
}

export async function releaseStorageUsage(
  userId: string,
  bytes: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      storageBytes: { decrement: bytes },
    },
  });
}

export interface QuotaStatus {
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
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const plan = await getUserPlan(userId);
  const tier = getTierConfig(plan);
  const [tokenCost, storageUsed] = await Promise.all([
    getMonthlyTokenCost(userId),
    getStorageUsed(userId),
  ]);

  return {
    tokenBudget: {
      used: Math.round(tokenCost * 100) / 100,
      limit: tier.tokenBudgetUsd,
      remaining: Math.round((tier.tokenBudgetUsd - tokenCost) * 100) / 100,
      usedInCents: Math.round(tokenCost * 100),
    },
    storage: {
      used: storageUsed,
      limit: tier.storageBytes,
      remaining: Math.max(0, tier.storageBytes - storageUsed),
    },
    modelRestriction: {
      allowedModels: tier.allowedModels,
      currentModel:
        billingPricing.baseModel as string,
    },
    plan,
    planLabel: tier.label,
  };
}

import { NextRequest } from "next/server";
import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET(_request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
    return jsonError("无权限访问", 403);
  }

  const [
    totalUsers,
    totalEntries,
    totalSubscriptions,
    tokenUsageTotal,
    topUpRevenue,
    topUpCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.entry.count(),
    prisma.subscription.count({ where: { status: { not: "canceled" } } }),
    prisma.tokenUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true, costUsd: true },
    }),
    prisma.tokenTopUp.aggregate({
      where: { status: "paid" },
      _sum: { priceCny: true, amountUsd: true },
    }),
    prisma.tokenTopUp.count({ where: { status: "paid" } }),
  ]);

  return jsonOk({
    totalUsers,
    totalEntries,
    activeSubscriptions: totalSubscriptions,
    tokenUsage: {
      totalInputTokens: tokenUsageTotal._sum.inputTokens ?? 0,
      totalOutputTokens: tokenUsageTotal._sum.outputTokens ?? 0,
      totalCostUsd: tokenUsageTotal._sum.costUsd ?? 0,
    },
    topUp: {
      totalRevenueCny: topUpRevenue._sum.priceCny ?? 0,
      totalAmountUsd: topUpRevenue._sum.amountUsd ?? 0,
      count: topUpCount,
    },
  });
}

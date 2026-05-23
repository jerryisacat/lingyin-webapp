import { NextRequest } from "next/server";
import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers";
import { getUserSubscription } from "@/lib/subscription-service";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET(_request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  try {
    const subscription = await getUserSubscription(user.id);
    return jsonOk({
      subscription,
      stripeConfigured: isStripeConfigured(),
    });
  } catch (error) {
    console.error("Failed to get subscription status:", error);
    return jsonError("获取订阅状态失败", 500);
  }
}

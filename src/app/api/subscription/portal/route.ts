import { NextRequest } from "next/server";
import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers";
import { getStripeServer, isStripeConfigured } from "@/lib/stripe";

export async function POST(_request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  if (!isStripeConfigured()) {
    return jsonError("支付服务暂未配置", 503);
  }

  try {
    const stripe = getStripeServer();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: (await stripe.customers.list({ email: user.email, limit: 1 })).data[0]?.id,
      return_url: `${appUrl}/subscription`,
    });

    return jsonOk({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return jsonError("无法打开管理页面，请确认你已有订阅记录", 400);
  }
}

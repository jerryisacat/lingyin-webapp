import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, jsonOk, jsonError, validateBody } from "@/lib/auth-helpers";
import { getStripeServer, getStripePriceId, isStripeConfigured } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["basic", "advanced"]),
});

export async function POST(request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  if (!isStripeConfigured()) {
    return jsonError("支付服务暂未配置，请稍后再试", 503);
  }

  const validated = await validateBody(request, checkoutSchema);
  if (validated instanceof NextResponse) return validated;

  const { plan } = validated.data;

  try {
    const stripe = getStripeServer();
    const priceId = getStripePriceId(plan);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        plan,
      },
      success_url: `${appUrl}/subscription?success=true`,
      cancel_url: `${appUrl}/subscription?canceled=true`,
      customer_email: user.email,
    });

    if (!session.url) {
      return jsonError("创建支付会话失败", 500);
    }

    return jsonOk({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "未知错误";
    return jsonError(`创建支付会话失败: ${message}`, 500);
  }
}

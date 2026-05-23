import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, jsonOk, jsonError, validateBody } from "@/lib/auth-helpers";
import { getStripeServer, isStripeConfigured, getTopUpLineItem } from "@/lib/stripe";
import { z } from "zod";

const topUpSchema = z.object({
  amountCny: z.number().refine((v) => [5, 20, 38].includes(v), {
    message: "无效的加购金额，可选: 5, 20, 38",
  }),
});

export async function POST(request: NextRequest) {
  const user = await getSessionUserId();
  if (!user) return jsonError("请先登录", 401);

  if (!isStripeConfigured()) {
    return jsonError("支付服务暂未配置，请稍后再试", 503);
  }

  const validated = await validateBody(request, topUpSchema);
  if (validated instanceof NextResponse) return validated;

  const { amountCny } = validated.data;
  const bundle = getTopUpLineItem(amountCny);

  if (!bundle) {
    return jsonError("无效的加购金额", 400);
  }

  try {
    const stripe = getStripeServer();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cny",
            product_data: {
              name: `Token 加购包 ¥${amountCny}`,
              description: `增加 $${bundle.usd} 等值 Token 预算`,
            },
            unit_amount: Math.round(amountCny * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        type: "topup",
        amountUsd: String(bundle.usd),
        amountCny: String(amountCny),
      },
      success_url: `${appUrl}/subscription?topup=success`,
      cancel_url: `${appUrl}/subscription?topup=canceled`,
      customer_email: user.email,
    });

    if (!session.url) {
      return jsonError("创建支付会话失败", 500);
    }

    return jsonOk({ url: session.url });
  } catch (error) {
    console.error("TopUp checkout error:", error);
    const message = error instanceof Error ? error.message : "未知错误";
    return jsonError(`创建支付会话失败: ${message}`, 500);
  }
}

import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/auth-helpers";
import { getStripeServer, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe";
import {
  upsertSubscription,
  updateSubscriptionStatus,
  createInvoice,
  cancelUserSubscription,
} from "@/lib/subscription-service";
import type { SubscriptionPlan } from "@/types";
import Stripe from "stripe";

const HANDLED_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

function extractUserId(obj: Record<string, unknown>): string | null {
  const metadata = obj.metadata as Record<string, string> | null | undefined;
  return metadata?.userId ?? null;
}

function extractPlan(obj: Record<string, unknown>): SubscriptionPlan {
  const metadata = obj.metadata as Record<string, string> | null | undefined;
  const plan = metadata?.plan;
  if (plan === "basic" || plan === "advanced") return plan;
  return "basic";
}

async function handleCheckoutCompleted(obj: Record<string, unknown>): Promise<void> {
  const userId = extractUserId(obj);
  if (!userId) {
    console.error("Webhook: missing userId in session metadata");
    return;
  }

  const plan = extractPlan(obj);
  const subscriptionId = (obj.subscription as string) ?? undefined;

  await upsertSubscription({
    userId,
    plan,
    status: "active",
    stripeId: subscriptionId,
    currentPeriodStart: new Date(),
  });

  console.log(`Webhook: subscription activated for user ${userId}, plan ${plan}`);
}

async function handleInvoicePaid(obj: Record<string, unknown>): Promise<void> {
  if (obj.billing_reason !== "subscription_cycle" && obj.billing_reason !== "subscription_create") {
    return;
  }

  const stripe = getStripeServer();
  let subscriptionId: string | undefined;

  if (typeof obj.subscription === "string") {
    subscriptionId = obj.subscription;
  } else if (obj.subscription && typeof obj.subscription === "object") {
    subscriptionId = (obj.subscription as Record<string, unknown>).id as string;
  }

  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const meta = (sub as unknown as Record<string, unknown>).metadata as Record<string, string> | null;
      if (meta?.userId) {
        const plan = (meta?.plan ?? "basic") as SubscriptionPlan;
        await upsertSubscription({
          userId: meta.userId,
          plan,
          status: "active",
          currentPeriodStart: sub.billing_cycle_anchor
            ? new Date(sub.billing_cycle_anchor * 1000)
            : undefined,
        });
      }
    } catch {
      console.error("Webhook: failed to retrieve subscription", subscriptionId);
    }
  }

  if (obj.status === "paid") {
    const userId = extractUserId(obj);
    if (userId) {
      await createInvoice({
        userId,
        stripeInvoiceId: obj.id as string,
        amount: (obj.amount_paid as number) ?? 0,
        status: "paid",
        paidAt: new Date(),
      });
    }
  }
}

async function handleInvoicePaymentFailed(obj: Record<string, unknown>): Promise<void> {
  const userId = extractUserId(obj);
  if (userId) {
    await updateSubscriptionStatus(userId, "past_due");
    console.log(`Webhook: subscription past_due for user ${userId}`);
  }
}

async function handleSubscriptionUpdated(obj: Record<string, unknown>): Promise<void> {
  const userId = extractUserId(obj);
  if (!userId) return;

  const stripe = getStripeServer();
  const subId = obj.id as string;
  if (!subId) return;

  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    const plan = extractPlan(sub as unknown as Record<string, unknown>);

    if (sub.status === "canceled") {
      await cancelUserSubscription(userId);
      return;
    }

    await upsertSubscription({
      userId,
      plan,
      status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "incomplete",
    });
  } catch (error) {
    console.error("Webhook: failed to process subscription update:", error);
  }
}

async function handleSubscriptionDeleted(obj: Record<string, unknown>): Promise<void> {
  const userId = extractUserId(obj);
  if (!userId) return;

  await cancelUserSubscription(userId);
  console.log(`Webhook: subscription canceled for user ${userId}`);
}

const HANDLERS: Record<string, (obj: Record<string, unknown>) => Promise<void>> = {
  "checkout.session.completed": handleCheckoutCompleted,
  "invoice.paid": handleInvoicePaid,
  "invoice.payment_failed": handleInvoicePaymentFailed,
  "customer.subscription.updated": handleSubscriptionUpdated,
  "customer.subscription.deleted": handleSubscriptionDeleted,
};

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return jsonError("Stripe 未配置", 503);
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonError("缺少 Stripe 签名", 400);
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeServer();
    const secret = getStripeWebhookSecret();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return jsonError("签名验证失败", 400);
  }

  const eventType = event.type;

  if (!HANDLED_EVENTS.includes(eventType as (typeof HANDLED_EVENTS)[number])) {
    return jsonOk({ received: true });
  }

  const handler = HANDLERS[eventType];
  if (!handler) {
    return jsonOk({ received: true });
  }

  try {
    await handler(event.data.object as unknown as Record<string, unknown>);
  } catch (error) {
    console.error(`Webhook handler error for ${eventType}:`, error);
    return jsonError("处理事件失败", 500);
  }

  return jsonOk({ received: true });
}

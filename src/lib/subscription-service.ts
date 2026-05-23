import { prisma } from "@/lib/db";
import type { SubscriptionPlan, SubscriptionStatus, SubscriptionData } from "@/types";

export interface UpsertSubscriptionParams {
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date | null;
}

export async function getUserSubscription(
  userId: string
): Promise<SubscriptionData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscription: true,
      subscriptionId: true,
      subscribedAt: true,
      subscriptionEnds: true,
    },
  });

  if (!user) return null;

  const sub = user.subscription || "free";

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, canceledAt: true },
  });

  return {
    plan: sub as SubscriptionPlan,
    status: (subscription?.status ?? (sub === "free" ? "active" : "incomplete")) as SubscriptionStatus,
    currentPeriodEnd: user.subscriptionEnds?.toISOString() ?? null,
    subscribedAt: user.subscribedAt?.toISOString() ?? null,
    canceledAt: subscription?.canceledAt?.toISOString() ?? null,
  };
}

export async function upsertSubscription(
  params: UpsertSubscriptionParams
): Promise<void> {
  const {
    userId,
    plan,
    status,
    stripeId,
    stripePriceId,
    currentPeriodStart,
    currentPeriodEnd,
    canceledAt,
  } = params;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status,
      stripeId,
      stripePriceId,
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt,
    },
    update: {
      plan,
      status,
      stripeId: stripeId ?? undefined,
      stripePriceId: stripePriceId ?? undefined,
      currentPeriodStart: currentPeriodStart ?? undefined,
      currentPeriodEnd: currentPeriodEnd ?? undefined,
      canceledAt: canceledAt === null ? null : (canceledAt ?? undefined),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscription: plan,
      subscriptionId: stripeId ?? undefined,
      subscribedAt: currentPeriodStart ?? undefined,
      subscriptionEnds: currentPeriodEnd ?? undefined,
    },
  });
}

export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus,
  canceledAt?: Date | null
): Promise<void> {
  const updateData: Record<string, unknown> = { status };
  if (canceledAt !== undefined) {
    updateData.canceledAt = canceledAt;
  }

  await prisma.subscription.update({
    where: { userId },
    data: updateData,
  });

  if (status === "canceled") {
    await prisma.user.update({
      where: { id: userId },
      data: { subscription: "free" },
    });
  }
}

export interface CreateInvoiceParams {
  userId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency?: string;
  status: string;
  paidAt?: Date;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<void> {
  await prisma.invoice.create({
    data: {
      userId: params.userId,
      stripeInvoiceId: params.stripeInvoiceId,
      amount: params.amount,
      currency: params.currency ?? "cny",
      status: params.status,
      paidAt: params.paidAt,
    },
  });
}

export async function cancelUserSubscription(userId: string): Promise<void> {
  await updateSubscriptionStatus(userId, "canceled", new Date());
  await prisma.user.update({
    where: { id: userId },
    data: { subscription: "free" },
  });
}

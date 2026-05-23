import Stripe from "stripe";
import { loadStripe } from "@stripe/stripe-js";

let stripeServer: Stripe | null = null;
let stripeServerInitFailed = false;

export function getStripeServer(): Stripe {
  if (stripeServer) return stripeServer;
  if (stripeServerInitFailed) {
    throw new Error("Stripe was previously initialized and failed — check STRIPE_SECRET_KEY");
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    stripeServerInitFailed = true;
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeServer = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
  });
  return stripeServer;
}

let stripeClientPromise: ReturnType<typeof loadStripe> | null = null;
let stripeClientInitFailed = false;

export function getStripeClient() {
  if (stripeClientPromise) return stripeClientPromise;
  if (stripeClientInitFailed) return null;

  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    stripeClientInitFailed = true;
    return null;
  }

  stripeClientPromise = loadStripe(key);
  return stripeClientPromise;
}

export function getStripePriceId(plan: "basic" | "advanced"): string {
  const key = plan === "basic"
    ? process.env.STRIPE_PRICE_BASIC_MONTHLY
    : process.env.STRIPE_PRICE_ADVANCED_MONTHLY;

  if (!key) {
    throw new Error(
      `STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY is not configured`
    );
  }
  return key;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_BASIC_MONTHLY &&
    process.env.STRIPE_PRICE_ADVANCED_MONTHLY
  );
}

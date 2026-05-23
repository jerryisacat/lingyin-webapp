---
children_hash: f4afebd082c92a2f82a5c519650811752a0ff69d20f29ae255cb7d991ba95c15
compression_ratio: 0.6345733041575492
condensation_order: 2
covers: [quota/_index.md, stripe_subscription/_index.md]
covers_token_total: 914
summary_level: d2
token_count: 580
type: summary
---
# Billing Domain (d2)

## Overview
Billing domain manages subscription payments, token quotas, storage limits, and unified API key resolution. Combines Stripe subscriptions with one-time top-ups for effective quota calculation. Central enforcement via `quota-service.ts` and `subscription-service.ts`.

## Subdomains & Key Entries

### Quota (`billing/quota/_index.md`)
- **Models**: `TokenUsage` (Prisma consumption tracking), `TokenTopUp` (Stripe purchases), `User.topUpBalanceUsd` (aggregated balance)
- **Core Service**: `src/lib/quota-service.ts` — token budget, storage quota, model limits, `getEffectiveApiKey` (user key priority → `OPENROUTER_API_KEY` fallback)
- **Free Tier** (`free_tier_quota_system.md`): Pre/post checks on `/api/generate`, `/api/rewrite`, `/api/test`; auto-invoked storage in `saveDiary`; `QuotaUsage.tsx` dashboard rendering
- **Top-Up & Unified Key** (`token_topup_and_unified_api_key.md`): `POST /api/topup/checkout` (¥5/¥20/¥38 tiers) + webhook; effective quota = subscription + top-up; all AI endpoints migrated to unified key selection
- **Flow**: request → pre-check → process → record usage → dashboard update

### Stripe Subscription (`billing/stripe_subscription/_index.md`)
- **Entry**: `stripe_subscription_implementation.md`
- **Integration**: Stripe SDK v22 (API 2026-04-22.dahlia); Checkout flow with `userId+plan` metadata; 5 webhook events
- **Components**:
  - Server client: `src/lib/stripe.ts` (`isStripeConfigured`)
  - Webhook route: `src/app/api/subscription/webhook/route.ts`
  - DB layer: `src/lib/subscription-service.ts` (get/upsert/update/cancel/createInvoice on User/Subscription/Invoice)
  - UI: `src/components/SubscriptionPlans.tsx`
  - Config: `config/billing-pricing.json` (basic/advanced plans, CNY invoices)
- **Env Requirements**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs
- **Flow**: Checkout → webhook → `upsertSubscription` → Prisma updates; falls back to basic plan on invalid input

## Relationships & Architecture
- Quota layer sits between API routes and AI services; aggregates subscription + top-up for unified budget/key resolution
- Cross-references: `billing/quota/free_tier_quota_system.md`, `token_topup_and_unified_api_key.md`, `stripe_subscription_implementation.md`
- Branch: `dev/v1`
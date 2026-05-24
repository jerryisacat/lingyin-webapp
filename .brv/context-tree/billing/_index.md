---
children_hash: c86dfafe4b0df51b9c3c65d34af9b45c153ae5068f1a1df1091739e8db5f18bc
compression_ratio: 0.465891472868217
condensation_order: 2
covers: [pricing/_index.md, quota/_index.md, stripe_subscription/_index.md]
covers_token_total: 1290
summary_level: d2
token_count: 601
type: summary
---
# Billing Domain (d2)

## Pricing Refactor
`subscription_pricing_refactor.md` updates tiers, token budgets, and UI while preserving margins/rollover.  
- Token budgets: basic 4.0→2.3 USD, advanced 20.0→12.0 USD (35% margin); new top-up bundles at 0.3/1.7/3.3 USD.  
- `FEATURES_MAP` switched to relative multipliers (2.3x, 12x); `QuotaUsage.tsx` now uses percentage-based display.  
- Data flow: `config/billing-pricing.json` → `/api/pricing` → QuotaUsage; Telegram label changed to “管理（Coming Soon）”.  
- Preserved: all models on paid tiers, 25%/50% rollover rates.

## Quota System
`free_tier_quota_system.md` + `token_topup_and_unified_api_key.md` define enforcement and unified key logic.  
- Core models: `TokenUsage`, `TokenTopUp`; `User.topUpBalanceUsd` aggregates balance.  
- `quota-service.ts` (`src/lib/quota-service.ts`) provides budget checks, storage quotas, model limits, and `getEffectiveApiKey` (user key priority → `OPENROUTER_API_KEY` fallback).  
- Free tier: pre-check + post-stream recording on `/api/generate|rewrite|test`; storage tracking in `saveDiary`; `QuotaUsage.tsx` renders progress bars.  
- Top-up: Stripe endpoints `POST /api/topup/checkout` (¥5/¥20/¥38) + webhook; effective quota = subscription + top-up; all AI endpoints migrated to unified key selection.

## Stripe Subscription
`stripe_subscription_implementation.md` implements Checkout + webhook flow (#10).  
- Stripe SDK v22 (API 2026-04-22.dahlia); server client in `src/lib/stripe.ts` with `isStripeConfigured`.  
- Checkout via API session creation; webhooks at `src/app/api/subscription/webhook/route.ts` handle 5 events (`checkout.session.completed`, `invoice.paid`, etc.).  
- DB layer: `src/lib/subscription-service.ts` (get/upsert/update/cancel/createInvoice) using Prisma `User/Subscription/Invoice`.  
- UI: `SubscriptionPlans.tsx`; config in `config/billing-pricing.json`; required env vars listed.  
- Flow: Checkout → webhook → `upsertSubscription` → Prisma updates; falls back to basic on invalid input.

## Cross-Domain Relationships
Quota layer sits between API routes and AI services; aggregates subscription + top-up for unified budget/key resolution.  
Cross-references: `billing/quota/free_tier_quota_system.md`, `token_topup_and_unified_api_key.md`, `stripe_subscription_implementation.md`.  
All entries share `config/billing-pricing.json` and `QuotaUsage.tsx` as central display points.
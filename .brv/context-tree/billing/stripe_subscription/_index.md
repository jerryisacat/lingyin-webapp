---
children_hash: f3516a6ccd687072db1b7d3c35764218fc80e8838fa43854a7b2b958ba457082
compression_ratio: 0.8879120879120879
condensation_order: 1
covers: [stripe_subscription_implementation.md]
covers_token_total: 455
summary_level: d1
token_count: 404
type: summary
---
## Stripe Subscription Implementation

**Entry:** `stripe_subscription_implementation.md` (billing/stripe_subscription/)

### Overview
Stripe SDK v22 (API 2026-04-22.dahlia) integration for subscription payments (#10). Uses Checkout flow with metadata (userId+plan), 5 webhook events, Prisma-backed DB operations via subscription-service, and SubscriptionPlans UI component. Related to `billing/quota/free_tier_quota_system.md` and `billing/quota/token_topup_and_unified_api_key.md`.

### Architecture & Flow
- **Init:** Server-side Stripe client in `src/lib/stripe.ts` (env validation, `isStripeConfigured`).
- **Checkout:** API-driven session creation → redirect.
- **Webhooks:** Route at `src/app/api/subscription/webhook/route.ts` processes `checkout.session.completed`, `invoice.paid`, and 3 other events.
- **DB Layer:** `src/lib/subscription-service.ts` provides get/upsert/update/cancel/createInvoice using Prisma (User, Subscription, Invoice models).
- **UI:** `src/components/SubscriptionPlans.tsx` handles plan selection, current-plan detection, and redirect.
- **Config:** `config/billing-pricing.json`; supports basic/advanced plans, CNY invoices, payment failure handling.
- **Flow:** Checkout → webhook events → `upsertSubscription` → Prisma updates.

### Dependencies & Rules
- Required env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_ADVANCED_MONTHLY`.
- Webhooks restricted to configured events; falls back to basic plan on invalid input; all Stripe vars required for configuration check.
- Branch: `dev/v1`.
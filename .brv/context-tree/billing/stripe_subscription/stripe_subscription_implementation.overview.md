- Key points
  - Integrates Stripe SDK v22 (API 2026-04-22.dahlia) for subscription payments using Checkout with userId+plan metadata
  - Handles 5 webhook events and delegates DB operations to subscription-service.ts (get/upsert/update/cancel/createInvoice via Prisma)
  - UI component SubscriptionPlans.tsx supports plan selection, current-plan detection, and redirect to Checkout
  - Requires specific env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, price IDs, etc.) and falls back to basic plan on invalid input
  - Supports basic/advanced monthly plans with invoice creation in CNY and payment-failure handling

- Structure / sections summary
  - Reason: Curate Stripe subscription feature
  - Raw Concept: Task description, changes, listed files, high-level flow, timestamp
  - Narrative: Structure (server init, service, webhook route, UI), Dependencies (env vars + Prisma models), Highlights (plans, detection, CNY invoices), Rules (event filtering, env checks)

- Notable entities, patterns, or decisions
  - Entities: Prisma User/Subscription/Invoice models; files src/lib/stripe.ts, src/lib/subscription-service.ts, webhook route, SubscriptionPlans.tsx, config/billing-pricing.json
  - Patterns: Webhook-driven upsert flow, env-var guarded configuration (isStripeConfigured), metadata passing in Checkout sessions
  - Decisions: Only process configured webhook events; branch dev/v1; all Stripe env vars mandatory
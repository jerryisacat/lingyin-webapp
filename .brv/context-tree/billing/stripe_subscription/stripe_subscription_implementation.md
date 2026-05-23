---
title: Stripe Subscription Implementation
summary: Stripe SDK integration (v22, API 2026-04-22.dahlia) with Checkout, 5 webhook events, subscription-service DB ops, and SubscriptionPlans UI component
tags: []
related: []
keywords: []
createdAt: '2026-05-23T14:44:29.042Z'
updatedAt: '2026-05-23T14:44:29.042Z'
---
## Reason
Curate Stripe subscription payment feature from provided context

## Raw Concept
**Task:**
Implement Stripe subscription payments (#10 Subscription)

**Changes:**
- Stripe SDK v22 integration
- Checkout API with userId+plan metadata
- Webhook handling for 5 events
- subscription-service.ts for DB operations

**Files:**
- src/lib/stripe.ts
- src/lib/subscription-service.ts
- src/app/api/subscription/webhook/route.ts
- src/components/SubscriptionPlans.tsx
- config/billing-pricing.json

**Flow:**
Checkout -> Webhook events -> upsertSubscription -> Prisma User/Subscription/Invoice updates

**Timestamp:** 2026-05-23

## Narrative
### Structure
Server Stripe init in src/lib/stripe.ts with env checks; subscription-service handles get/upsert/update/cancel/createInvoice using Prisma; webhook route processes checkout.session.completed, invoice.paid, etc.; UI in SubscriptionPlans with plan selection and redirect

### Dependencies
STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_BASIC_MONTHLY, STRIPE_PRICE_ADVANCED_MONTHLY env vars; Prisma models for User, Subscription, Invoice

### Highlights
Supports basic/advanced plans, current plan detection, payment failure handling, invoice creation in CNY; branch dev/v1

### Rules
Webhook only processes configured events; falls back to basic plan if invalid; requires all Stripe env vars for isStripeConfigured

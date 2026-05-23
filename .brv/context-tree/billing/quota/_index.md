---
children_hash: 304269d959f3e6f1c327312205331319861b07c4d06c17cb5e312227d80a0214
compression_ratio: 0.5226628895184136
condensation_order: 1
covers: [free_tier_quota_system.md, token_topup_and_unified_api_key.md]
covers_token_total: 706
summary_level: d1
token_count: 369
type: summary
---
# Billing/Quota Domain (d1)

## Core Models & Services
- **TokenUsage** (Prisma): tracks token consumption and storage size
- **TokenTopUp** (Prisma): records one-time Stripe purchases; `User.topUpBalanceUsd` aggregates balance
- **quota-service.ts** (`src/lib/quota-service.ts`): central enforcement layer providing token budget, storage quota, model limit checks, and `getEffectiveApiKey` (user key priority → system `OPENROUTER_API_KEY` fallback)

## Free Tier Quota System (`free_tier_quota_system.md`)
- Enforces limits on `/api/generate`, `/api/rewrite`, `/api/test` via pre-check + post-stream recording
- Storage tracking auto-invoked in `saveDiary`
- `QuotaUsage.tsx` renders progress bars on dashboard
- Flow: request → pre-check → process → record usage → dashboard update

## Token TopUp & Unified API Key (`token_topup_and_unified_api_key.md`)
- Stripe checkout endpoints: `POST /api/topup/checkout` (¥5/¥20/¥38 tiers) + webhook handler
- Effective quota = subscription + top-up balance
- All AI endpoints migrated to use unified key selection
- `QuotaUsage` extended with top-up buttons and system-key status indicators

## Relationships & Architecture
- Cross-references: `billing/quota/free_tier_quota_system.md`, `token_topup_and_unified_api_key.md`, `billing/stripe_subscription/stripe_subscription_implementation.md`
- Quota layer sits between API routes and AI services; `quota-service` aggregates subscription + top-up for unified budget and key resolution
---
title: Token TopUp and Unified API Key
summary: Token top-up packages via Stripe, TokenTopUp model, topUpBalanceUsd, unified getEffectiveApiKey with user key priority, quota effective budget, AI endpoint migration, QuotaUsage UI updates
tags: []
related: [billing/quota/free_tier_quota_system.md, billing/stripe_subscription/stripe_subscription_implementation.md]
keywords: []
createdAt: '2026-05-23T15:36:23.047Z'
updatedAt: '2026-05-23T15:36:23.047Z'
---
## Reason
Curate RLM context about token top-up packages and API key unification

## Raw Concept
**Task:**
Implement Token top-up packages and unified API Key system

**Changes:**
- 新增 TokenTopUp 模型
- User.topUpBalanceUsd
- POST /api/topup/checkout (Stripe ¥5/¥20/¥38)
- Webhook top-up mode
- quota-service 有效预算=套餐+加购余额
- getEffectiveApiKey (用户Key优先→系统OPENROUTER_API_KEY)
- AI端点全部迁移
- QuotaUsage 加购按钮+系统Key状态提示

**Flow:**
Top-up checkout -> Stripe webhook -> update topUpBalance -> effective quota calc -> getEffectiveApiKey fallback

## Narrative
### Structure
Billing extended with one-time Stripe top-ups for tokens; quota-service aggregates subscription + top-up; unified key selection prioritizes user-provided then system key

### Highlights
Supports ¥5/¥20/¥38 top-up tiers; seamless fallback to system OPENROUTER_API_KEY; all AI endpoints migrated

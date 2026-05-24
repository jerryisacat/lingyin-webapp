---
children_hash: 2297bfde7ca4f9fcd679dc037cec86714a672345aa048fe5c82b916c2b4fbae0
compression_ratio: 0.39390088945362134
condensation_order: 1
covers: [subscription_pricing_refactor.md]
covers_token_total: 787
summary_level: d1
token_count: 310
type: summary
---
# Subscription Pricing Refactor

**Entry:** `subscription_pricing_refactor.md` (consolidated from abstract/ overview variants)

## Overview
Refactor driven by issues #102/#105 updates subscription tiers, token budgets, and UI display logic while preserving margins and rollover behavior.

## Key Changes
- **Token budgets**: basic 4.0 → 2.3 USD; advanced 20.0 → 12.0 USD (35% margin)
- **Top-up bundles**: new options at 0.3 / 1.7 / 3.3 USD
- **FEATURES_MAP**: switched from absolute USD values to relative multipliers (2.3x, 12x)
- **QuotaUsage.tsx**: token display changed from `formatUsd` to percentage-based (used/remaining/rollover)
- **UI label**: Telegram changed from "通知" to "管理（Coming Soon）"

## Architecture & Data Flow
- `config/billing-pricing.json` defines tiers (free/basic/advanced), models, and top-up bundles
- `src/app/api/pricing/route.ts` serves plans with updated FEATURES_MAP
- `src/components/QuotaUsage.tsx` renders progress bars using percentages
- Flow: pricing config → `/api/pricing` endpoint → QuotaUsage display

## Preserved Rules & Highlights
- All models allowed on paid tiers
- Rollover rates remain 25% (basic) / 50% (advanced)
- FEATURES_MAP now uses relative multipliers instead of absolute USD amounts
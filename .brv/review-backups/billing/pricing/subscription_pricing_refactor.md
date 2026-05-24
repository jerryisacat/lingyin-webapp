---
title: Subscription Pricing Refactor
summary: Updated token budgets (basic 2.3, advanced 12.0), FEATURES_MAP to multipliers, QuotaUsage to percentages, top-up bundles 0.3/1.7/3.3 USD
tags: []
related: []
keywords: []
createdAt: '2026-05-23T19:44:29.764Z'
updatedAt: '2026-05-23T19:44:29.764Z'
---
## Reason
Curate pricing changes from issues #102 & #105

## Raw Concept
**Task:**
Refactor subscription pricing and copy for issues #102 & #105

**Changes:**
- basic tokenBudgetUsd: 4.0 → 2.3
- advanced tokenBudgetUsd: 20.0 → 12.0 (35% margin)
- topUp bundles: 0.3/1.7/3.3 USD
- FEATURES_MAP: removed USD amounts, use multipliers (2.3x, 12x)
- Telegram: "通知" → "管理（Coming Soon）"
- QuotaUsage: token display from formatUsd to percentages (used/remaining/rollover)

**Files:**
- config/billing-pricing.json
- src/app/api/pricing/route.ts
- src/components/QuotaUsage.tsx

**Flow:**
pricing config → api/pricing endpoint → QuotaUsage display

**Timestamp:** 2026-05-22

**Author:** issues #102 #105

## Narrative
### Structure
billing-pricing.json defines tiers (free/basic/advanced), models, topUp bundles; api/pricing serves plans with FEATURES_MAP; QuotaUsage shows progress bars with %

### Highlights
Preserved 35% margin on advanced; all models allowed on paid; rollover 25%/50%

### Rules
FEATURES_MAP uses relative multipliers instead of absolute USD

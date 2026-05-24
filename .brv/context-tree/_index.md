---
children_hash: fc718d31d83b3bf2f18c542c6444911b944fdd099270b9d20275e2b7723ab9e2
compression_ratio: 0.3539852645679839
condensation_order: 3
covers: [api/_index.md, billing/_index.md, project/_index.md, structure/_index.md, ui/_index.md]
covers_token_total: 2986
summary_level: d3
token_count: 1057
type: summary
---
# Knowledge Structure Overview (d3)

## api Domain
Covers AI integration testing and OpenRouter client configuration.  
- `api/_index.md` (d2) summarizes `ai_integration/_index.md` and `api_test_endpoint_and_openrouter_client.md`.  
- Key elements: 10s preflight to `/models`, `logConnectionError` for network codes, `HTTP-Referer` fallback, POST restricted to `openrouter` provider, 15s timeout on `chat.completions.create`.  
- Files: `src/app/api/ai/test/route.ts`, `src/lib/ai/client.ts`.  
- Relationships: Depends on `billing/quota` for unified key resolution; feeds `structure` AI client centralization.

## billing Domain
Manages pricing, quotas, and Stripe subscriptions.  
- `billing/_index.md` (d2) aggregates `pricing/`, `quota/`, `stripe_subscription/`.  
- Pricing (`subscription_pricing_refactor.md`): token budgets reduced (basic 4.0→2.3 USD, advanced 20.0→12.0 USD), `FEATURES_MAP` multipliers, `config/billing-pricing.json` source.  
- Quota (`free_tier_quota_system.md`, `token_topup_and_unified_api_key.md`): `TokenUsage`/`TokenTopUp` models, `quota-service.ts`, `getEffectiveApiKey`, pre/post checks on AI endpoints, Stripe top-up webhooks.  
- Stripe (`stripe_subscription_implementation.md`): v22 SDK, webhook handlers for 5 events, `subscription-service.ts`, `SubscriptionPlans.tsx`.  
- Cross-relationships: Quota layer mediates API routes ↔ AI services; shared config with `structure` and `ui/QuotaUsage.tsx`.

## project Domain
Tracks context curation workflows.  
- `project/_index.md` (d2) covers `context_curation/_index.md` and `rlm_context_curation.md`.  
- Workflow: single-pass `context → extract → UPSERT` on 787-char RLM variables (2026-05-22).  
- Highlights: auto-detected single-pass mode, no chunking required.

## structure Domain
Defines core architecture, security, storage, and application modules.  
- `structure/_index.md` (d2) spans privacy, AI, storage, and app core entries.  
- Privacy: local-only keys, owner-only R2 presigned URLs (`local-only-api-key-privacy-posture.md`).  
- Security: Upstash rate limiting (8 endpoints, `checkRateLimit`), response headers (2026-05-23), multi-layer guards on AI endpoints (`multi-layer-ai-endpoint-protection.md`).  
- AI: OpenRouter-only client (`openrouter-ai-client-centralization.md`), `ProviderConfig`, `createOpenAIClient`, parallel `describeImages`.  
- Storage: R2 path builders, `deleteDirectory`, owner checks on `/api/image` (`storage/_index.md`).  
- Core: `src_app/_index.md`, `src_config/_index.md`, `stats/_index.md` (Prisma aggregates, streak walk, `DashboardStats.tsx`).  
- Relationships: Centralizes guards used by `api` and `billing`; referenced by `ui` for auth-driven rendering.

## ui Domain
Captures navigation, conditional rendering, timeline, and design system.  
- `ui/_index.md` (d2) covers auth, landing, nav, logout, timeline, and specs.  
- Auth: session-driven branching via `PUBLIC_ROUTES`, `NO_SHELL_ROUTES`, middleware, `AppShell` (`auth-driven-conditional-rendering.md`).  
- Landing: dual-state root page with Hero/features for guests vs. dashboard for users (`landing/_index.md`).  
- Navigation: unified `GlassNavBar.tsx` + `config/navigation.json`, framer-motion indicators (`glass_nav_bar/_index.md`).  
- Logout: consistent `signOut` with 800 ms long-press on mobile (`logout/_index.md`).  
- Timeline: `CalendarView.tsx`, `/api/entries?view=calendar`, cursor preservation (`timeline/_index.md`).  
- Design: v2.0 spec (sakura `#f0a8b0`, glassmorphism, LCP < 2 s) in `epic_30/_index.md`; interactive demo (`demo/_index.md`).  
- Cross-relationships: Session state links to `structure` security and `billing` quota display; all reference concrete `src/app` and `src/components` paths.

## Cross-Domain Patterns
- Session/Supabase state drives auth, quota, and rendering across `ui`, `structure`, `billing`.  
- Unified key resolution (`billing/quota`) and rate-limiting (`structure/security`) protect all AI endpoints (`api`).  
- Central config files (`config/billing-pricing.json`, `config/navigation.json`) and shared components (`QuotaUsage.tsx`, `GlassNavBar.tsx`) recur as integration points.  
- All domains reference concrete file paths and API signatures for drill-down into d2/d1 entries.
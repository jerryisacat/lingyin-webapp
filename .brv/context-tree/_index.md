---
children_hash: ebe5b8cb6b3903385c6a7507644a3d8f83ed75a6d9e5058886e3b94bc96ea06d
compression_ratio: 0.4171251719394773
condensation_order: 3
covers: [api/_index.md, billing/_index.md, project/_index.md, structure/_index.md, ui/_index.md]
covers_token_total: 2908
summary_level: d3
token_count: 1213
type: summary
---
# Context Tree Structural Overview (d3)

The `.brv/context-tree/` organizes project knowledge across five domains: `api`, `billing`, `project`, `structure`, and `ui`. Each domain maintains d2 `_index.md` summaries that aggregate d1 entries. Core architectural pattern: centralized services (quota, subscription, AI client, storage) enforce privacy, auth-driven rendering, and unified key resolution. All domains cross-reference `src/app`, `src/lib`, and config files.

## api Domain
Covers AI integration only.  
- `ai_integration/_index.md` consolidates `api_test_endpoint_and_openrouter_client.md`: OpenRouter-only client (`src/lib/ai/client.ts`), 10s preflight to `/models`, `HTTP-Referer` fallback, structured error logging (`logConnectionError`), `POST /api/ai/test` restricted to `openrouter` provider.  
- Dependencies: `getUserDecryptedApiKey`, 15s timeout, Vercel `hkg1` guidance.  
Drill-down: `api/ai_integration/api_test_endpoint_and_openrouter_client.md`.

## billing Domain
Manages subscriptions, quotas, and unified API keys.  
- `quota/_index.md` covers `free_tier_quota_system.md` and `token_topup_and_unified_api_key.md`: `src/lib/quota-service.ts` (effective budget = subscription + top-up), `TokenUsage`/`TokenTopUp` models, pre/post checks on AI endpoints, `getEffectiveApiKey` (user key priority → `OPENROUTER_API_KEY`), Stripe top-up webhooks (¥5/¥20/¥38).  
- `stripe_subscription/_index.md` covers `stripe_subscription_implementation.md`: Stripe SDK v22, 5 webhook events, `src/lib/subscription-service.ts` (upsert/cancel), `config/billing-pricing.json`, fallback to basic plan.  
Relationships: Quota layer sits between routes and AI services; cross-references `structure/security`.  
Drill-down: `billing/quota/*.md`, `billing/stripe_subscription/*.md`.

## project Domain
Captures curation workflows.  
- `context_curation/_index.md` covers `rlm_context_curation.md`: single-pass `context → extract → UPSERT` (787-char RLM variable, no chunking), 2026-05-22 timestamp.  
Drill-down: `project/context_curation/rlm_context_curation.md`.

## structure Domain
Defines core architecture, privacy, and services.  
- `local-only-api-key-privacy-posture.md`: client-only keys, owner-verified R2 presigned URLs (`/api/image` + `getUser()`), full `deleteDirectory` on diary removal.  
- `openrouter-ai-client-centralization.md`: sole provider OpenRouter (`baseURL: https://openrouter.ai/api/v1`), `ProviderConfig` + `PROVIDER_CONFIGS` map, `createOpenAIClient`/`generateStream`/`describeImage`.  
- `security/_index.md` (covers `rate_limiting.md`, `security_hardening.md`): Upstash sliding-window on 8 endpoints, `checkRateLimit()` (fail-open dev), generic AI errors, removed preflight (2026-05-23).  
- `src_app/_index.md` (covers `application_source.md`): Next.js flows (auth → diary → timeline), `ApiProvider` union, tone types (`warm|genki|minimal|literary`).  
- `stats/_index.md` (covers `dashboard_stats_module.md`): `src/lib/stats.ts` single `findMany` aggregation (`totalWords`, `streak`, `monthlyData`), `GET /api/stats`, `DashboardStats.tsx`.  
- `storage/_index.md` (covers `r2_privacy_and_asset_management.md`): S3Client path `users/{userId}/entries/{year}/{month}`, 3600s presigned, `NetworkOnly` SW, no `R2_PUBLIC_URL`.  
Relationships: Privacy invariants enforced across storage, auth, and landing.  
Drill-down: individual `.md` files under each subtopic.

## ui Domain
Consolidates rendering, design, and interaction patterns.  
- `auth-driven-conditional-rendering.md`: Supabase session as source of truth; `PUBLIC_ROUTES` + `NO_SHELL_ROUTES`; middleware + `AppShell.tsx` branching.  
- `landing/_index.md` (covers `landing_page_and_auth_routing.md`, `landing_page_refactor.md`): dual-state `src/app/page.tsx`, 2026-05-23 glassmorphism refactor, OSS mentions, sticky navbar.  
- `epic_30/_index.md` (from `docs/issue-30-spec.md`): 9-module PWA spec (tokens `#f0a8b0`/`#faf3e8`, FOUC script, sakura, LCP < 2s, WCAG AA); source `globals.css`/`tailwind.config.ts`.  
- `demo/_index.md`: `public/demo.html` (Tailwind CDN, 18 GPU particles, zero-FOUC toggle).  
- `logout/_index.md`: unified `signOut` (settings, Header, 800ms long-press on `MobileTabBar.tsx`).  
- `timeline/_index.md` (covers `calendar_view_implementation.md`): `CalendarView.tsx` month grid + sakura dots, `?view=calendar` API, list/calendar toggle.  
Relationships: Auth session drives all conditional UI; design tokens unify epic/demo/landing.  
Drill-down: `ui/*/*.md` and referenced component files.

## Cross-Domain Patterns
- Auth (Supabase) and privacy (local keys, owner-only R2) are foundational.  
- AI access centralized via OpenRouter + quota-service.  
- No external libs beyond Tailwind/lucide-react; performance (LCP/CLS) and accessibility emphasized.  
- All entries reference `src/app`, `src/lib`, and config files for traceability.
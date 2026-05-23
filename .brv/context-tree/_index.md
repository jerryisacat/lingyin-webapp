---
children_hash: 5f440c34d57cdc38407855b55220d0d9d0dc9f06f6a16bc80876de35a6d17ab1
compression_ratio: 0.40681362725450904
condensation_order: 3
covers: [api/_index.md, project/_index.md, structure/_index.md, ui/_index.md]
covers_token_total: 1996
summary_level: d3
token_count: 812
type: summary
---
# Knowledge Structure (d3)

## api/
Consolidates AI integration testing and OpenRouter client configuration.

- **ai_integration/_index.md**: Covers `api_test_endpoint_and_openrouter_client.md`
  - Scope: Connectivity diagnostics, 10s preflight to `https://openrouter.ai/api/v1/models`, `HTTP-Referer` fallback to `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_SITE_URL`
  - Files: `src/app/api/ai/test/route.ts`, `src/lib/ai/client.ts`
  - Flow: POST → auth → provider validation → key decrypt → preflight → `chat.completions.create` (15s timeout) → `logConnectionError()` for `ENOTFOUND`/`ECONNREFUSED`/`TLS`
  - Response: `{connected: boolean, error?, detail?}`; restricted to `openrouter` provider

## project/
Covers context curation workflows.

- **context_curation/_index.md**: Single `rlm_context_curation.md` entry
  - Workflow: single-pass (`context → extract → UPSERT`), 787-char RLM variable handling, no chunking
  - Key facts: Task "Curate RLM context content", timestamp 2026-05-22, auto-detected single-pass mode

## structure/
Consolidates security, application source, and storage domains.

- **security/_index.md** (`security_hardening.md`): Response headers in `next.config.mjs`; AI endpoint error leakage fixed (generic client messages + server logging); removed OpenRouter preflight from test endpoint
- **src_app/_index.md** (`application_source.md`): Next.js `src/app` handles auth, diary CRUD, timeline, settings. Core: `layout.tsx`, `page.tsx`. LLM restricted to `openrouter` (baseURL `https://openrouter.ai/api/v1`, model `openai/gpt-4o-mini`, headers `HTTP-Referer`/`X-Title`). `ProviderConfig` interface + `PROVIDER_CONFIGS` map enable extensibility. Functions: `createOpenAIClient`, `generateStream`, `describeImage`/`describeImages`. Local API keys only; tone types: `warm | genki | minimal | literary`
- **storage/_index.md** (`r2_privacy_and_asset_management.md`): Owner-only R2 access via presigned URLs (3600s), no public fallbacks, asset cleanup on delete. Files: `src/lib/storage.ts` (S3Client, `buildMarkdownPath`/`buildAssetPath`, `getPresignedUrl`, `deleteDirectory`), `src/app/api/image/route.ts` (owner verification), `src/lib/diary.ts` (`deleteDiary`), `src/sw.ts` (`NetworkOnly` for `/api/image`). Depends on Prisma `Entry`, R2 env vars

## ui/
Consolidates demo, Epic #30 design spec, and landing/auth routing.

- **demo/_index.md**, **epic_30/_index.md**, **landing/_index.md**: Sources `public/demo.html`, `docs/issue-30-spec.md`, `src/app/{globals.css,layout.tsx,page.tsx}`, `src/components/AppShell.tsx`
- Architectural decisions: CSS vars (sakura `#f0a8b0`, warm white `#faf3e8`), blocking FOUC script in `layout.tsx`, GPU sakura particles (18), Tailwind-only transitions, `PUBLIC_ROUTES`/`NO_SHELL_ROUTES` constants, LCP <2s / CLS <0.1 / WCAG AA targets
- Modules (9): Design Tokens, Dark Mode, Landing, Navigation, Diary Editor, Timeline, Login/Settings, Micro-interactions, Onboarding
- Landing: Dual-state root (public hero/features vs. authenticated minimal dashboard); Supabase session drives rendering; middleware marks `/` public
- Demo: Interactive single-file flow with zero-FOUC toggle, typewriter, sakura, PWA tab feedback

Drill-down targets: individual `_index.md` and leaf `.md` files per domain.
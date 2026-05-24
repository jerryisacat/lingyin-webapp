---
children_hash: 8c1351313dede427ecd4d8d3bf1a58091755dc057b7d6bc7687f37cab45b1d1f
compression_ratio: 0.3079073482428115
condensation_order: 2
covers: [local-only-api-key-privacy-posture.md, multi-layer-ai-endpoint-protection.md, openrouter-ai-client-centralization.md, security/_index.md, src_app/_index.md, src_config/_index.md, stats/_index.md, storage/_index.md]
covers_token_total: 2504
summary_level: d2
token_count: 771
type: summary
---
structure

### Privacy & Security Posture
- **Local-Only API Key & Privacy Posture** (`local-only-api-key-privacy-posture.md`): API keys and assets stored/accessed exclusively client-side or via owner-only presigned URLs; no server-side key management. Enforced in storage (owner verification on `/api/image`, asset deletion on diary removal) and UI (landing/auth highlights).
- **Multi-Layer AI Endpoint Protection** (`multi-layer-ai-endpoint-protection.md`): Sequential guards on `/api/generate`, `/api/rewrite`, `/api/test`, `/api/ai/test`: (1) auth + rate limiting (structure), (2) quota pre-checks + unified key resolution (billing), (3) OpenRouter client execution (api). Fail-closed in prod; generic client errors + server logging only.
- **Security** (`security/_index.md`): 
  - Rate Limiting (`rate_limiting.md`): Upstash sliding-window via `@upstash/ratelimit` + Redis on 8 endpoints (login/register/email/password/AI); unified `checkRateLimit()` in `src/lib/rate-limit.ts` (fail-open dev, fail-closed prod).
  - Security Hardening (`security_hardening.md`): Response headers in `next.config.mjs`; timestamped 2026-05-23.

### AI Integration
- **OpenRouter AI Client Centralization** (`openrouter-ai-client-centralization.md`): Sole supported provider. `api`: POST `/api/ai/test` validates `openrouter` only, 10s preflight GET `/models`, 15s `chat.completions.create`, `HTTP-Referer` fallback to `NEXT_PUBLIC_*_URL`, `logConnectionError` for network/TLS cases. `structure`: `ProviderConfig` interface, `createOpenAIClient`, `generateStream`, `describeImage`/`describeImages` (parallel `Promise.allSettled`); `PROVIDER_CONFIGS` map + `ApiProvider` union for extensibility; baseURL `https://openrouter.ai/api/v1`; default model `openai/gpt-4o-mini`.

### Storage & Assets
- **R2 Privacy and Asset Management** (`storage/_index.md`): Privacy hardening for Cloudflare R2 (Issue #23). `src/lib/storage.ts`: S3Client, path builders under `users/{userId}/entries/{year}/{month}/`, `getPresignedUrl` (3600s TTL), new `deleteDirectory` (prefix batch via `ListObjectsV2` + `DeleteObjectsCommand`). `/api/image` (`src/app/api/image/route.ts`): `getUser()` + owner check (404 on mismatch). `src/lib/diary.ts`: `deleteDiary` calls storage cleanup before Prisma. SW (`src/sw.ts`): `/api/image` → `NetworkOnly`. Removed `R2_PUBLIC_URL` and remote domains from `next.config`.

### Application Core
- **Application Source** (`src_app/_index.md`): Next.js `src/app` handles auth, diary CRUD, timeline, settings. Core: `layout.tsx`, `page.tsx`. Integrates Prisma, local API keys, UI upgrades. Tone union: `warm | genki | minimal | literary`.
- **Configuration Module** (`src_config/_index.md`): Central config loading/usage in `src/config`.
- **Dashboard Stats Module** (`stats/_index.md`): Server-side aggregates (`src/lib/stats.ts`: single Prisma `findMany` + JS → `totalWords`, `totalDays`, `streak`, `monthlyData`, `topTags`); `GET /api/stats`; `DashboardStats.tsx` (Tailwind bar chart, four states). Streak: single-pass backward walk. Mounted on authenticated home; minimal dependencies.
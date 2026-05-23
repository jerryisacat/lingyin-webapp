---
children_hash: 3932817da11f8037c5f68837fa14c301896d4737e9010d6a519d25eb65e5b2e6
compression_ratio: 0.2941747572815534
condensation_order: 2
covers: [local-only-api-key-privacy-posture.md, openrouter-ai-client-centralization.md, security/_index.md, src_app/_index.md, stats/_index.md, storage/_index.md]
covers_token_total: 2060
summary_level: d2
token_count: 606
type: summary
---
**structure/**

- **local-only-api-key-privacy-posture.md**: API keys stored exclusively client-side; no server-side management. R2 assets accessed only via owner-verified presigned URLs (`/api/image` + `getUser()` check); full asset deletion on diary removal (`deleteDirectory` + `deleteEntry`). Enforced in storage layer and landing/auth UI.

- **openrouter-ai-client-centralization.md**: Sole LLM provider is OpenRouter (`baseURL: https://openrouter.ai/api/v1`). Shared `ProviderConfig` interface, `createOpenAIClient`, `generateStream`, `describeImage`/`describeImages` in `src_app`. Test endpoint (`POST /api/ai/test`) restricted to `['openrouter']`, performs 10-15s preflight `/models`, uses `HTTP-Referer` + `X-Title` headers; extensibility via `PROVIDER_CONFIGS` map.

- **security/_index.md** (covers `rate_limiting.md`, `security_hardening.md`):
  - Upstash sliding-window rate limiting (`@upstash/ratelimit` + Redis) on 8 endpoints (auth + AI); unified `checkRateLimit()` in `src/lib/rate-limit.ts` (fail-open dev, fail-closed prod).
  - Hardening: response headers in `next.config.mjs`; AI endpoints return generic errors + server logging only; removed OpenRouter preflight from test route (2026-05-23).

- **src_app/_index.md** (covers `application_source.md`): Core Next.js `src/app` flows (auth → diary CRUD → timeline → settings). Integrates Prisma, local API keys, OpenRouter LLM client. `ApiProvider` union + `PROVIDER_CONFIGS` for extensibility. Tone types: `warm | genki | minimal | literary`.

- **stats/_index.md** (covers `dashboard_stats_module.md`): Server-side aggregation (`src/lib/stats.ts`: single Prisma `findMany` + JS) for `totalWords`, `totalDays`, `streak`, `monthlyData`, `topTags`. Exposed via `GET /api/stats`; rendered by `DashboardStats.tsx` (Tailwind bar chart, four states). Mounted on authenticated home; streak via single-pass backward walk.

- **storage/_index.md** (covers `r2_privacy_and_asset_management.md`): R2 via S3Client (`src/lib/storage.ts`); path builders under `users/{userId}/entries/{year}/{month}/`; always presigned URLs (3600s); `deleteDirectory` for batch cleanup. `GET /api/image` enforces owner verification (404 on mismatch). Diary lifecycle (`deleteDiary`) coordinates storage + Prisma. SW uses `NetworkOnly` for `/api/image`; removed `R2_PUBLIC_URL` and remote domains from config. Privacy invariants: no public URLs, owner-only access, full asset cleanup.
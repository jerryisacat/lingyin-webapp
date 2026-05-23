---
children_hash: 2b6cb8ef9685c2bf025aa0c670e990c2243f57860426fb03541b2527abdba25f
compression_ratio: 0.6793823796548593
condensation_order: 2
covers: [security/_index.md, src_app/_index.md, storage/_index.md]
covers_token_total: 1101
summary_level: d2
token_count: 748
type: summary
---
# Structural Summary (d2)

## Security Domain
`structure/security/_index.md` consolidates `security_hardening.md`.

- **Hardening changes**: Security response headers added to `next.config.mjs`; AI endpoint error leakage fixed (generic client messages + server logging only); OpenRouter preflight network check removed from API test endpoint.
- **Files**: `next.config.mjs`.
- **Outcome**: Prevents information leakage and eliminates unnecessary preflight checks.

## Application Source Domain
`structure/src_app/_index.md` covers `application_source.md`.

- **Scope**: Next.js `src/app` handles auth flows, diary CRUD, timeline views, settings. Core files: `src/app/layout.tsx`, `src/app/page.tsx`. Flow: auth → diary management → timeline → settings. Integrates Prisma, local API key storage, UI/UX upgrades.
- **LLM Integration**: Restricted to `openrouter` provider. Config: baseURL `https://openrouter.ai/api/v1`, default model `openai/gpt-4o-mini`, headers `HTTP-Referer`/`X-Title`. `ProviderConfig` interface defines `baseURL`, `defaultModel`, `defaultVisionModel`, optional `defaultHeaders`.
  - Client functions: `createOpenAIClient`, `generateStream` (yields chunks), `describeImage` (vision with `[图片]` fallback), `describeImages` (parallel via `Promise.allSettled`).
  - Test route validates against `['openrouter']` with 15s timeout.
  - UI: Settings page shows only OpenRouter. Tone type: `warm | genki | minimal | literary`.
- **Architectural decisions**: Extensibility via `PROVIDER_CONFIGS` map + `ApiProvider` union (add provider requires only these updates). `ai/client.ts` refactored around `ProviderConfig`. API keys stored locally only; no server-side management.

## Storage Domain
`structure/storage/_index.md` covers `r2_privacy_and_asset_management.md` (Issue #23 privacy hardening).

- **Purpose**: Enforces owner-only access via presigned URLs for Cloudflare R2; removes public URL fallbacks; adds asset cleanup on diary deletion.
- **Storage layer** (`src/lib/storage.ts`): S3Client with R2 endpoint; path builders (`buildMarkdownPath`, `buildAssetPath`) under `users/{userId}/entries/{year}/{month}/`; `getPresignedUrl` (3600s default); new `deleteDirectory` for prefix-based batch deletion.
- **Image API** (`src/app/api/image/route.ts`): `GET` enforces `getUser()` + owner verification; returns 404 on mismatch.
- **Diary lifecycle** (`src/lib/diary.ts`): `deleteDiary` calls `storage.deleteEntry` + `storage.deleteDirectory` before Prisma removal.
- **Service Worker** (`src/sw.ts`): `/api/image` switched to `NetworkOnly`.
- **Config cleanup**: Removed `R2_PUBLIC_URL` and remote image domain from `next.config`.
- **Key entities**: `upsertDiary`, `getEntries`, `getEntry`, `deleteDiary`; `DiarySummary` type; `r2_client`, path builders, `presigned_url`, `delete_directory`, `image_api_auth`.
- **Relationships**: Depends on R2 env vars, Prisma `Entry` model, Serwist SW. Privacy invariants: no public URLs, owner-only access, full asset cleanup on delete.
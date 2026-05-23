---
children_hash: fda22948a256165ab85d30934cb588a8d141837d36f7924bfe89d75d7cdbb86c
compression_ratio: 0.3360957642725598
condensation_order: 1
covers: [application_source.md]
covers_token_total: 1086
summary_level: d1
token_count: 365
type: summary
---
# Application Source

**Source:** `structure/src_app/application_source.md`

## Overview
Next.js `src/app` directory handles auth flows, diary CRUD, timeline views, and settings. Core files: `src/app/layout.tsx`, `src/app/page.tsx`. Flow: auth → diary management → timeline → settings. Integrates Prisma DB, local API key storage, and UI/UX upgrades.

## LLM Integration
- **Provider:** Restricted to `openrouter` (ApiProvider union type designed for extension).
- **OpenRouter config:** baseURL `https://openrouter.ai/api/v1`; default model `openai/gpt-4o-mini`; headers `HTTP-Referer`, `X-Title`.
- **ProviderConfig interface:** Defines `baseURL`, `defaultModel`, `defaultVisionModel`, optional `defaultHeaders`.
- **Client functions:** `createOpenAIClient` (builds from apiKey + provider via PROVIDER_CONFIGS); `generateStream` (yields chat completion chunks); `describeImage` (vision model with `[图片]` fallback); `describeImages` (parallel via `Promise.allSettled`).
- **Test route:** Validates against `['openrouter']`; 15s timeout; reuses `createOpenAIClient`.
- **UI:** Settings page displays only OpenRouter.
- **Tone type:** Union of `warm | genki | minimal | literary`.

## Architectural Decisions
- Extensibility via `PROVIDER_CONFIGS` map + `ApiProvider` union (add provider requires only these two updates).
- `ai/client.ts` refactored around `ProviderConfig` for easy provider additions.
- API keys stored locally only; no server-side management.
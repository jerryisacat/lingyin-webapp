---
children_hash: b04c4108fcb4eef1376275efd5a890f21fd1fb45694a675838e6cb59d5352488
compression_ratio: 0.6991869918699187
condensation_order: 2
covers: [ai_integration/_index.md]
covers_token_total: 369
summary_level: d2
token_count: 258
type: summary
---
## ai_integration

### api_test_endpoint_and_openrouter_client.md
- **Scope**: AI API connectivity testing + OpenRouter client config; diagnostics for test endpoint and `HTTP-Referer` handling.
- **Key Changes**:
  - 10s preflight `GET https://openrouter.ai/api/v1/models` before client creation.
  - `logConnectionError()` extracts cause codes (`ENOTFOUND`/`ECONNREFUSED`/`TLS`) from `APIConnectionError` and exposes `detail`.
  - `HTTP-Referer` falls back to `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL`.
  - POST handler restricted to `openrouter` provider; response shape `{connected: boolean, error?, detail?}`.
- **Flow**: `POST` → authenticate → validate provider → decrypt key → preflight → `chat.completions.create` (15s timeout) → structured network-error logging.
- **Files**: `src/app/api/ai/test/route.ts`, `src/lib/ai/client.ts`.
- **Dependencies**: `@/lib/ai/client`, `getUserDecryptedApiKey` (api-key-guard).
- **Highlights**: Network reachability + abort/timeout support; includes Vercel `hkg1` region guidance.
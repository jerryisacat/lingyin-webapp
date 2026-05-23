---
children_hash: 385acc4ac7a0268a7a091c02d265e469484ac2f2cabe043f327fd88ac7a1c327
compression_ratio: 0.6586433260393874
condensation_order: 1
covers: [api_test_endpoint_and_openrouter_client.md]
covers_token_total: 457
summary_level: d1
token_count: 301
type: summary
---
## api_test_endpoint_and_openrouter_client.md

**Overview**  
Documents enhancements to AI API connectivity testing and OpenRouter client configuration. Focuses on diagnostics for the test endpoint and HTTP-Referer handling.

**Key Changes**  
- 10s preflight fetch to `https://openrouter.ai/api/v1/models` before client creation  
- `logConnectionError()` captures cause codes (ENOTFOUND/ECONNREFUSED/TLS) from `APIConnectionError` and exposes `detail` for Settings UI  
- `HTTP-Referer` header falls back to `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL`  
- POST handler supports only `openrouter` provider; returns `{connected: boolean, error?, detail?}`

**Structure & Flow**  
POST → authenticate user → validate provider → decrypt key → preflight connectivity test → `chat.completions.create` (15s timeout) → catch & log detailed network errors (distinguishes unreachable host vs. timeout)

**Files**  
- `src/app/api/ai/test/route.ts`  
- `src/lib/ai/client.ts`

**Dependencies**  
- `@/lib/ai/client` (OpenAI client with baseURL/headers)  
- `getUserDecryptedApiKey` from api-key-guard

**Highlights**  
Network reachability check + abort/timeout support; includes Vercel hkg1-region guidance.
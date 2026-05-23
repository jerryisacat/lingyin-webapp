---
children_hash: 881d260552b7054da158792e07c8afec100628ced9c65ffa83dd0d06514e7781
compression_ratio: 0.13629283489096572
condensation_order: 1
covers: [rate_limiting.md, security_hardening.md]
covers_token_total: 1284
summary_level: d1
token_count: 175
type: summary
---
## structure/security

### Rate Limiting (rate_limiting.md)
- Upstash sliding-window rate limiting via `@upstash/ratelimit` + `@upstash/redis` on 8 endpoints (login, register, email, password reset, AI generate/rewrite/test).
- Unified `checkRateLimit()` wrapper in `src/lib/rate-limit.ts` with environment-aware degradation: fail-open (dev), fail-closed (prod).
- Flow: `request → checkRateLimit() → allow/deny`.

### Security Hardening (security_hardening.md)
- Response headers added to `next.config.mjs`.
- AI endpoints now return generic client errors + server-side logging only (prevents leakage).
- Removed OpenRouter preflight network check from API test endpoint.
- Timestamped 2026-05-23.
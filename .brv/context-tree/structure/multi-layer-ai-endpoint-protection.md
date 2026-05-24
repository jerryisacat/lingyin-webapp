---
confidence: 0.92
sources: [structure/_index.md, billing/_index.md, api/_index.md]
synthesized_at: '2026-05-24T08:55:22.314Z'
type: synthesis
title: Multi-Layer AI Endpoint Protection
summary: AI routes (/api/generate, /api/rewrite, /api/test, /api/ai/test) are guarded by auth + rate limiting (structure) then quota pre-checks + unified key resolution (billing) before OpenRouter client execution (api).
tags: [ai, rate-limiting, quota, auth]
related: []
keywords: [rate-limit, quota-service, openrouter, effective-api-key, preflight]
createdAt: '2026-05-24T08:55:22.314Z'
updatedAt: '2026-05-24T08:55:22.314Z'
---

# Multi-Layer AI Endpoint Protection

Developers must account for three sequential enforcement layers when modifying any AI endpoint: security/rate-limit, billing/quota, and ai/client.

## Evidence

- **structure**: Unified checkRateLimit() applied to 8 endpoints including AI; fail-closed in prod; generic errors returned with server-only logging.
- **billing**: quota-service.ts pre/post checks on /api/generate, /api/rewrite, /api/test; getEffectiveApiKey resolves user key or OPENROUTER_API_KEY fallback; usage recorded after processing.
- **api**: POST /api/ai/test authenticates, validates provider=openrouter only, decrypts key, runs 10s preflight then 15s chat.completions.create.

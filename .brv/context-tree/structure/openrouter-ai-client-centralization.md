---
confidence: 0.92
sources: [api/_index.md, structure/_index.md]
synthesized_at: '2026-05-23T18:01:20.200Z'
type: synthesis
title: OpenRouter AI Client Centralization
summary: OpenRouter is the sole supported LLM provider; its config, client creation, and connectivity testing are split across api and structure domains.
tags: [ai, openrouter, client, testing]
related: []
keywords: [openrouter, providerconfig, preflight, httpreferer, createopenai client]
createdAt: '2026-05-23T18:01:20.200Z'
updatedAt: '2026-05-23T18:01:20.200Z'
---

# OpenRouter AI Client Centralization

The AI integration layer is deliberately restricted to OpenRouter with shared concerns for client instantiation, headers, and preflight validation.

## Evidence

- **api**: POST /api/ai/test only accepts 'openrouter'; performs 10s preflight GET /models and uses logConnectionError for ENOTFOUND/ECONNREFUSED/TLS cases; HTTP-Referer falls back to NEXT_PUBLIC_*_URL.
- **structure**: src_app defines ProviderConfig interface, createOpenAIClient, generateStream, describeImage; test route validates against ['openrouter']; baseURL https://openrouter.ai/api/v1; extensibility via PROVIDER_CONFIGS map.

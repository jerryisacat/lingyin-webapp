---
title: API Test Endpoint and OpenRouter Client
summary: API test now includes 10s preflight to OpenRouter models endpoint, detailed connection error logging with cause codes, actionable diagnostics for Settings UI, and HTTP-Referer fallback to NEXT_PUBLIC_APP_URL or SITE_URL
tags: []
related: []
keywords: []
createdAt: '2026-05-22T12:44:51.638Z'
updatedAt: '2026-05-22T12:44:51.638Z'
---
## Reason
Document recent enhancements to AI API connectivity testing and client configuration

## Raw Concept
**Task:**
Enhance AI API test endpoint for better diagnostics and OpenRouter connectivity

**Changes:**
- Added preflight network check to https://openrouter.ai/api/v1/models with 10s timeout
- Implemented logConnectionError() capturing cause code (ENOTFOUND/ECONNREFUSED/TLS) from APIConnectionError
- detail field provides actionable diagnostics to Settings UI
- client.ts HTTP-Referer now falls back to both NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_SITE_URL

**Files:**
- src/app/api/ai/test/route.ts
- src/lib/ai/client.ts

**Flow:**
Preflight fetch -> create client -> chat.completions.create with timeout -> catch & log detailed error with network status

## Narrative
### Structure
POST handler authenticates user, validates provider (only openrouter), retrieves decrypted key, performs preflight connectivity test, then makes minimal chat completion request with 15s timeout

### Dependencies
Uses OpenAI client from @/lib/ai/client with baseURL and headers; getUserDecryptedApiKey from api-key-guard

### Highlights
Network reachability check distinguishes between unreachable host vs reachable but timed-out API call; supports abort/timeout errors and provides Vercel-specific guidance for hkg1 region

### Rules
Only openrouter provider supported in validProviders; returns {connected: true/false, error?, detail?}

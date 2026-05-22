---
title: Application Source
summary: Application source structure, UI components, API routes, and core functionality from src/app
tags: []
related: []
keywords: []
createdAt: '2026-05-22T09:17:09.626Z'
updatedAt: '2026-05-22T12:07:16.357Z'
---
## Reason
Curate from RLM context for src/app module

## Raw Concept
**Task:**
Document src/app structure and functionality

**Files:**
- src/app/layout.tsx
- src/app/page.tsx

**Flow:**
App layout with auth, diary management, timeline, settings

## Narrative
### Structure
Next.js app with src/app directory, including auth flows, diary CRUD, timeline views

### Highlights
UI/UX upgrades, API keys for LLM, local storage of keys, Prisma DB

## Facts
- **API**: API keys only support OpenRouter provider
- **ApiProvider**: ApiProvider type is union type 'openrouter' designed for easy extension
- **ai/client.ts**: ai/client.ts refactored to extensible ProviderConfig structure
- **ProviderConfig**: Adding new provider requires only adding entry to PROVIDER_CONFIGS and updating ApiProvider union
- **OpenRouter**: OpenRouter baseURL is https://openrouter.ai/api/v1
- **OpenRouter**: Default model for OpenRouter is openai/gpt-4o-mini
- **OpenRouter**: OpenRouter uses defaultHeaders HTTP-Referer and X-Title
- **test route**: Test route reuses createOpenAIClient instead of raw fetch
- **UI**: Settings page only displays OpenRouter
- **Tone**: Tone type is union of warm, genki, minimal, literary
- **ProviderConfig**: ProviderConfig interface defines baseURL, defaultModel, defaultVisionModel, optional defaultHeaders
- **createOpenAIClient**: createOpenAIClient function builds OpenAI client from apiKey and provider using PROVIDER_CONFIGS
- **generateStream**: generateStream yields content chunks from chat completions stream
- **describeImage**: describeImage handles single image description with vision model, falls back to [图片] on error
- **describeImages**: describeImages uses Promise.allSettled for parallel image descriptions
- **test route**: Test API route validates provider against ['openrouter'] and supports timeout of 15 seconds

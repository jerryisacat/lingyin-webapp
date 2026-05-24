---
title: First Time Setup and hasCompletedSetup
summary: hasCompletedSetup field, AppShell redirect logic, login direct jump, UserConfigContext, setup page UI variants
tags: []
related: []
keywords: []
createdAt: '2026-05-24T09:32:49.493Z'
updatedAt: '2026-05-24T09:32:49.493Z'
---
## Reason
Curate RLM context about initial user setup flow

## Raw Concept
**Task:**
Document first-time login/setup flow with hasCompletedSetup flag

**Files:**
- src/components/AppShell.tsx
- src/app/api/user/style/route.ts
- src/contexts/UserConfigContext.tsx
- src/app/login/page.tsx
- src/app/setup/page.tsx

**Flow:**
Login -> check hasCompletedSetup -> /setup or / ; AppShell guards authenticated routes

## Narrative
### Structure
New DB field + context provider + guards in AppShell and login + dedicated setup page with WritingStyleConfig

### Highlights
Seamless redirect on first login, automatic flag set on style save, loading spinner during fetch

## Facts
- **hasCompletedSetup_field**: User table has hasCompletedSetup boolean field to distinguish incomplete setup vs default choice [project]
- **appshell_redirect**: AppShell.tsx consumes useUserConfig() and redirects to /setup when hasCompletedSetup=false and not on /setup page [project]
- **login_redirect**: Login page detects hasCompletedSetup after signIn and redirects directly to /setup [project]
- **style_api_update**: PUT /api/user/style sets hasCompletedSetup=true automatically [project]
- **appshell_loading**: AppShell shows spinner during configLoading on authenticated pages except /setup [project]
- **userconfig_context**: UserConfigContext fetches /api/user/style and manages writingStyle + hasCompletedSetup state [project]
- **setup_page_ui**: Setup page shows different UI based on hasExistingStyle (existing vs first-time) [project]
- **writingstyle_config**: WritingStyleConfig component used in setup for initial style selection [project]

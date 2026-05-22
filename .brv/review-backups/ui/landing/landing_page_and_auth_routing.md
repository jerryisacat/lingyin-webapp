---
title: Landing Page and Auth Routing
summary: Landing page with hero/features/steps for guests; dashboard for users; middleware marks / as public; AppShell excludes / from nav shell
tags: []
related: []
keywords: []
createdAt: '2026-05-21T19:12:36.897Z'
updatedAt: '2026-05-21T19:12:36.897Z'
---
## Reason
Document home page dual-state rendering and public route handling

## Raw Concept
**Task:**
Implement dual-state home page with public landing and private dashboard

**Files:**
- src/app/page.tsx
- src/lib/supabase/middleware.ts
- src/components/AppShell.tsx

**Flow:**
middleware: / in PUBLIC_ROUTES -> allow guest; AppShell: / in NO_SHELL_ROUTES -> no nav; page.tsx: if user show dashboard else full landing (Hero + 4 features + 3 steps + CTA + Footer)

## Narrative
### Structure
Unauthenticated: Hero section with CTA to login, Features grid (AI generate, photo-to-text, privacy, PWA), Steps (record, AI polish, save), CTA, Footer. Authenticated: centered dashboard with greeting, Write Diary / Timeline buttons, tip card.

### Highlights
PWA installable, offline diary read, local API key only, photo analysis into diary, Markdown timeline

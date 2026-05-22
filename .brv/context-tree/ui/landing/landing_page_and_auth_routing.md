---
title: Landing Page and Auth Routing
summary: Landing page with hero/features/steps for guests; dashboard for users; middleware marks / as public; AppShell excludes / from nav shell
tags: []
related: []
keywords: []
createdAt: '2026-05-21T19:12:36.897Z'
updatedAt: '2026-05-21T19:12:36.897Z'
consolidated_at: '2026-05-22T06:04:35.543Z'
consolidated_from: [{date: '2026-05-22T06:04:35.543Z', path: ui/landing/landing_page_and_auth_routing.abstract.md, reason: 'All three files cover identical topic (dual-state landing page + auth routing) with substantial content overlap (>70%); abstract and overview are derived summaries of the main detailed file. Merge into the richest source to eliminate redundancy while preserving every unique detail, phrasing, and structured section.'}, {date: '2026-05-22T06:04:35.543Z', path: ui/landing/landing_page_and_auth_routing.overview.md, reason: 'All three files cover identical topic (dual-state landing page + auth routing) with substantial content overlap (>70%); abstract and overview are derived summaries of the main detailed file. Merge into the richest source to eliminate redundancy while preserving every unique detail, phrasing, and structured section.'}]
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

---

**Abstract Summary (consolidated):** This document describes implementing a dual-state root page that renders a public landing page with hero, features, steps and CTA for guests while showing a personalized dashboard for authenticated users, using middleware to mark / as public and excluding it from the AppShell navigation.

**Overview Key Points (consolidated):** 
- Dual-state home page renders public landing for guests and dashboard for authenticated users; middleware treats / as PUBLIC_ROUTES to allow guests; AppShell excludes / via NO_SHELL_ROUTES to omit nav shell; page.tsx conditionally shows Hero/Features/Steps/CTA/Footer or centered dashboard; emphasizes PWA installability, offline diary access, local API keys, and photo-to-text analysis
- Structure / sections summary: Frontmatter with title/summary/tags; Reason section; Raw Concept covering Task/Files/Flow; Narrative with Structure (unauth vs auth views) and Highlights (PWA/offline/Markdown features)
- Notable entities/patterns/decisions: PUBLIC_ROUTES and NO_SHELL_ROUTES constants; files src/app/page.tsx, src/lib/supabase/middleware.ts, src/components/AppShell.tsx; decision for full landing (Hero + 4 features + 3 steps) vs minimal dashboard greeting/buttons/tip card; patterns include conditional rendering based on Supabase user session
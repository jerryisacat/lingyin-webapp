---
children_hash: b8b6c862d8032c1981d385ce1f435f15dd28e3c620d66b943186e13bb23e4915
compression_ratio: 0.345926800472255
condensation_order: 1
covers: [landing_page_and_auth_routing.md]
covers_token_total: 847
summary_level: d1
token_count: 293
type: summary
---
# Landing Page and Auth Routing

**Source:** `landing_page_and_auth_routing.md`

## Purpose
Documents dual-state root page rendering: public landing for guests, personalized dashboard for authenticated users. Middleware marks `/` as public; AppShell excludes it from navigation shell.

## Core Files
- `src/app/page.tsx` — conditional rendering logic
- `src/lib/supabase/middleware.ts` — route protection
- `src/components/AppShell.tsx` — shell exclusion

## Architectural Decisions
- Constants: `PUBLIC_ROUTES` (middleware allows guests on `/`) and `NO_SHELL_ROUTES` (AppShell omits nav for `/`)
- Conditional rendering driven by Supabase user session
- Full landing for unauthenticated users; minimal dashboard for authenticated users

## Unauthenticated View (Landing)
- Hero section + CTA to login
- Features grid: AI generate, photo-to-text, privacy, PWA
- Steps: record → AI polish → save
- CTA + Footer

## Authenticated View (Dashboard)
- Centered greeting
- Primary actions: Write Diary / Timeline buttons
- Tip card

## Key Highlights
- PWA installable with offline diary read
- Local API key only
- Photo analysis into diary entries
- Markdown timeline support
---
children_hash: 39259dba98025e7e454bb2399c59f1430f19ffa246a7699afbcbb154575571a5
compression_ratio: 0.7576601671309192
condensation_order: 2
covers: [landing/_index.md]
covers_token_total: 359
summary_level: d2
token_count: 272
type: summary
---
# Landing Page and Auth Routing

**Source:** `landing/_index.md` (condenses `landing_page_and_auth_routing.md`)

## Purpose
Dual-state root page: public landing for guests, minimal dashboard for authenticated users. Middleware treats `/` as public; AppShell excludes it from navigation shell.

## Core Files
- `src/app/page.tsx` — conditional rendering
- `src/lib/supabase/middleware.ts` — route protection via `PUBLIC_ROUTES`
- `src/components/AppShell.tsx` — shell exclusion via `NO_SHELL_ROUTES`

## Architectural Decisions
- Supabase session drives rendering
- Full landing for unauthenticated; centered greeting + actions for authenticated
- PWA installable with offline diary read; local API key only

## Unauthenticated View
- Hero + login CTA
- Features grid (AI generate, photo-to-text, privacy, PWA)
- Steps: record → AI polish → save
- CTA + Footer

## Authenticated View
- Greeting
- Primary actions: Write Diary / Timeline
- Tip card

## Key Relationships
- Landing integrates with auth flow and PWA capabilities; photo analysis feeds diary entries; Markdown timeline support.
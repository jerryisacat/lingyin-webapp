---
children_hash: 2a32a7f3be0055743020d9f3f0d93ac7542c9945140a73af3c7e0032458f04dd
compression_ratio: 0.6626865671641791
condensation_order: 3
covers: [ui/_index.md]
covers_token_total: 335
summary_level: d3
token_count: 222
type: summary
---
# UI Domain Overview

**Source:** `ui/_index.md` (condenses `landing/_index.md` and `landing_page_and_auth_routing.md`)

## Purpose
Dual-state root page (`/`): public landing for guests, minimal dashboard for authenticated users. Middleware marks `/` public; `AppShell` excludes it from navigation shell.

## Core Files
- `src/app/page.tsx` — conditional rendering
- `src/lib/supabase/middleware.ts` — `PUBLIC_ROUTES` protection
- `src/components/AppShell.tsx` — `NO_SHELL_ROUTES` exclusion

## Architectural Decisions
- Supabase session drives view selection
- Full landing (hero, features, steps, CTA) for unauthenticated
- Centered greeting + primary actions for authenticated
- PWA support with offline diary read; local API key only

## Key Relationships
Integrates auth flow, PWA capabilities, photo-to-diary pipeline, and Markdown timeline. See `landing/_index.md` for full details.
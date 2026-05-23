---
children_hash: 400a16bbb92f76fa0ffc05f924423c279081b73303ff4e9e109850371c759d8b
compression_ratio: 0.25509533201840895
condensation_order: 1
covers: [landing_page_and_auth_routing.md, landing_page_refactor.md]
covers_token_total: 1521
summary_level: d1
token_count: 388
type: summary
---
# UI/Landing Domain Overview

## Core Architecture
- **Dual-state root page** (`src/app/page.tsx`): renders full public landing (Hero + 4 features + 3 steps + CTA + Footer) for guests; shows centered dashboard (greeting + Write Diary/Timeline buttons + tip card) for authenticated users.
- **Auth routing**: `src/lib/supabase/middleware.ts` marks `/` in `PUBLIC_ROUTES` to allow guests; `src/components/AppShell.tsx` excludes `/` via `NO_SHELL_ROUTES` to omit navigation shell.
- **Related entry**: `landing_page_and_auth_routing.md` (consolidated from abstract/overview).

## Landing Page Refactor (2026-05-23)
- **Branding & content fixes**: corrected brand/copy errors; added OSS/GitHub/Vibe Coding to Hero.
- **New sections**: four use-case blocks (performance/travel/daily/life).
- **UI upgrades**: sticky top-4 frosted-glass floating navbar; Header optimized with `useMemo`; AppShell migrated from NavBar to Header.
- **Privacy clarification**: FEATURES section updated to AES-256-GCM encryption.
- **Disabled items**: social network features marked.
- **Related entry**: `landing_page_refactor.md` (consolidated from abstract/overview); cross-references `landing_page_and_auth_routing.md`.

## Key Patterns & Decisions
- Conditional rendering based on Supabase user session.
- Glassmorphism polish and component migration for improved UX.
- Emphasis on PWA installability, offline diary access, local API keys, photo-to-text analysis, and Markdown timeline.
- All changes preserve dual-state behavior while enhancing visual and security details.
---
children_hash: 92f5e60085a0614ad08623345346b993e057cbd7a038fdfc36581a25002f3587
compression_ratio: 0.4401325130146711
condensation_order: 2
covers: [auth-driven-conditional-rendering.md, demo/_index.md, epic_30/_index.md, landing/_index.md, logout/_index.md, timeline/_index.md]
covers_token_total: 2113
summary_level: d2
token_count: 930
type: summary
---
# UI Domain Structural Overview (d2)

The `ui` domain consolidates authentication-driven rendering, landing page architecture, design system upgrades, logout flows, timeline/calendar views, and interactive demos. Core pattern: Supabase session state as single source of truth for conditional UI branching between public and authenticated experiences, enforced across middleware, AppShell, and root routing.

## Auth & Routing Foundation
- **auth-driven-conditional-rendering.md**: Supabase session dictates root (`/`) behavior—public landing (hero + features) for guests vs. dashboard for authenticated users. `PUBLIC_ROUTES` + `NO_SHELL_ROUTES` constants; middleware marks `/` public; `AppShell.tsx` excludes it from shell. Cross-references `structure/_index.md` and `ui/_index.md`.

## Landing & Navigation
- **landing/_index.md**: Dual-state `src/app/page.tsx` renders full public landing or centered dashboard. Auth routing via `src/lib/supabase/middleware.ts` and `AppShell.tsx`. 2026-05-23 refactor: branding fixes, OSS/GitHub mentions, four use-case blocks, sticky frosted-glass navbar, Header migration from NavBar, AES-256-GCM privacy clarification. Preserves dual-state while adding glassmorphism and PWA emphasis. Consolidates `landing_page_and_auth_routing.md` + `landing_page_refactor.md`.

## Design System & Epic Upgrades
- **epic_30/_index.md**: Comprehensive spec (curated 2026-05-22 from `docs/issue-30-spec.md`) for 玲音日记 PWA. Covers 9 modules: design tokens (CSS vars for sakura pink `#f0a8b0`, warm white `#faf3e8`, glassmorphism), dark-mode FOUC blocking script in `layout.tsx`, sakura animations, immersive editor, timeline, navigation, micro-interactions, onboarding. Key decisions: Tailwind-only transitions, `prefers-reduced-motion` respect, LCP < 2s / CLS < 0.1, WCAG AA. Source files: `src/app/globals.css`, `tailwind.config.ts`. Flow: tokens → blocking script → landing → editor → timeline.

- **demo/_index.md**: High-fidelity single-file interactive demo (`public/demo.html`) showcasing v2.0 features. Tailwind CDN + custom keyframes (snowfall, breathing, slide-in-spring). Sections: hero → features → editor → PWA mobile preview. Highlights: 18 GPU sakura particles, zero-FOUC dark toggle, AI breathing glow, spring toasts, iOS tab feedback.

## Logout & Session Management
- **logout/_index.md**: Consistent `signOut` reuse across entry points. `src/app/settings/page.tsx` (red danger button), `src/components/Header.tsx` (desktop/mobile buttons), `MobileTabBar.tsx` (800ms long-press + modal confirmation on settings tab). Mobile-only safety pattern; cross-platform unification.

## Timeline & Calendar
- **timeline/_index.md**: Calendar view toggle on timeline page (Issue #2). `CalendarView.tsx` renders month grid with sakura dots (memoized calc, entry map, skeleton/empty states). `src/app/api/entries/route.ts` extends GET with `?view=calendar&year=&month=` returning minimal `{id, date}`. `src/app/timeline/page.tsx` manages list/calendar toggle, preserves cursor state, respects date boundaries. Dependencies: lucide-react, `DiarySummary`/`CalendarEntry` types, `@/lib/diary` helpers. Flow: toggle → fetch → clickable grid → diary navigation.

## Relationships & Patterns
- All entries reference shared files (`src/app/page.tsx`, `AppShell.tsx`, `Header.tsx`, `MobileTabBar.tsx`, `globals.css`, `layout.tsx`).
- Auth session drives conditional rendering across landing, demo, and timeline.
- Design tokens and animations (sakura, glassmorphism) unify epic_30, demo, and landing.
- No external libs beyond Tailwind/lucide-react; emphasis on performance, accessibility, and PWA installability.
- Child entries provide drill-down: abstracts/overviews consolidated where overlap >80%.
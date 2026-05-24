---
children_hash: c77f6f38f8ff546a494b80f731be98376090a80eaac37be77f4e0eb9ceb2dddd
compression_ratio: 0.320064334539606
condensation_order: 2
covers: [auth-driven-conditional-rendering.md, demo/_index.md, epic_30/_index.md, glass_nav_bar/_index.md, landing/_index.md, logout/_index.md, timeline/_index.md]
covers_token_total: 2487
summary_level: d2
token_count: 796
type: summary
---
# UI Domain Structural Overview (d2)

The `ui/` domain captures conditional rendering, navigation unification, landing/dashboard duality, logout flows, timeline/calendar, and high-fidelity design specs for the 玲音日记 PWA. Core pattern: Supabase session state drives all branching between public and authenticated experiences, enforced via middleware, constants, and AppShell.

## Auth & Routing Foundation
- **auth-driven-conditional-rendering.md**: Single source of truth for guest vs. logged-in UI. `src/app/page.tsx` renders public landing or dashboard; `PUBLIC_ROUTES` + `NO_SHELL_ROUTES` constants + middleware mark `/` public; AppShell excludes shell on root.
- Cross-references: `landing/_index.md`, `structure/_index.md`.

## Landing & Public Experience
- **landing/_index.md**: Dual-state root page (`src/app/page.tsx`) shows Hero + features + steps + CTA for guests; greeting + Write/Timeline buttons for authenticated users. 2026-05-23 refactor added OSS/GitHub/Vibe Coding, four use-case blocks, sticky frosted-glass navbar, AES-256-GCM privacy note, and disabled social features. Related: `landing_page_and_auth_routing.md`, `landing_page_refactor.md`.

## Navigation Unification
- **glass_nav_bar/_index.md**: Single `GlassNavBar.tsx` replaces Sidebar + MobileTabBar (Issue #101). Desktop: fixed top frosted-glass with user dropdown; mobile: bottom tab bar (800 ms long-press logout on settings). Driven by `config/navigation.json`; uses framer-motion active indicator and scroll opacity. Simplifies AppShell to `max-w-3xl mx-auto`. Related: `glassnavbar_unified_navigation.md`.

## Logout Flows
- **logout/_index.md**: Consistent `signOut` reuse across `src/app/settings/page.tsx` (danger button), `MobileTabBar.tsx` (long-press + modal), and `Header.tsx`. Mobile-only safety pattern: 800 ms press + explicit confirmation.

## Timeline & Calendar
- **timeline/_index.md**: Calendar toggle on timeline page (Issue #2). `CalendarView.tsx` renders sakura-dot month grid; `/api/entries?view=calendar` returns minimal `{id,date}`; `timeline/page.tsx` manages list/calendar state with cursor preservation and boundary navigation. Related: `calendar_view_implementation.md`.

## Design System & Specs
- **epic_30/_index.md**: Comprehensive v2.0 UI/UX spec (from `docs/issue-30-spec.md`). Nine modules: design tokens (sakura pink `#f0a8b0`, warm white `#faf3e8`, glassmorphism), dark-mode FOUC blocking script, sakura animations, immersive editor, timeline, micro-interactions, onboarding. Constraints: LCP < 2 s, CLS < 0.1, WCAG AA, `prefers-reduced-motion`. Files: `globals.css`, `layout.tsx`, `tailwind.config.ts`.
- **demo/_index.md**: Single-file interactive demo (`public/demo.html`) showcasing sakura particles, zero-FOUC dark toggle, typewriter, AI breathing glow, spring toasts, and PWA mobile mockup. Uses Tailwind CDN + custom keyframes.

## Cross-Cutting Patterns
- Session-driven rendering + middleware constants recur across landing, auth, and shell.
- Glassmorphism, sakura theming, and lightweight animations (no heavy libs) unify visual language.
- All entries reference concrete files (`src/app/*`, `src/components/*`, `config/navigation.json`) for drill-down.
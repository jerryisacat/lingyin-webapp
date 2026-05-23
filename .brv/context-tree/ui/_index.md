---
children_hash: c1566d7bca1257953fc61d06dd7371919c4ae2c724ab19c7b58d967964f68f95
compression_ratio: 0.5220183486238532
condensation_order: 2
covers: [demo/_index.md, epic_30/_index.md, landing/_index.md]
covers_token_total: 1090
summary_level: d2
token_count: 569
type: summary
---
# ui/

Structural overview of UI/UX domain covering interactive demo, full-site design spec (Epic #30), and landing/auth routing. Consolidated from `demo/_index.md`, `epic_30/_index.md`, and `landing/_index.md`.

## Core Files & Sources
- `public/demo.html` — single-file interactive demo (Tailwind CDN + custom keyframes)
- `docs/issue-30-spec.md` — source for Epic #30 spec (curated 2026-05-22)
- `src/app/globals.css`, `src/app/layout.tsx`, `tailwind.config.ts` — design tokens & FOUC prevention
- `src/app/page.tsx`, `src/lib/supabase/middleware.ts`, `src/components/AppShell.tsx` — conditional landing/dashboard rendering

## Architectural Decisions
- CSS variables for dual themes (sakura pink `#f0a8b0`, warm white `#faf3e8`, glassmorphism)
- Blocking script in `layout.tsx` head eliminates FOUC; theme detection is mandatory
- Lightweight sakura snowfall (no canvas libs); all animations respect `prefers-reduced-motion`
- Tailwind transitions only; no Lottie/Framer Motion
- `PUBLIC_ROUTES` + `NO_SHELL_ROUTES` constants drive middleware & AppShell behavior
- Performance targets: LCP < 2s, CLS < 0.1, WCAG AA contrast

## Modules & Features (9 total from Epic #30)
- Design Tokens, Dark Mode, Landing Page, Navigation, Diary Editor, Timeline, Login/Settings, Micro-interactions, Onboarding
- Key patterns: sakura particles (GPU-accelerated, 18), AI breathing glow, spring toast animations, iOS-standard mobile tab bar, immersive distraction-free editor

## Landing & Auth Routing
- Dual-state root: public landing (hero + features grid + steps + CTA) for guests; minimal dashboard (greeting + Write/Timeline buttons) for authenticated users
- Supabase session drives conditional rendering; middleware marks `/` public; AppShell excludes it from nav shell
- Highlights: PWA installable/offline, local API keys only, photo-to-text, Markdown timeline

## Demo Implementation
- Flow: Landing hero → Feature steps → Interactive editor → Mobile PWA preview
- Features: Zero-FOUC dark toggle, typewriter cursor, sakura snowfall, PWA tab slide/scale feedback
- Consolidated from `.abstract.md` / `.overview.md` (identical topic, >80% overlap)

Drill-down: `demo/_index.md` (demo mechanics), `epic_30/_index.md` (full spec + rules), `landing/_index.md` (auth routing logic).
---
children_hash: d04117ea9725702f3353209ad1feb3a35af74124585a133d9faeddceb9d891ef
compression_ratio: 0.8211009174311926
condensation_order: 1
covers: [full_site_ui_ux_design_upgrade_spec.md]
covers_token_total: 436
summary_level: d1
token_count: 358
type: summary
---
# Full Site UI/UX Design Upgrade Spec (Epic #30)

**Source:** `full_site_ui_ux_design_upgrade_spec.md` (curated 2026-05-22 from `docs/issue-30-spec.md`)

## Overview
Comprehensive spec for 玲音日记 PWA covering design tokens, dark-mode FOUC prevention, landing sakura animations, immersive editor, timeline, navigation, micro-interactions, and onboarding. Core tonality: warm, lightweight, silky, minimalist, healing.

## Key Files
- `docs/issue-30-spec.md`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `tailwind.config.ts`

## Modules (9 total)
- Design Tokens
- Landing Page
- Dark Mode
- Navigation
- Diary Editor
- Timeline
- Login/Settings
- Micro-interactions
- Onboarding

## Architectural Decisions
- CSS variables for dual themes (sakura pink `#f0a8b0`, warm white `#faf3e8`, glassmorphism)
- Blocking script in `layout.tsx` head to eliminate FOUC
- Lightweight sakura snowfall (no canvas libs)
- Immersive distraction-free editor with AI breathing glow
- Glassmorphic nav + iOS-standard mobile tab bar
- Tailwind transitions only; no Lottie/Framer Motion

## Performance & Constraints
- LCP < 2s, CLS < 0.1
- All animations respect `prefers-reduced-motion`
- WCAG AA contrast for muted text

## Rules
1. Theme detection script must be blocking
2. Preserve exact code examples and numbered procedures

**Flow:** Design tokens → Dark-mode blocking script → Landing sakura → Editor immersion → Timeline & micro-interactions
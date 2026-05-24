---
children_hash: 21ab1a3bb55f9a17a9210e1cd31dadf83f6844112abfa0f3111452c7d6f33b95
compression_ratio: 0.4991896272285251
condensation_order: 1
covers: [glassnavbar_unified_navigation.md]
covers_token_total: 617
summary_level: d1
token_count: 308
type: summary
---
# GlassNavBar Unified Navigation (d1)

**Entry:** `glassnavbar_unified_navigation.md` (consolidated from abstract + overview variants, 2026-05-24)

## Overview
Replaces `Sidebar.tsx` + `MobileTabBar.tsx` with single `GlassNavBar.tsx` component (Issue #101). Desktop: fixed top frosted-glass nav with user dropdown. Mobile: bottom tab bar with 800ms long-press logout on settings. `AppShell.tsx` simplified to `max-w-3xl mx-auto` container, removing `md:pl-56` offset and mini header.

## Key Architectural Decisions
- Single component driven by `config/navigation.json` (auth-filtered items, `mobileItems` subset)
- Scroll-driven opacity transition on glass background (`bg-warm-white/80 + backdrop-blur`)
- Active indicator via `framer-motion` `layoutId` + pathname matching
- Logout clears caches; mobile uses confirm popup

## Dependencies & Files
- `src/components/GlassNavBar.tsx`, `src/components/AppShell.tsx`, `config/navigation.json`
- `next-auth/react`, `framer-motion`, `lucide-react`

## Rules
- Desktop: show authenticated-or-always items that are not disabled and have `href`
- Mobile: restricted to `mobileItems` from config

Drill down into `glassnavbar_unified_navigation.md` for full rawConcept/narrative details.
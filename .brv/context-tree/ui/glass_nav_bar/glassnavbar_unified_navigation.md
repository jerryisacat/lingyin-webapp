---
title: GlassNavBar Unified Navigation
summary: 'Unified GlassNavBar: desktop top frosted nav with user menu, mobile bottom tabs with long-press logout, scroll opacity, framer-motion active indicators. AppShell uses max-w-3xl container.'
tags: []
related: []
keywords: []
createdAt: '2026-05-24T08:39:48.274Z'
updatedAt: '2026-05-24T08:39:48.274Z'
consolidated_at: '2026-05-24T08:55:00.425Z'
consolidated_from: [{date: '2026-05-24T08:55:00.425Z', path: ui/glass_nav_bar/glassnavbar_unified_navigation.abstract.md, reason: 'All three files cover the identical topic (GlassNavBar unified navigation refactor) with >90% overlapping content; abstract and overview are direct condensations of the main file with no unique facts, diagrams, or details to preserve.'}, {date: '2026-05-24T08:55:00.425Z', path: ui/glass_nav_bar/glassnavbar_unified_navigation.overview.md, reason: 'All three files cover the identical topic (GlassNavBar unified navigation refactor) with >90% overlapping content; abstract and overview are direct condensations of the main file with no unique facts, diagrams, or details to preserve.'}]
---
## Reason
Document Issue #101 GlassNavBar refactor replacing Sidebar/MobileTabBar

## Raw Concept
**Task:**
Issue #101: Replace Sidebar.tsx + MobileTabBar.tsx with GlassNavBar.tsx unified component

**Changes:**
- Desktop: top fixed nav bar with frosted glass effect, user dropdown menu
- Mobile: bottom tab bar with frosted glass, settings long-press logout
- AppShell.tsx: removed md:pl-56 offset, removed mobile mini header, uses max-w-3xl mx-auto container
- Scroll-based glass opacity effect, active nav indicator animation with framer-motion layoutId

**Files:**
- src/components/GlassNavBar.tsx
- src/components/AppShell.tsx
- config/navigation.json

**Flow:**
navConfig -> filter items -> render desktop/mobile -> handle scroll/auth/logout

**Timestamp:** 2026-05-24

## Narrative
### Structure
GlassNavBar renders desktop top bar (fixed, 64px) and mobile bottom tab bar. Uses navConfig for items. Active state via pathname + framer-motion layoutId. User menu with logout clears caches.

### Dependencies
next-auth/react, framer-motion, lucide-react, config/navigation.json

### Highlights
Frosted glass (bg-warm-white/80 + backdrop-blur), scroll opacity transition, long-press (800ms) on settings for mobile logout confirm popup

### Rules
Desktop items: authenticated or always, not disabled, has href. Mobile uses mobileItems from config.
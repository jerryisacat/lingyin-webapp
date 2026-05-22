---
title: Full Site UI/UX Design Upgrade Spec
summary: Comprehensive spec for design tokens, dark mode FOUC fixes, landing page sakura animations, immersive editor, timeline, navigation, and micro-interactions for 玲音日记 PWA.
tags: []
related: []
keywords: []
createdAt: '2026-05-22T12:05:44.734Z'
updatedAt: '2026-05-22T12:05:44.734Z'
---
## Reason
Curate detailed UI/UX requirements for Epic #30 from issue-30-spec.md

## Raw Concept
**Task:**
Full Site UI/UX Design Upgrade (Epic #30) for 玲音日记

**Changes:**
- CSS variables for dual themes with sakura pink and warm beige
- Blocking script in layout.tsx to prevent FOUC
- Lightweight sakura snowfall without heavy canvas libs
- Immersive distraction-free diary editor with AI breathing glow
- Glassmorphic nav and iOS-standard mobile tab bar

**Files:**
- docs/issue-30-spec.md
- src/app/globals.css
- src/app/layout.tsx
- tailwind.config.ts

**Flow:**
Design tokens -> Dark mode blocking script -> Landing sakura -> Editor immersion -> Timeline & micro-interactions

## Narrative
### Structure
Spec covers 9 modules: Design Tokens, Landing Page, Dark Mode, Navigation, Diary Editor, Timeline, Login/Settings, Micro-interactions, Onboarding. Includes ASCII diagrams, code snippets, and DoD checklist.

### Highlights
Core tonality: warm, lightweight, silky, minimalist, healing. Visual symbols: sakura pink #f0a8b0, warm white #faf3e8, glassmorphism. Performance: LCP<2s, CLS<0.1. Anti-patterns: no lottie/framer-motion, use Tailwind transitions only.

### Rules
1. Theme detection script must be blocking in layout head
2. All animations respect prefers-reduced-motion
3. WCAG AA contrast for muted text
4. No heavy animation libraries
5. Preserve exact code examples and numbered procedures

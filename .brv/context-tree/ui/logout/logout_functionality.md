---
title: Logout Functionality
summary: Logout via red danger button in Settings, long-press (800ms) on mobile settings tab with confirmation modal, plus existing Header.tsx desktop/mobile logout buttons
tags: []
related: []
keywords: []
createdAt: '2026-05-23T10:42:48.715Z'
updatedAt: '2026-05-23T10:42:48.715Z'
---
## Reason
Document logout UI implementations in settings, mobile tab bar, and header

## Raw Concept
**Task:**
Implement logout functionality across Settings page, MobileTabBar, and Header

**Files:**
- src/app/settings/page.tsx
- src/components/MobileTabBar.tsx
- src/components/Header.tsx

**Flow:**
Settings button -> signOut; Mobile long-press (800ms) -> confirmation modal (cancel/confirm); Header buttons -> signOut (desktop+mobile)

## Narrative
### Structure
Red danger button at Settings page bottom calls signOut; MobileTabBar long-press on settings tab (800ms) shows logout confirmation overlay; Header.tsx already has logout buttons for both desktop and mobile

### Highlights
Consistent logout UX across desktop header, settings page, and mobile tab bar with confirmation for mobile

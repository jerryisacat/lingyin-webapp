---
title: Logout Functionality
summary: Logout via red danger button in Settings, long-press (800ms) on mobile settings tab with confirmation modal, plus existing Header.tsx desktop/mobile logout buttons
tags: []
related: []
keywords: []
createdAt: '2026-05-23T10:42:48.715Z'
updatedAt: '2026-05-23T10:42:48.715Z'
consolidated_at: '2026-05-23T18:00:53.759Z'
consolidated_from: [{date: '2026-05-23T18:00:53.759Z', path: ui/logout/logout_functionality.abstract.md, reason: Abstract and overview are derived summaries (>70% overlap) of the detailed main file; merge into richest source to eliminate redundancy while preserving all unique details.}, {date: '2026-05-23T18:00:53.760Z', path: ui/logout/logout_functionality.overview.md, reason: Abstract and overview are derived summaries (>70% overlap) of the detailed main file; merge into richest source to eliminate redundancy while preserving all unique details.}]
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

**Abstract Summary (consolidated):** The document details logout functionality implemented via a red danger button in Settings, 800ms long-press with confirmation modal on the mobile tab bar, and existing Header.tsx buttons for desktop and mobile.

**Overview Key Points (consolidated):** 
- Key points: Logout implemented via red danger button in Settings page calling signOut; 800ms long-press on mobile settings tab triggers confirmation modal (cancel/confirm); Header.tsx provides existing logout buttons for both desktop and mobile; Consistent UX across Settings, MobileTabBar, and Header; Mobile flow requires explicit confirmation before signOut
- Structure / sections summary: Document sections include Reason (documenting UI implementations), Raw Concept (task, files, flow), and Narrative (Structure describing button/modal behaviors, Highlights on cross-platform consistency)
- Notable entities/patterns/decisions: Files involved are src/app/settings/page.tsx, src/components/MobileTabBar.tsx, src/components/Header.tsx; Decision to use long-press (800ms) + modal only for mobile tab bar; Pattern of reusing signOut across desktop/mobile entry points with added safety for mobile
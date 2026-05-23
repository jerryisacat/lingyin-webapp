---
title: Calendar View Implementation
summary: CalendarView component with month grid, sakura indicators, API /api/entries?view=calendar, list/calendar toggle preserving state
tags: []
related: []
keywords: []
createdAt: '2026-05-23T08:37:01.985Z'
updatedAt: '2026-05-23T08:37:01.985Z'
---
## Reason
Curate Issue #2 calendar view feature from source spec

## Raw Concept
**Task:**
Implement calendar view toggle on timeline page with lightweight calendar entries API

**Changes:**
- Added CalendarView component rendering month grid with sakura dots
- Extended GET /api/entries to support ?view=calendar&year=&month= returning {id,date}
- Timeline page now toggles between list and calendar modes
- Calendar navigation respects current date boundaries
- List cursor state preserved across view switches

**Files:**
- src/components/CalendarView.tsx
- src/app/api/entries/route.ts
- src/app/timeline/page.tsx

**Flow:**
User toggles view -> fetch calendar entries -> render grid with clickable days -> navigate to diary on click

## Narrative
### Structure
CalendarView uses memoized grid calculation, entry map for fast lookup, skeleton loading, empty state with sakura icon. TimelinePage manages separate state for list vs calendar.

### Dependencies
Uses lucide-react icons, existing DiarySummary/CalendarEntry types, getCalendarEntries from @/lib/diary

### Highlights
Lightweight calendar API, cross-year month navigation disabled beyond today, sakura-themed dots for entries

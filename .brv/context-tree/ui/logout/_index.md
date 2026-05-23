---
children_hash: 4e5c9bdc396b5fe4186931b56b0ac2e9029e3a17a1fd9c607dcbe4e049258a11
compression_ratio: 0.3342503438789546
condensation_order: 1
covers: [logout_functionality.md]
covers_token_total: 727
summary_level: d1
token_count: 243
type: summary
---
## Logout Functionality

**Entry:** `logout_functionality.md`

### Core Implementation
- **Settings page** (`src/app/settings/page.tsx`): Red danger button at bottom triggers `signOut`
- **Mobile tab bar** (`src/components/MobileTabBar.tsx`): 800ms long-press on settings tab shows confirmation modal (cancel/confirm) before `signOut`
- **Header** (`src/components/Header.tsx`): Existing logout buttons for both desktop and mobile, directly calling `signOut`

### Architectural Decisions
- Reuse `signOut` across all entry points for consistency
- Mobile-only safety pattern: long-press (800ms) + explicit modal confirmation
- Cross-platform UX unification: desktop header + settings page + mobile tab bar

### Relationships
- Consolidated from `logout_functionality.abstract.md` and `logout_functionality.overview.md` (high overlap) into single richest source
- Files reference: `src/app/settings/page.tsx`, `src/components/MobileTabBar.tsx`, `src/components/Header.tsx`
---
children_hash: 6bee6d060da975ee713cd52da83390906fa1001bc1f2eeeee16c892ece0a7404
compression_ratio: 0.39715394566623546
condensation_order: 1
covers: [dashboard_stats_module.md]
covers_token_total: 773
summary_level: d1
token_count: 307
type: summary
---
## Dashboard Stats Module

**Entry**: `structure/stats/dashboard_stats_module.md` (consolidated from `.abstract.md` and `.overview.md` due to high overlap)

### Purpose
Adds stats dashboard to authenticated home page (#18), positioned between CTAs and tip card. Computes aggregates server-side and renders without external charting dependencies.

### Core Components
- **Aggregation Layer**: `src/lib/stats.ts` — single Prisma `findMany` + JS aggregation producing `totalWords`, `totalDays`, `streak`, `monthlyData`, `topTags`
- **API Endpoint**: `src/app/api/stats/route.ts` — exposes `GET /api/stats`
- **UI Component**: `src/components/DashboardStats.tsx` — client component managing four states (loading/error/empty/data) with pure Tailwind bar chart

### Key Architectural Decisions
- Server-side computation via one Prisma query + JS (avoids recharts)
- Streak logic: efficient single-pass backward walk from today/yesterday through date set
- Component state handling and Tailwind-only visualization for minimal dependencies

### Relationships
- Mounted on home page; depends on authenticated session and Prisma diary data
- Follows pattern of server aggregation + lightweight client rendering seen in other stats modules
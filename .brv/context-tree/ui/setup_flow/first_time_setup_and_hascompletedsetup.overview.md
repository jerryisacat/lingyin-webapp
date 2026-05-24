- Key points
  - Introduces `hasCompletedSetup` boolean field on User table to track incomplete first-time setup vs. defaults
  - AppShell consumes UserConfigContext and redirects authenticated users to /setup when flag is false (unless already on setup page)
  - Login page performs direct redirect to /setup immediately after signIn based on the flag
  - PUT /api/user/style automatically sets `hasCompletedSetup=true` upon style save
  - UserConfigContext fetches /api/user/style and exposes writingStyle + hasCompletedSetup state with loading handling
  - Setup page renders variant UIs depending on hasExistingStyle; reuses WritingStyleConfig component
  - AppShell displays loading spinner on authenticated routes (except /setup) while config is loading

- Structure / sections summary
  - Reason: curate context for initial setup flow
  - Raw Concept: task description, listed files, high-level flow diagram
  - Narrative: Structure (DB field + provider + guards + setup page), Highlights (seamless redirects, auto-flag, spinner)
  - Facts: eight detailed bullet points covering field, redirects, API side-effect, context, UI variants, and component usage

- Notable entities, patterns, or decisions
  - Entities: AppShell.tsx, src/app/login/page.tsx, src/app/setup/page.tsx, UserConfigContext.tsx, /api/user/style route, WritingStyleConfig component
  - Pattern: guard + context-driven redirect on first login; automatic flag mutation on style persistence
  - Decision: separate loading state handling in AppShell for setup vs. other authenticated pages; UI branching on hasExistingStyle
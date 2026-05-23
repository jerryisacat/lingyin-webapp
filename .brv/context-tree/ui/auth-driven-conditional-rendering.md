---
confidence: 0.88
sources: [structure/_index.md, ui/_index.md]
synthesized_at: '2026-05-23T18:01:20.204Z'
type: synthesis
title: Auth-Driven Conditional Rendering
summary: Supabase session state controls whether the root route shows a public landing page or an authenticated dashboard, enforced by middleware and AppShell.
tags: [auth, routing, supabase, landing]
related: []
keywords: [supabase, session, publicroutes, middleware, appshell]
createdAt: '2026-05-23T18:01:20.204Z'
updatedAt: '2026-05-23T18:01:20.204Z'
---

# Auth-Driven Conditional Rendering

Authentication is the single source of truth for UI branching between guest and logged-in experiences.

## Evidence

- **structure**: src_app handles auth flows, diary CRUD, timeline; integrates Supabase and local API key storage.
- **ui**: Supabase session drives conditional rendering of landing (hero+features) vs dashboard; PUBLIC_ROUTES + NO_SHELL_ROUTES constants; middleware marks / as public; AppShell excludes it from shell.

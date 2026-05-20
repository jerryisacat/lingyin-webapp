# AGENTS.md — 铃英日记 (lingyin-webapp)

## Project summary
AI-powered diary PWA. Users submit text + images, AI generates a polished Markdown diary entry. Phase 1: user brings their own LLM API key; later phases add subscription billing.

**Status: pre-code (design docs only). No source exists yet.**

## Tech stack
- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase PostgreSQL (cloud-hosted)
- **ORM:** Prisma — datasource `postgresql` pointing at Supabase connection string
- **Auth:** Supabase Auth — built-in Magic Link, session via `@supabase/ssr` cookie
- **PWA:** Serwist (`@serwist/next`) — do NOT use `next-pwa` (deprecated)
- **LLM SDK:** `openai` npm package (compatible with OpenAI / DeepSeek / Gemini)
- **Markdown:** `react-markdown` for rendering
- **Image & file storage:** CloudFlare R2 (S3-compatible, `@aws-sdk/client-s3`)
- **Deploy:** Vercel (monolith; frontend-backend split evaluated and deferred to Phase 3+)

## Deployment: frontend-backend split evaluation
CF Pages (frontend) + Vercel (API) separation was evaluated and **rejected for MVP**. Key blockers:
1. Supabase Auth session cookies are domain-bound — cross-domain requires token-based auth rewrite
2. CORS adds latency (~100-200ms per request) and complexity
3. Double deployment config for preview environments

**Decision:** Deploy as Next.js monolith on Vercel. R2 is used for storage regardless of hosting. Revisit split in Phase 3+ when scale demands it.

## Critical privacy constraints
- **User API Key is stored in browser `localStorage` only.** It is sent to the backend via `X-API-Key` header per request. The server MUST NOT log, persist, or store it — only forward it to the LLM API.
- Diary content (Markdown) is stored in CloudFlare R2. The database holds only metadata (Prisma `Entry` model).

## Architecture: content vs metadata split
Diary bodies live as `.md` files in CloudFlare R2, NOT in the database. The `Entry` table stores: `id`, `userId`, `date`, `tone`, `markdownPath`, `wordCount`, `hasImages`, `preview` (first 200 chars for timeline), `tags`, timestamps. There is a `@@unique([userId, date])` constraint — one entry per user per day.

**Vercel note:** Vercel has no persistent filesystem, so all file content (`.md` diaries, uploaded images) MUST use CloudFlare R2. The `data/` directory is for local dev only (gitignore it).

## Auth & session management
Using `@supabase/ssr` for Next.js App Router:
- **Server-side:** Route Handlers + Server Components use `createServerClient` to read session from cookies
- **Client-side:** `createBrowserClient` in browser components auto-manages cookies
- **Middleware:** `middleware.ts` calls `updateSession` on ALL routes, redirects unauthenticated users to `/login`

Flow: User enters email → Supabase sends Magic Link → user clicks link → `@supabase/ssr` sets session cookie → redirected to home.

## Prisma ↔ Supabase Auth user sync
`User.id` = `supabase.auth.users.id`. Two approaches:
1. **(Recommended)** Supabase Database Trigger: `CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN INSERT INTO public."User" (id, email) VALUES (new.id, new.email); RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER; CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
2. Fallback: first API request checks Prisma, creates User row if not found.

## API Key guard
Before accessing `/diary` or calling `/api/ai/*`, frontend checks `localStorage` for configured API key. If missing:
- Redirect to `/settings` with a prompt to configure the key
- API routes return `401` if `X-API-Key` header is missing

## Row Level Security (RLS)
All Supabase tables MUST have RLS enabled before production use. Storage (R2) doesn't need RLS — access is controlled server-side via S3 credentials.

**RLS policies:**
- `User` table: `(SELECT auth.uid()) = id` — users can only read/update their own row
- `Entry` table: `(SELECT auth.uid()) = "userId"` — users can only CRUD their own entries
- Service-side operations use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS

## Phase 1 scope (MVP)
Refer to `docs/03-Phase1-MVP说明.md`. Only build: AI diary generation (single tone: `warm`), Markdown editor, image upload, timeline browsing, PWA install, API Key settings.

**Excluded from Phase 1:** video upload, calendar view, multiple tones, subscription, diary editing after save, diary export, frontend-backend split.

## Confirmed design decisions
| Decision | Choice |
|----------|--------|
| Auth | Supabase Auth Magic Link |
| Auth middleware | `middleware.ts` global interception on all routes |
| Database | Supabase PostgreSQL |
| Image & file storage | CloudFlare R2 (S3 API via `@aws-sdk/client-s3`) |
| Data backup | R2 objects immutable versioning + cron `rclone sync` to secondary R2 bucket or external S3 |
| AI image handling | Always call vision API to describe photos before text generation |
| LLM providers | OpenAI / DeepSeek / Gemini — all three supported in settings |
| Timeline preview | Write first 200 chars to `Entry.preview` on save, query from DB |
| PWA offline | Pre-cache App Shell + last 10 diary entries |
| Secrets management | `.env.local` in dev, Vercel Environment Variables in production |
| Deploy | Vercel monolith (with Supabase Integration) |

## Source of truth
- `docs/01-PRD.md` — product requirements
- `docs/02-技术架构.md` — tech decisions, directory structure, API routes *(note: SQLite/VPS/Docker/S3 decisions here are superseded by this AGENTS.md)*
- `docs/03-Phase1-MVP说明.md` — exact MVP scope and tasks
- `docs/05-数据模型.md` — Prisma schema and TypeScript types (authoritative; overrides 02 if they conflict)

## Project structure
```
src/app/             — Next.js App Router pages
src/components/      — shared UI components
src/lib/             — services: ai/ (LLM client, prompts), storage.ts (R2 S3 API), diary.ts, db.ts
src/types/index.ts   — TypeScript types
prisma/schema.prisma — database schema (datasource: postgresql → Supabase)
data/                — development file storage (gitignore this)
public/              — PWA icons, manifest.json, sw.js
```

## Conventions
- Design: sakura pink (#f0a8b0) + warm white (#faf3e8), Noto Sans SC font, Lucide icons
- LLM streaming via SSE with typewriter animation on frontend
- `X-API-Key` header carries user's LLM key from client to server
- R2 storage paths: `{bucket}/users/{userId}/entries/{YYYY}/{MM}/{YYYY-MM-DD}.md`
- **Every change MUST be logged in `CHANGELOG.md`** — record: date, what changed, and the causal chain (why this change happened, what decision or discussion triggered it). If a change reverts or refines a prior change, link back to the original entry.

## Development milestones (Phase 1 MVP)

Below are self-contained stages designed for vibe coding with AI. Each stage fits within ~120K effective context. Stages are ordered by dependency — do NOT skip or reorder.

**Decision points:** Some stages have tagged questions for the user (■). The AI MUST pause and ask before proceeding when it hits one. If the user defers ("you decide"), the AI should pick the simplest option and note it.

---

### Stage 1 — Project Bootstrap

| | |
|---|---|
| **Goal** | Working Next.js dev server with Prisma, Tailwind, and Supabase Auth wiring |
| **Estimated context** | ~30K tokens |
| **Docs to load** | `docs/02-技术架构.md` §2.1, §7; `docs/05-数据模型.md` §1 (Prisma schema); `.env.example` |
| **Files to create** | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `prisma/schema.prisma`, `src/types/index.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/db.ts`, `.gitignore` |
| **■ Decision: Design tokens** | Before writing `tailwind.config.ts` and `globals.css`, ask: "Sakura pink #f0a8b0 and warm white #faf3e8 are the base palette. Do you have specific preferences for secondary colors, border radius, shadows, or the typography scale? Or should I derive them from the base palette?" |

**Verification checklist:**
- [ ] `npm run dev` starts without errors
- [ ] `npx prisma db push` creates tables in Supabase
- [ ] `http://localhost:3000` renders a styled page
- [ ] TypeScript compiles clean

---

### Stage 2 — Auth System

| | |
|---|---|
| **Goal** | Magic Link login working end-to-end with session persistence and protected routes |
| **Estimated context** | ~45K tokens |
| **Docs to load** | `docs/02-技术架构.md` §2.2, §6.3, §6.4; `docs/05-数据模型.md` §1 (User model) |
| **Files to create** | `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/auth/callback/route.ts` |
| **Files to modify** | `src/app/layout.tsx` (add auth provider wrapper if needed) |

**Context notes:**
- Session cookie from `@supabase/ssr` is domain-bound — middleware runs on ALL routes
- Database trigger for User sync is manual (run in Supabase SQL Editor)
- RLS policies are manual (run in Supabase SQL Editor). Apply policies for `User` and `Entry` tables now.

**Verification checklist:**
- [ ] Visiting `/` redirects unauthenticated user to `/login`
- [ ] Magic Link sends and callback sets session
- [ ] After login, redirects to `/` and middleware no longer redirects
- [ ] `User` row appears in database after first login (verify trigger works)
- [ ] `DELETE`, `INSERT` on other user's rows blocked by RLS

---

### Stage 3 — Backend Services

| | |
|---|---|
| **Goal** | All `lib/` services ready: R2 storage, LLM client, diary operations |
| **Estimated context** | ~55K tokens |
| **Docs to load** | `docs/02-技术架构.md` §3.2 (R2 paths); `docs/05-数据模型.md` §2, §4 (types); `docs/03-Phase1-MVP说明.md` §4 (warm tone prompt), §6 |
| **Files to create** | `src/lib/storage.ts`, `src/lib/ai/client.ts`, `src/lib/ai/prompts.ts`, `src/lib/diary.ts`, `src/lib/api-key-guard.ts` |
| **Files to modify** | `src/lib/db.ts` (ensure Prisma singleton), `src/types/index.ts` (verify all types from §4 of docs/05) |

**Context notes:**
- `src/lib/storage.ts`: Use `@aws-sdk/client-s3` with R2 endpoint. Expose: `saveMarkdown(userId, date, content)`, `readMarkdown(userId, date)`, `uploadImage(userId, imageBuffer, filename)`, `deleteEntry(userId, date)`.
- `src/lib/ai/client.ts`: Wraps `openai` npm package. Must accept `apiKey` and `baseURL` (for DeepSeek/Gemini compatibility). Implement streaming via `stream: true`.
- `src/lib/ai/prompts.ts`: Single tone `warm` for Phase 1. System prompt from docs/03 §4.
- `src/lib/diary.ts`: Orchestrates: ① call vision API for images, ② call LLM generate, ③ save markdown to R2, ④ upsert Entry metadata row. Writes `preview` (first 200 chars) on save.
- `src/lib/api-key-guard.ts`: Export `extractApiKey(request: NextRequest): string | null` and `requireApiKey(): NextResponse` helper.
- **CRITICAL:** LLM API Key from `X-API-Key` header. Server MUST NOT log/store it. Only forward to LLM API.

**Verification checklist:**
- [ ] `storage.saveMarkdown()` writes to R2, `readMarkdown()` reads it back
- [ ] `storage.uploadImage()` uploads and returns public URL
- [ ] `aiClient.generate()` streams tokens (test with `curl -N`)
- [ ] `diary.generateAndSave()` completes the full pipeline with mock data
- [ ] No API key logged in server console

---

### Stage 4 — API Routes

| | |
|---|---|
| **Goal** | All Route Handlers wired up and testable via HTTP |
| **Estimated context** | ~50K tokens |
| **Docs to load** | `docs/02-技术架构.md` §5 (API design table); `docs/03-Phase1-MVP说明.md` §5 |
| **Files to create** | `src/app/api/ai/generate/route.ts`, `src/app/api/ai/rewrite/route.ts`, `src/app/api/entries/route.ts`, `src/app/api/entries/[id]/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/user/config/route.ts` |

**Context notes:**
- Every route handler must: ① validate Supabase session, ② validate API Key for `/api/ai/*`, ③ return `ApiResponse<T>` shape
- `/api/ai/generate`: SSE streaming with proper headers (`text/event-stream`, `Cache-Control: no-cache`). Read `X-API-Key` header → pass to aiClient.
- `/api/entries`: GET (list with pagination via cursor or offset), POST (save new)
- `/api/entries/[id]`: GET (single), PUT (update), DELETE. Markdown content read from R2 on GET.
- `/api/upload`: Accept `multipart/form-data`, validate file type (jpg/png/webp) and size (<10MB), write to R2 via `storage.uploadImage()`, return URL + path.
- `/api/user/config`: GET/PUT. Store `tone` preference in User row. API key is NEVER stored server-side.

**Verification checklist:**
- [ ] `POST /api/ai/generate` returns SSE stream (test with `curl -N`)
- [ ] `POST /api/upload` returns URL after uploading to R2
- [ ] `GET /api/entries` returns paginated list from DB (no R2 reads)
- [ ] `GET /api/entries/[id]` returns full markdown from R2
- [ ] Unauthenticated requests return 401
- [ ] `/api/ai/*` without `X-API-Key` returns 401

---

### Stage 5 — App Shell + Settings Page

| | |
|---|---|
| **Goal** | Navigation, layout, and API Key configuration page working |
| **Estimated context** | ~45K tokens |
| **Docs to load** | `docs/03-Phase1-MVP说明.md` §2.1 (first-time flow), §3 (UI/UX); `docs/06-用户体验与交互流程.md` §1, §2.1 (landing + settings screens) |
| **Files to create** | `src/components/NavBar.tsx`, `src/components/MobileTabBar.tsx`, `src/app/settings/page.tsx`, `src/hooks/useLocalApiKey.ts` |
| **Files to modify** | `src/app/layout.tsx` (add NavBar + TabBar), `src/app/page.tsx` (landing for unauthenticated, redirect to /diary for authenticated) |

**Context notes:**
- Navigation: mobile bottom tab bar (📝写日记 / 📋时间线 / ⚙️设置), PC top nav bar
- Settings page: radio buttons for provider (OpenAI / DeepSeek / Gemini), password-style API Key input, "Test Connection" button
- `useLocalApiKey` hook: `{ provider, apiKey, setProvider, setApiKey, clearApiKey }`. Reads/writes `localStorage`. Exposes `isConfigured: boolean`.
- API Key guard: if `isConfigured === false`, redirect from `/diary` to `/settings` with a toast.
- **■ Decision: Home page behavior** — Ask: "When an authenticated user visits `/`, should they see a landing/splash with today's diary preview, or redirect straight to `/diary`?" If deferred, redirect to `/diary`.

**Verification checklist:**
- [ ] Mobile tab bar shows 3 tabs and highlights active tab
- [ ] Settings page saves provider + API Key to localStorage
- [ ] "Test Connection" calls a minimal LLM API and shows success/failure toast
- [ ] Visiting `/diary` without API Key redirects to `/settings`
- [ ] Login flow leads to correct destination (landing or /diary based on decision)

---

### Stage 6 — Diary Editor (core feature)

| | |
|---|---|
| **Goal** | Full diary writing experience: input → AI generate (streaming) → edit → save |
| **Estimated context** | ~80K tokens |
| **Docs to load** | `docs/03-Phase1-MVP说明.md` §2.2 (daily flow), §3.3 (editor wireframe), §4 (prompt); `docs/06-用户体验与交互流程.md` §2.2 (write flow + states) |
| **Files to create** | `src/app/diary/page.tsx`, `src/components/DiaryEditor.tsx`, `src/components/PhotoUploader.tsx`, `src/components/TypewriterText.tsx`, `src/hooks/useStreamGenerate.ts` |

**Context notes:**
- `DiaryEditor` has 3 states: `input` (text + image upload) → `generating` (SSE stream with typewriter) → `editing` (Markdown editor + preview). See docs/06 wireframes for exact layout.
- `useStreamGenerate` hook: calls `/api/ai/generate` with `fetch()` reading `ReadableStream`, accumulates tokens, exposes `{ text, isStreaming, error, generate, stop }`.
- `TypewriterText`: renders text character-by-character with cursor animation. Performance: use `requestAnimationFrame` or a debounced interval.
- `PhotoUploader`: 9-slot grid, drag-to-reorder, click-to-delete. Upload images immediately on selection (show progress bar per slot), store returned URLs. Pass image URLs (not files) to generate API.
- `MarkdownEditor` / preview: use a split-pane or toggle between raw textarea and `react-markdown` preview. Basic toolbar: bold, italic, heading (use `@uiw/react-md-editor` or simple custom controls).
- **■ Decision: Editor layout** — Ask: "For the editing view when AI output is ready — do you prefer (A) a single Markdown textarea with live preview toggle, or (B) a side-by-side split pane (left=edit, right=preview)?" If deferred, pick (A) for mobile-friendliness.
- **■ Decision: Save UX** — Ask: "After the user saves a diary entry, should they be (A) redirected to the diary detail view, or (B) shown a success toast and stay on the editor page?" If deferred, pick (A) redirect to detail.

**Verification checklist:**
- [ ] User can type text + upload images, click "✨ 让铃英帮你写" 
- [ ] SSE streaming shows typewriter animation in real-time
- [ ] "Stop" button interrupts generation
- [ ] User can edit generated Markdown before saving
- [ ] "Save" persists markdown to R2 + metadata to DB
- [ ] "Regenerate" clears output and re-calls the API
- [ ] Error states handled: network error, API Key invalid, LLM timeout

---

### Stage 7 — Timeline + Diary Detail

| | |
|---|---|
| **Goal** | Browse all diaries in reverse chronological order and view a single diary |
| **Estimated context** | ~50K tokens |
| **Docs to load** | `docs/03-Phase1-MVP说明.md` §2.2 (timeline wireframe); `docs/06-用户体验与交互流程.md` §2.3, §2.4 (timeline + detail wireframes), §3.3 (empty states) |
| **Files to create** | `src/app/timeline/page.tsx`, `src/components/TimelineList.tsx`, `src/components/DiaryCard.tsx`, `src/app/diary/[date]/page.tsx`, `src/components/MarkdownViewer.tsx` |

**Context notes:**
- `TimelineList`: infinite scroll or cursor-based "Load More". Each card shows: date, preview (first 200 chars from DB, no R2 call), image count indicator, tags. Wireframe from docs/06 §2.3.
- `DiaryCard`: click navigates to `/diary/{date}`.
- `MarkdownViewer`: renders markdown via `react-markdown` with image support. Images use `next/image` with `remotePatterns` allowing R2 public URL domain.
- Diary detail page: fetch from `/api/entries/[id]` (which reads full markdown from R2). Show: full rendered content, tags, word count, created date.
- Empty state for timeline: "还没有日记哦～ 点击「写日记」开始你的第一篇吧！🌸" with illustration. See docs/06 §3.3.
- **■ Decision: Timeline grouping** — Ask: "Should the timeline group entries by month with month headers, or just show a flat reverse-chronological list?" If deferred, group by month with headers.
- **■ Decision: Delete confirmation** — Ask: "Should deleting a diary entry require a confirmation dialog, or use a swipe-to-delete pattern with an undo snackbar?" If deferred, use confirmation dialog (simpler to implement, safer for MVP).

**Verification checklist:**
- [ ] Timeline shows all diary entries in reverse chronological order
- [ ] Each card shows date, preview, image count, tags (no full markdown load)
- [ ] Clicking a card navigates to detail page with full rendered markdown
- [ ] Images render correctly from R2 public URLs
- [ ] Empty timeline shows the empty state with CTA
- [ ] Pagination / "Load More" works
- [ ] Detail page supports delete (with confirmation flow)

---

### Stage 8 — PWA + Deploy + Polish

| | |
|---|---|
| **Goal** | Installable PWA deployed on Vercel, responsive across devices |
| **Estimated context** | ~40K tokens |
| **Docs to load** | `docs/02-技术架构.md` §4 (PWA strategy), §7 (env vars); `docs/03-Phase1-MVP说明.md` §7 (deploy); `docs/06-用户体验与交互流程.md` §4 (PWA install flow) |
| **Files to create** | `public/manifest.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `serwist.config.ts` (or `next.config.ts` Serwist integration), `src/app/sw.ts` (if Serwist needs), `vercel.json` |
| **Files to modify** | `src/app/layout.tsx` (add `<link rel="manifest">` + meta tags), existing components (responsive pass) |

**Context notes:**
- Serwist: use `@serwist/next` integration. Cache strategy per docs/02 §4.1: App Shell `CacheFirst`, diary content `NetworkFirst`, images `CacheFirst`, API `NetworkOnly`, static assets `StaleWhileRevalidate`.
- Install prompt: detect `beforeinstallprompt` event. Show a subtle banner: "📱 安装铃英日记到手机桌面" with [稍后] [安装] buttons. See docs/06 §4.1.
- Offline: App Shell loads offline. Show cached diary list. Write attempt shows "需要网络" notice.
- Responsive pass: verify all pages at 375px (iPhone SE), 768px (iPad), 1440px (desktop). Fix any layout breaks.
- `vercel.json`: set `framework: "nextjs"`, configure `regions: "hkg1"` (Hong Kong, closest to Chinese users), set env vars.
- **■ Decision: PWA icons** — Ask: "For PWA icons — do you have a logo/app icon design, or should I generate placeholder icons with the sakura pink gradient and '铃英' text?" If deferred, generate placeholder gradient icons with text.
- **■ Decision: Analytics** — Ask: "Do you want to add Vercel Analytics or any other analytics (Plausible, Umami) in this stage, or skip for MVP?" If deferred, skip for MVP.

**Verification checklist:**
- [ ] PWA passes Lighthouse PWA audit (≥ 90)
- [ ] "Add to Home Screen" prompt appears (test on mobile)
- [ ] Installing the PWA opens in standalone mode with sakura pink theme color
- [ ] Offline: App Shell loads, cached diaries visible
- [ ] Deployed to Vercel at production URL
- [ ] All env vars configured in Vercel dashboard
- [ ] Custom domain (if available) SSL auto-provisioned
- [ ] All pages responsive at 375px / 768px / 1440px

---

## Milestone summary

| Stage | What | Tokens | Deliverable |
|-------|------|--------|-------------|
| 1 | Project Bootstrap | ~30K | Dev server running |
| 2 | Auth System | ~45K | Magic Link login |
| 3 | Backend Services | ~55K | All lib/ ready |
| 4 | API Routes | ~50K | All endpoints wired |
| 5 | App Shell + Settings | ~45K | Navigation + API Key config |
| 6 | Diary Editor | ~80K | Full write → save flow |
| 7 | Timeline + Detail | ~50K | Browse + read diaries |
| 8 | PWA + Deploy + Polish | ~40K | Installed PWA on Vercel |

**Total: ~395K tokens across 8 stages, averaging ~50K per stage.**

When starting a stage, tell the AI: "Work on Stage X of the roadmap in AGENTS.md. Load the referenced doc sections first, then ask me the tagged decision points (■) before writing code."
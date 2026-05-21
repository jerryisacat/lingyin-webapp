# AGENTS.md — 玲音日记 (lingyin-webapp)

## Project summary
AI-powered diary PWA. Users submit text + images, AI generates a polished Markdown diary entry. Phase 1: user brings their own LLM API key; later phases add subscription billing.

**Status: All 8 stages complete (Phase 1 MVP ready for deploy).**

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

## AI Agent workflow rules

### 开发前：检索已有知识
在开始任何开发工作前，使用 `brv search <关键词>` 检索 `.brv/context-tree/` 中已有的项目知识，理解现有的架构决策和模式。
如果返回空结果，说明当前模块还未建立知识树，直接开始即可。

### 开发后（git commit 之前）：整理记忆
每次代码修改完成后按以下顺序操作：

1. **更新 `CHANGELOG.md`** — 记录日期、变更内容、触发原因
2. **整理 ByteRover 知识树** — 使用 `brv curate` 将新的模式、决策和架构变更保存到知识树

   ```bash
   # 好例子：包含实现路径和文件引用
   brv curate "Auth uses Supabase Magic Link with @supabase/ssr cookie middleware" -f src/lib/auth.ts

   # 批量分析整个模块
   brv curate --folder src/lib/
   ```
   > **curate 写作规范：** 要写"Auth uses Supabase Magic Link with @supabase/ssr cookie middleware — src/lib/auth.ts"，不要只写"改了认证"这种模糊描述。好的 curate 包含：具体做了什么、实现路径、关联文件。

3. **提交知识树变更** — 在 `.brv/context-tree/` 的 git 中记录版本
   ```bash
   git -C .brv/context-tree add -A
   git -C .brv/context-tree commit -m "描述本次知识变更"
   ```
4. **最后才做正常的 `git add`、`git commit`、`git push`**

> **注意：** `brv search` 是本地检索命令（离线可用，无需账号）。`brv query` 需要云账号登录且超时严重，慎用。

## Current status
Phase 1 is complete (MVP: AI diary generation, Markdown editor, image upload, timeline, PWA deploy). Phase 2-4 work is tracked as GitHub Issues — see below.

## Vibe Coding Workflow — Issue-Driven Development

所有后续开发工作（Phase 2-4）通过 GitHub Issues 管理，不再依赖 `docs/` 中的 Phase 文档。Agent 按以下流程操作：

### 开始一个 Issue 前
1. 用 `gh issue view <N>` 读取 Issue 完整内容（Issue body 中包含：目标、实现入口、涉及文件、组件规格、API 契约、参考模式、验收条件、边缘场景）
2. 用 `brv search <关键词>` 检索项目知识树，理解现有架构
3. 阅读涉及的现有文件，理解当前实现

### 开发中
- 严格按照 Issue 中的"参考模式"复用现有代码模式
- 遵循 Issue 中的"组件规格"和"API 契约"——它们是实现 spec
- 注意"边缘场景 & 坑"中的已知陷阱

### 开发完成后
1. 运行 `npx tsc --noEmit` 确保 TypeScript 零错误
2. 逐项验证 Issue 中的"验收条件"
3. **更新 `CHANGELOG.md`** — 记录日期、变更内容、对应的 Issue 编号
4. **整理 ByteRover 知识树** — `brv curate "..."` 保存新模式/决策
5. **提交知识树变更** — `git -C .brv/context-tree add -A && git -C .brv/context-tree commit -m "..."`
6. **提交代码** — `git add` + `git commit`（commit message 中引用 Issue 编号，如 `Closes #5`）
7. `git push`

### Issue Labels 速查

| Label | 含义 |
|-------|------|
| `scope:frontend` / `scope:backend` / `scope:fullstack` | 变更范围 |
| `layer:ui` / `layer:api` / `layer:db` / `layer:storage` / `layer:ai` | 修改层级 |
| `priority:p0` / `priority:p1` / `priority:p2` / `priority:p3` | 优先级 |
| `monetization` / `platform` | 业务域 |
| `blocked` | 被其他 Issue 阻塞 |
| `needs-decision` | 有架构选择待定 |

### Milestones

| Milestone | Issues | 说明 |
|-----------|--------|------|
| Phase 2 — 体验升级 | 8 个 | 日历、视频、编辑、多语气、备份、导出、灯箱、夜间 |
| Phase 3 — 商业化 | 6 个 | 支付、额度、统一 Key、后台、迁移、导出 |
| Phase 4 — 平台化 | 6 个 | 分享、话题、统计、自定义、原生、开放 API |
| 基础设施 | 1 个 | 测试 + CI |

查看所有 Issue：`gh issue list --state open`
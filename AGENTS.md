# AGENTS.md — 玲音日记 (lingyin-webapp)

## Project summary
AI-powered diary PWA. Users submit text + images, AI generates a polished Markdown diary entry. Phase 1: user brings their own LLM API key (encrypted server-side); later phases add subscription billing.

**Status: Phase 2 (Stream B) complete — End-to-end encryption infrastructure integrated. Issues #53, #54, #55, #56, #57, #58 done.**

## Tech stack
- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase PostgreSQL (direct connection via Prisma)
- **ORM:** Prisma — datasource `postgresql` pointing at Supabase connection string
- **Auth:** Auth.js v5 (Credentials + JWT, bcrypt 12 rounds), Resend email
- **PWA:** Serwist (`@serwist/next`) — do NOT use `next-pwa` (deprecated)
- **LLM SDK:** `openai` npm package (compatible with OpenRouter API)
- **Markdown:** `react-markdown` for rendering
- **Image & file storage:** CloudFlare R2 (S3-compatible, `@aws-sdk/client-s3`)
- **Encryption:** Web Crypto API (`SubtleCrypto`) — client-side AES-256-GCM + PBKDF2 (100k iter, SHA-256) for diary E2EE
- **Deploy:** Vercel (monolith, region: hkg1)

## Critical privacy constraints
- **API Keys are stored server-side** encrypted with AES-256-GCM in the `ApiKey` table. The server decrypts and forwards to LLM providers per-request. Never logged, never persisted in plaintext.
- Diary content (Markdown) is stored in CloudFlare R2. The database holds only metadata (Prisma `Entry` model).
- **`API_KEY_ENCRYPTION_KEY` must be backed up.** If lost, all stored API keys become permanently unrecoverable.
- **Encryption password is never stored in plaintext.** The server stores `encryptionPasswordHash` (bcrypt) for verification and `encryptionSalt` (plaintext) for PBKDF2 derivation. The client derives AES-256 keys locally using Web Crypto API — the server never sees the encryption password or the derived key.
- **If the user loses their encryption password, diaries are permanently unrecoverable.** This is by design — true zero-knowledge encryption.

## Architecture: content vs metadata split
Diary bodies live as `.md` or `.enc.md` files in CloudFlare R2, NOT in the database. Encrypted diaries use AES-256-GCM with a `.enc.md` extension and `encrypted=true` S3 metadata flag. The `Entry` table stores: `id`, `userId`, `date`, `tone`, `markdownPath`, `wordCount`, `hasImages`, `preview` (first 200 chars for timeline, null for encrypted entries), `tags`, timestamps. There is a `@@unique([userId, date])` constraint — one entry per user per day.

**Vercel note:** Vercel has no persistent filesystem, so all file content (`.md` diaries, uploaded images) MUST use CloudFlare R2. The `data/` directory is for local dev only (gitignore it).

## Auth & session management
Using Auth.js v5 with Credentials provider + JWT strategy:
- **Server-side:** `getSessionUserId()` reads JWT session via `auth()` from `next-auth`
- **Client-side:** `signIn("credentials")`, `signOut()`, `useSession()` from `next-auth/react`
- **Middleware:** `auth()` wrapper in `middleware.ts` protects page routes. API routes (`/api/*`) pass through and handle their own auth via `getSessionUserId()`

Flow: User registers → verification email → clicks verify link → emailConfirmed set → logs in with email+password → JWT cookie set → all subsequent requests carry the session.

## API Key management
- **Storage:** AES-256-GCM encrypted in PostgreSQL `ApiKey` table, one per `(userId, provider)`
- **API Routes:** `/api/user/api-keys` (GET/POST/DELETE) — CRUD operations, session-gated
- **Usage:** LLM API routes call `getUserDecryptedApiKey(userId, provider)` to retrieve and decrypt on the fly
- **Test:** `/api/ai/test` accepts optional `apiKey` in body (testing unsaved key) or reads from DB (testing saved key)

## End-to-End Encryption (E2EE)
- **Lib:** `src/lib/client-crypto.ts` — client-side only, uses Web Crypto API (`SubtleCrypto`). No third-party encryption libraries. Functions: `encryptMarkdown`, `decryptMarkdown`, `generateSalt`
- **Encryption:** AES-256-GCM with random 12-byte IV per encryption. Output format: `iv:authTag:ciphertext` (base64). PBKDF2 key derivation: 100,000 iterations, SHA-256, 256-bit output
- **Password management:** Server stores `encryptionPasswordHash` (bcrypt 12 rounds) for verification + `encryptionSalt` (32 bytes random, plaintext) for PBKDF2. Client derives keys locally — server never sees encryption password or derived key
- **API Routes:** `/api/user/encryption-password` (POST set, PUT change) → returns `salt`; `/api/user/encryption-password/verify` (POST) → `{ valid }`; `/api/user/encryption-password/status` (GET) → `{ hasEncryptionPassword, salt }`
- **Session cache:** `EncryptionProvider` React Context holds password+salt in memory for the session. Cleared on page refresh / tab close. `useEncryption()` hook provides `unlock(password, salt)` / `lock()` / `isUnlocked`
- **Unlock flow:** Diary detail page detects `isEncrypted` from API response → shows `UnlockDiaryModal` → verifies password server-side → derives key client-side → decrypts in browser. 5 failed attempts lock for 5 minutes
- **Migration:** `GET /api/diary/migrate-encrypt` lists plaintext entries; `POST` accepts encrypted content per entry; `GET /api/diary/migrate-status` shows progress. Migration UI in `EncryptionSettings` component: client reads plaintext → encrypts with Web Crypto → uploads encrypted → server deletes old plaintext file and updates DB record
- **UI components:** `SetEncryptionPasswordModal`, `UnlockDiaryModal`, `EncryptionSettings`, `/forgot-encryption-password` page
- **Zero-knowledge guarantee:** If user loses encryption password, all encrypted diaries are permanently unrecoverable — the server has no way to decrypt them

## Prisma ↔ User management
`User.id` is generated by Prisma (`@default(cuid())`). No Supabase Auth trigger needed. Prisma manages User lifecycle independently:
- Registration creates User + VerificationToken in a transaction
- `passwordHash` stored as bcrypt (12 rounds)
- `emailVerified` set on successful verification

## Confirmed design decisions
| Decision | Choice |
|----------|--------|
| Auth | Auth.js v5 Credentials + JWT |
| Auth middleware | `middleware.ts` with `auth()` wrapper |
| Password hashing | bcrypt 12 salt rounds |
| Email | Resend (verification, password reset) |
| Token generation | `crypto.randomUUID()` |
| Token expiry | verification 24h, password reset 1h |
| API Key storage | AES-256-GCM encrypted in PostgreSQL |
| LLM 定价配置 | `config/billing-pricing.json` — 模型价格、套餐定义、加购包 |
| Image & file storage | CloudFlare R2 (S3 API via `@aws-sdk/client-s3`) |
| LLM providers | OpenRouter (unified gateway) |
| Timeline preview | first 200 chars in `Entry.preview` |
| PWA offline | Serwist: CacheFirst for shell, NetworkOnly for entries |
| Secrets management | `.env` in dev, Vercel Environment Variables in production |
| Deploy | Vercel monolith, region hkg1 |

## Project structure
```
src/app/             — Next.js App Router pages (login, register, diary, timeline, settings, etc.)
src/components/      — shared UI components (auth/, DiaryEditor, etc.)
src/hooks/           — React hooks (useApiKeys, useStreamGenerate)
src/lib/             — services:
  auth.ts            — Auth.js v5 config
  auth-helpers.ts    — getSessionUserId, json helpers
  auth-service.ts    — register, verify, forgot/reset password business logic
  crypto.ts          — AES-256-GCM encrypt/decrypt
  client-crypto.ts   — Web Crypto API E2EE (client-side only: encryptMarkdown, decryptMarkdown, generateSalt)
  email.ts           — Resend email sending
  api-helpers.ts     — getUser() → getSessionUserId()
  api-key-guard.ts   — getUserDecryptedApiKey(), extractApiKey()
  ai/client.ts       — OpenAI SDK wrapper
  ai/prompts.ts      — System/user prompts
  storage.ts         — R2 S3 API
  diary.ts           — Diary CRUD + AI generation
  db.ts              — Prisma client singleton
src/middleware.ts     — Auth.js route protection
prisma/schema.prisma — database schema
docs/                — architecture docs, deploy guide
```

## Conventions
- Design: sakura pink (#f0a8b0) + warm white (#faf3e8), Noto Sans SC font, Lucide icons
- LLM streaming via SSE with typewriter animation on frontend
- R2 storage paths: `users/{userId}/entries/{YYYY}/{MM}/{YYYY-MM-DD}.md` (plaintext) or `.enc.md` (encrypted)
- Encrypted entries have S3 metadata `encrypted: "true"` and `preview` set to null in DB
- Auth Service returns `ServiceResult<T>` (`{ ok, data? }` | `{ ok, error }`)
- API routes return `{ ok, data }` or `{ ok, error }` via `jsonOk`/`jsonError`
- **Every change MUST be logged in `CHANGELOG.md`**

## Deploy

See `docs/deploy.md` for full deployment guide. Key points:
- Vercel deploys from `main` branch only
- Build command: `npx prisma generate && next build`
- Region: hkg1
- All env vars must be set in Vercel dashboard (see `.env.example`)

## AI Agent workflow rules

### 创建 Issue

仅记录**需求**，不涉及实现方案。Agent 的任务是:
1. **挖掘需求**: 从用户描述中提取核心问题，确保 Issue 描述清晰完整
2. **不写方案**: 不涉及具体代码改动、技术选型、文件路径 — 这些留给开发阶段
3. **必要时追问**: 如果需求模糊或存在多种理解，使用 `question` 工具弹出选项让用户选择

Issue 应包含:
- 概述（用户想达成什么）
- 动机（为什么需要）
- 验收标准（如何判断完成）
- Labels（便于分类和过滤）

### Labels 规则

| 维度 | 标签 | 说明 |
|------|------|------|
| **类型** | `bug` / `enhancement` | 缺陷修复 / 功能增强 |
| **范围** | `scope:frontend` / `scope:backend` / `scope:fullstack` | 前端 / 后端 / 全栈改动 |
| **层级** | `layer:ui` / `layer:api` / `layer:db` / `layer:storage` / `layer:ai` | UI 层 / API 层 / 数据库 / 存储 / AI |
| **优先级** | `priority:p0` / `p1` / `p2` / `p3` | P0 紧急 / P1 高 / P2 中 / P3 低 |
| **状态** | `blocked` / `needs-decision` / `epic` | 被阻塞 / 待决策 / 大型 Epic |
| **领域** | `monetization` / `platform` | 商业化 / 平台相关 |

**规则:**
1. 每个 Issue 至少打上 **类型** + **范围** 两个维度的标签
2. `epic` 用于包含多个子任务的大型需求，通常跨 scope/layer
3. `needs-decision` 用于需求尚未明确的探索性 Issue
4. 有前置依赖的 Issue 打 `blocked` 并在正文标注 `> **前置 Issue:** #N`

### 开发前：检索已有知识
1. Pull latest code from main.
2. 使用 `brv search <关键词>` 检索 `.brv/context-tree/` 中已有的项目知识。

### 开发后（git commit 之前）
1. 更新 `CHANGELOG.md`
2. `brv curate "..."` 整理知识树
3. `git -C .brv/context-tree add -A && git -C .brv/context-tree commit -m "..."`
4. `git add` + `git commit` + `git push`

## Vibe Coding Workflow — Issue-Driven Development

- 每个 Issue 使用独立分支：`develop/issue-N`
- Agent 不合并代码 — Agent 创建 PR，用户审核后手动合并

### 开发完成后
1. `npx tsc --noEmit` 确保 TypeScript 零错误
2. 更新 `CHANGELOG.md`
3. `brv curate "..."` 整理知识树
4. `git add` + `git commit` + `git push origin develop/issue-N`
5. 使用 `gh issue comment <N> --body "..."` 通知用户并 Close Issues
6. 使用 `gh pr create` 创建 PR (base: main, head: develop/issue-N)

# CHANGELOG

## 2026-05-22 — Issue #29: Remove Supabase Auth, Build Independent Account System

**触发原因**: 降低对 Supabase Auth 的耦合，掌控完整认证逻辑。使用 Auth.js v5 (Credentials + JWT) + Resend email + AES-256-GCM API Key 加密存储搭建自建账户系统。

### Phase A: 数据库 + 基础设施
- `prisma/schema.prisma`: 新增 `passwordHash`, `emailVerified`, `image` 字段到 `User` 模型；新建 `VerificationToken`, `PasswordResetToken`, `ApiKey` 模型
- `src/lib/crypto.ts`: AES-256-GCM 加密/解密 (`encryptApiKey`, `decryptApiKey`)
- `src/lib/email.ts`: Resend 邮件发送 (`sendVerificationEmail`, `sendPasswordResetEmail`)
- `.env.example`: 新增 `AUTH_SECRET`, `API_KEY_ENCRYPTION_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`

### Phase B: Auth 核心
- `src/lib/auth.ts`: Auth.js v5 配置 — Credentials provider (bcrypt 验证), JWT strategy, session callback
- `src/lib/auth-helpers.ts`: `getSessionUserId()`, `jsonOk()`, `jsonError()`
- `src/app/api/auth/[...nextauth]/route.ts`: Auth.js v5 API route
- `src/middleware.ts`: 重写 — `auth()` wrapper 拦截页面路由，API Routes 透传

### Phase C: 注册 + 验证 + 密码重置
- `src/lib/auth-service.ts`: 共享业务逻辑 — `registerUser()`, `verifyEmail()`, `resendVerification()`, `forgotPassword()`, `resetPassword()` (无 `"use server"`)
- 5 个 API Routes: `POST /api/auth/register`, `GET /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `src/components/auth/PasswordInput.tsx`: 密码输入组件 (show/hide toggle)
- 3 个 Client Component 页面重写: `register`, `forgot-password`, `reset-password` (使用 `fetch()`)
- 1 个 Server Component 保持: `verify-email` (直接调用 `auth-service.ts`)
- 删除 `src/lib/auth-actions.ts` (Server Actions 方案)

### Phase D: 登录页
- `src/app/login/page.tsx`: 重写 — `useTransition` + `PasswordInput` + `form action` 模式
- `src/components/auth/VerifyEmailBanner.tsx`: 验证邮件重发组件 (loading/success/error 状态机)

### Phase E: API Key 服务端迁移
- `src/app/api/user/api-keys/route.ts`: GET (列出) / POST (upsert 加密) / DELETE (软删除)
- `src/hooks/useApiKeys.ts`: React hook — `keys`, `loading`, `saveKey`, `deleteKey`, `hasKey`
- `src/lib/api-key-guard.ts`: 新增 `getUserDecryptedApiKey(userId, provider)` 从 DB 解密取钥
- `src/app/settings/page.tsx`: 重写 — 使用 `useApiKeys`, 双写 DB + localStorage (向后兼容), "已配置" 标签

### Phase F: 全线 Auth 集成
- `src/app/api/ai/generate/route.ts`: `checkApiKey` → `getUserDecryptedApiKey`, 移除 `X-API-Key` 依赖
- `src/app/api/ai/rewrite/route.ts`: 同上
- `src/app/api/ai/test/route.ts`: 支持 body `apiKey` (测试未保存) 或 DB 读取 (测试已保存)
- `src/hooks/useStreamGenerate.ts`: 移除 `apiKey` 参数和 `X-API-Key` header
- `src/app/diary/page.tsx`: `useLocalApiKey` → `useApiKeys`, 移除 `apiKey` prop
- `src/components/DiaryEditor.tsx`: 移除 `apiKey` prop

### Phase G: 清理
- 删除 `src/lib/supabase/`, `src/app/auth/callback/route.ts`, `src/hooks/useLocalApiKey.ts`, `prisma/sql/`, `scripts/supabase-setup.sql`
- 移除依赖: `@supabase/ssr`, `@supabase/supabase-js`, `cookie`, `@types/cookie`

### Phase H: 文档
- `docs/deploy.md`: 新建 — Vercel 部署指南完整流程
- `docs/02-技术架构.md`: 更新 — 架构图、Auth 流程、API 表、环境变量、目录结构
- `docs/05-数据模型.md`: 更新 — 完整 Prisma Schema、类型定义
- `AGENTS.md`: 更新 — Auth、API Key、设计决策、项目结构

### 决策记录
- **Auth.js v5 over Supabase Auth**: Credentials + JWT + Resend 替代 Magic Link，完全自建
- **API Routes over Server Actions**: 注册/验证/重置改用 API Routes，便于独立测试和中间件透传
- **API Key 服务端加密**: localStorage → PostgreSQL AES-256-GCM，鉴权走 Auth.js session，降低泄露风险
- **bcrypt 12 rounds**: 平衡安全性和登录延迟 (~300ms)
- **Token 生成**: `crypto.randomUUID()`，验证 24h 过期，重置 1h 过期

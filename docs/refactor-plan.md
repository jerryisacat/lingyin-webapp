## 7. 数据迁移策略

### 7.1 前提

当前为 MVP 阶段，用户为早期测试用户。需要与用户确认策略：

**方案 A (推荐 - 零停机，渐进式):**
- Supabase Auth User → 自建 User: 保留原 `User` 表但修改结构
- 新增 `passwordHash` 字段，现有密码为 `null`
- 要求现有用户在登录页先通过邮箱验证设密码（等同于密码重置流程）
- 不创建 DB trigger，改为首次 API 请求时的 fallback 模式（检查用户是否存在）

**方案 B (快速 - 重置所有):**
- 清空 `User`、`Entry`、`VerificationToken` 等表
- 清空 R2 目录
- 所有用户重新注册使用新系统
- 前提：当前无真实用户或用户数据可丢弃

需要用户抉择。

### 7.2 Prisma 迁移

1. `npx prisma migrate dev --name remove-supabase-auth`
2. 迁移包含：新增 `passwordHash` / `emailVerified` / `image` 字段，新建 `VerificationToken` / `PasswordResetToken` / `ApiKey` 表
3. 对于现有 `User` 行，`passwordHash` 为 null（需用户设置密码）
4. 对于现有 `Entry` 行，`userId` 保持原 Supabase Auth UUID（cuid2 作为默认生成，不影响已有数据）

---

## 8. 实施顺序（按依赖关系）

### Phase A: 数据库 + 基础设施 (先做，阻塞后续所有)
1. 更新 `prisma/schema.prisma` → `prisma migrate dev`
2. 新建 `src/lib/crypto.ts` (加密/解密工具)
3. 新建 `src/lib/email.ts` (邮件发送)
4. 更新 `.env.example` 和 `.env.local` 变量

### Phase B: Auth 核心
5. 新建 `src/lib/auth.ts` (Auth.js 配置)
6. 新建 `src/lib/auth-helpers.ts` (getSessionUserId / requireAuth)
7. 新建 `src/app/api/auth/[...nextauth]/route.ts`
8. 重写 `src/middleware.ts`

### Phase C: 注册 + 验证 + 密码重置
9. 新建 `POST /api/auth/register`
10. 新建 `GET /api/auth/verify-email`
11. 新建 `POST /api/auth/resend-verification`
12. 新建 `POST /api/auth/forgot-password`
13. 新建 `POST /api/auth/reset-password`
14. 新建 `src/app/register/page.tsx`
15. 新建 `src/app/verify-email/page.tsx`
16. 新建 `src/app/reset-password/page.tsx`
17. 新建 `src/components/auth/PasswordInput.tsx`

### Phase D: 登录页重写
18. 重写 `src/app/login/page.tsx`
19. 新建 `src/components/auth/VerifyEmailBanner.tsx`

### Phase E: API Key 服务端迁移
20. 新建 `src/app/api/user/api-keys/route.ts`
21. 新建 `src/hooks/useApiKeys.ts`
22. 更新 `src/lib/api-key-guard.ts`
23. 更新 `src/app/settings/page.tsx`

### Phase F: 全线 auth 集成
24. 更新 `src/lib/api-helpers.ts` (getUser → getSessionUserId)
25. 更新所有 API Routes (diary, ai, upload, user/config 等)
26. 更新所有前端页面和组件中的 auth 检查

### Phase G: 清理
27. 删除 `src/lib/supabase/`
28. 删除 `src/app/auth/callback/route.ts`
29. 删除 `src/hooks/useLocalApiKey.ts`
30. 删除 `prisma/sql/` / `scripts/supabase-setup.sql`
31. 移除依赖: `@supabase/ssr`, `@supabase/supabase-js`, `cookie`, `@types/cookie`
32. 新增依赖: `next-auth@beta`, `bcryptjs`, `@types/bcryptjs`, `resend`

### Phase H: 文档 + 验证
33. 更新 `docs/02-技术架构.md`
34. 更新 `docs/05-数据模型.md`
35. 更新 `AGENTS.md`
36. 更新 `CHANGELOG.md`
37. `npx tsc --noEmit` 零错误
38. 完整注册→验证→登录→写日记流程 E2E 验证

---

## 9. 风险 & 边缘场景

| 场景 | 处理 |
|------|------|
| 已有 Supabase Auth 用户迁移 | 密码设为 null → 引导走"忘记密码"流程设密码 |
| 密码重置后旧 session | JWT 策略无 session 表，旧 JWT 仍有效（有效期由 `maxAge` 控制，默认 30 天） |
| 邮箱未验证用户尝试登录 | authorize() 返回 null + custom error → 前端引导去验证页 |
| 验证链接过期 (24h) | /verify-email 页显示过期提示 + 重发按钮 |
| 密码重置链接过期 (1h) | /reset-password 页显示过期提示 + 重新申请 |
| SMTP 限流 (Resend 免费 100/day) | API 返回 429 → 前端展示"请稍后再试" |
| API Key 加密密钥丢失 | 所有加密 Key 不可恢复 → 用户需重新配置。密钥必须备份到 1Password/Vault |
| Auth.js JWT 签名密钥轮换 | AUTH_SECRET 变更后所有现有 session 失效 → 需重新登录 |
| cuid2 碰撞 | 概率约为 2^-128，可忽略 |
| bcrypt 性能 | 12 salt rounds，login 端延迟 ~300ms，可接受 |

---

## 10. 未决问题（需用户确认）

### Q1: 数据迁移策略？
- **方案 A**: 保留现有 User/Entry 数据，现有用户通过"忘记密码"设密码 (默认推荐)
- **方案 B**: 清空所有数据，重新开始

### Q2: SMTP 服务选型？
- Resend (免费 100 emails/day)
- AWS SES ($0.10/1000 emails)
- SendGrid
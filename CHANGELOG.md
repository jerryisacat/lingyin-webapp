# CHANGELOG

## 2026-05-22 — Phase C: 账户系统登录/注册/验证/重置流程 (Issue #29)

**触发原因**: Issue #29 — 移除 Supabase Auth，独立开发账户系统。Phase B 已完成 Auth.js v5 基础设施（Credentials provider、JWT session、middleware 重写），Phase C 补齐用户可用的完整 auth 流程页面。

### 变更内容

- `src/middleware.ts`: 新增 `/register`、`/verify-email`、`/forgot-password`、`/reset-password` 为公开路由（同时列入 `public` 和 `auth` 路由列表，已登录用户访问时重定向到 `/`）
- `src/lib/auth-actions.ts` **(新文件)**: Server Actions 集中管理 auth 操作
  - `registerAction` — 邮箱注册 (校验 → bcrypt 哈希 → Prisma 创建用户 + VerificationToken → 发送验证邮件)
  - `verifyEmailAction` — 邮箱验证 (token 校验 → 过期检查 → 设置 `emailVerified` → 删除 token)
  - `forgotPasswordAction` — 忘记密码 (查找用户 → 生成 PasswordResetToken → 发送重置邮件)
  - `resetPasswordAction` — 重置密码 (token 校验 → 过期检查 → bcrypt 新密码 → 删除 token)
- `src/app/login/page.tsx`: 重写为完整的 Email + Password 登录表单
  - 使用 `signIn("credentials", { redirect: false })` 进行客户端认证
  - 错误消息：邮箱或密码错误 / 邮箱未验证
  - 底部链接：注册账号、忘记密码
  - 密码显示/隐藏切换
- `src/app/register/page.tsx` **(新文件)**: 注册页面
  - Email + Password + Confirm Password 表单
  - 客户端校验后提交 Server Action
  - 成功后显示"已发送验证邮件"状态，引导用户查收邮件
- `src/app/verify-email/page.tsx` **(新文件)**: 邮箱验证页面 (Server Component)
  - 通过 `searchParams.token` 接收验证令牌
  - 调用 `verifyEmailAction` 服务端验证
  - 成功/失败两种视觉状态（绿色/红色图标 + 对应文案）
- `src/app/forgot-password/page.tsx` **(新文件)**: 忘记密码页面
  - 邮箱输入 → Server Action 发送重置邮件
  - 成功后显示确认提示
- `src/app/reset-password/page.tsx` **(新文件)**: 重置密码页面 (Client Component)
  - 通过 `searchParams.token` 接收重置令牌
  - 新密码 + 确认密码 → Server Action 完成重置
  - 成功后引导用户前往登录

### 决策记录
- **Server Actions vs API Routes**: 选用 Server Actions (`useActionState`)，因为 auth 操作是表单提交，不需要单独 API endpoint，且 middleware 对 API 路由不做 auth 拦截
- **Token 生成**: 使用 `crypto.randomUUID()`，不引入额外依赖
- **Token 过期**: 验证令牌 24 小时，密码重置令牌 1 小时
- **注册后未登录**: 注册成功不自动登录，用户需先验证邮箱后再登录（auth.ts 中 `authorize` 要求 `emailVerified` 不为 null）

# 玲音日记 (lingyin-webapp) 全量代码审计报告

**审计日期：** 2026-05-23  
**代码库版本：** 0.1.0  
**审计范围：** 全量 55 个源文件（`src/`、`prisma/`、配置文件）  
**技术栈：** Next.js 14 App Router, TypeScript, Prisma, Supabase PG, CloudFlare R2, Upstash Redis, Auth.js v5, AES-256-GCM, PWA/Serwist, OpenRouter AI

---

## 一、安全审计 (Security Audit)

### 1.1 认证与授权安全

#### [🔴 严重] `AUTH_SECRET` 生产环境使用随机密钥

- **所在文件**：`src/lib/auth.ts:11-16`
- **风险等级**：🔴 严重
- **问题描述**：当 `NODE_ENV !== "production"` 时打印警告并使用随机密钥。在 Vercel Serverless 下每次冷启动都生成新密钥，导致所有 JWT Session 失效。
- **修复建议**：在生产环境显式抛出异常阻止启动：

```ts
if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required")
}
```

---

#### [🟠 高危] 登录接口无账号级锁定机制

- **所在文件**：`src/lib/auth.ts:33-55`
- **风险等级**：🟠 高危
- **问题描述**：仅依赖 IP 级限流（5 次/分钟），分布式 IP 攻击可绕过。无账号级失败计数器或账户锁定。
- **修复建议**：增加账号级 Redis 计数器 `failed_attempts:{userId}`，连续 5 次错误锁定 15 分钟。

---

#### [🟠 高危] 邮件验证 Token 通过 GET URL query 传递

- **所在文件**：`src/app/api/auth/verify-email/route.ts:4-5`
- **风险等级**：🟠 高危
- **问题描述**：Token 通过 `?token=xxx` 暴露在服务器日志、浏览器历史、Referrer 头中。
- **修复建议**：改为 POST 方法，Token 放 body；或接收 GET 后 `replaceState` 清 URL。

---

#### [🟡 中危] 缺少 CSP (Content Security Policy) 头

- **所在文件**：`next.config.mjs:18-29`
- **风险等级**：🟡 中危
- **问题描述**：只配置了 `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`，无 CSP。`react-markdown` 渲染存在 XSS 风险面。
- **修复建议**：

```js
{ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.r2.cloudflarestorage.com; connect-src 'self'" }
```

---

#### [🟡 中危] 图片上传仅 MIME 校验，缺少 Magic Bytes

- **所在文件**：`src/app/api/upload/route.ts:36-38`
- **风险等级**：🟡 中危
- **问题描述**：仅检查 `file.type`（浏览器可伪造），无 Magic Bytes 验证。攻击者可上传任意文件。
- **修复建议**：读取文件头 4-8 bytes 与已知 Magic Bytes 比对（JPG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `52 49 46 46`）。

---

#### [🔵 低危] 密码重置后旧 JWT 未失效

- **所在文件**：`src/lib/auth-service.ts:194-239`
- **风险等级**：🔵 低危
- **问题描述**：重置密码仅更新 `passwordHash`，持有旧 JWT 的攻击者仍可访问 API。
- **修复建议**：在 `User` 表添加 `tokenVersion` 字段，重置密码时自增，JWT callback 中校验。

---

#### [⚪ 建议] `/api/image` 基于路径解析做权限校验

- **所在文件**：`src/app/api/image/route.ts:5-8`
- **风险等级**：⚪ 建议
- **问题描述**：从 R2 key 路径正则提取 userId 做权限比对，依赖路径格式约定，未来格式变更可能引入越权。
- **修复建议**：改为 `entry/{entryId}/images/{idx}` 格式，先查 Entry 确认 owner。

---

### 1.2 API 端点安全

#### [🔴 严重] 多个 API 路由缺少速率限制

- **所在文件**：`src/app/api/entries/route.ts`、`src/app/api/user/config/route.ts`、`src/app/api/user/encryption-password/route.ts`、`src/app/api/user/api-keys/route.ts`、`src/app/api/upload/route.ts`、`src/app/api/image/route.ts`、`src/app/api/stats/route.ts`
- **风险等级**：🔴 严重
- **问题描述**：Entries CRUD、User Config/Settings、API Key 管理、Image/Upload 均无限流，可被 DoS 或暴力枚举。
- **修复建议**：为所有 POST/PUT/DELETE 路由添加 `checkRateLimit`，为 GET 路由添加较宽松的限流。

---

#### [🟠 高危] `verify-email` 接口无速率限制

- **所在文件**：`src/app/api/auth/verify-email/route.ts:4`
- **风险等级**：🟠 高危
- **问题描述**：验证邮件接口无任何限流，可被暴力枚举 Token。
- **修复建议**：添加 IP 级限流 `createLimiter(10, "1 m")`，超过 3 次失败立即作废 Token。

---

#### [🟡 中危] SSE 流式响应无超时与客户端断开清理

- **所在文件**：`src/app/api/ai/generate/route.ts:58-76`、`src/app/api/ai/rewrite/route.ts:51-74`
- **风险等级**：🟡 中危
- **问题描述**：`ReadableStream.start` 中 `for await` 若永久阻塞，流永不关闭。客户端断开时无 `AbortSignal` 传递到上游，Vercel 函数继续消耗资源。
- **修复建议**：传入 `request.signal` 监听客户端断开；设置 120s 全局超时。

---

#### [🟡 中危] 加密迁移中旧明文文件删除失败被静默忽略

- **所在文件**：`src/app/api/diary/migrate-encrypt/route.ts:95-99`
- **风险等级**：🟡 中危
- **问题描述**：迁移成功后删除旧明文文件时 `catch {}` 空块，权限错误等场景下新旧文件并存且无法感知。
- **修复建议**：至少 `console.error` 记录删除失败，或触发告警通知。

---

#### [🟡 中危] 验证邮件发送后旧 Token 未失效

- **所在文件**：`src/lib/auth-service.ts:114-151`
- **风险等级**：🟡 中危
- **问题描述**：`resendVerification` 直接创建新 Token（不删除旧的），同一用户可拥有多个有效 Token。
- **修复建议**：创建新 Token 前执行 `prisma.verificationToken.deleteMany({ where: { userId } })`。

---

### 1.3 加密与密钥管理

#### [🟠 高危] 修改加密密码时覆盖旧 Salt 导致旧日记永久不可读

- **所在文件**：`src/app/api/user/encryption-password/route.ts:56-94`
- **风险等级**：🟠 高危
- **问题描述**：PUT 生成全新 salt，所有旧日记立刻永久无法解密（虽有注释提示但无强制确认流程）。
- **修复建议**：API 层要求旧密码验证；UI 层强制弹窗二次确认；长期提供"一键重新加密"功能。

---

#### [⚪ 建议] `API_KEY_ENCRYPTION_KEY` 无密钥轮换机制

- **所在文件**：`src/lib/crypto.ts:7-13`
- **风险等级**：⚪ 建议
- **问题描述**：AES-256-GCM 密钥固定从 env 读取，不支持轮换。更换密钥则所有已加密 API Key 失效。
- **修复建议**：采用 KEK/DEK 双层密钥模式，DEK 存 DB，KEK 仅用于加密 DEK。

---

### 1.4 文件存储安全

#### [🟡 中危] 用户级文件上传总量无限制

- **所在文件**：`src/app/api/upload/route.ts:12`
- **风险等级**：🟡 中危
- **问题描述**：单文件 10MB 但有总量限制，恶意用户可无限上传耗尽 R2 存储。
- **修复建议**：上传前检查 `User.storageBytes`，超过套餐限制时拒绝。

---

#### [🔵 低危] Presigned URL 有效期 1 小时偏长

- **所在文件**：`src/lib/storage.ts:59`
- **风险等级**：🔵 低危
- **问题描述**：`getPresignedUrl` 固定 3600s，若 URL 泄露窗口期较大。
- **修复建议**：缩短为 300s（5 分钟）。

---

### 1.5 依赖与配置安全

#### [🔴 严重] Next.js 依赖存在 6 个已知安全漏洞

- **所在文件**：`package.json:28` — `"next": "^14.2.0"`
- **风险等级**：🔴 严重
- **问题描述**：`npm audit` 检出 6 个漏洞，含 4 个 high severity（DoS via Server Components、Request Smuggling 等）。
- **修复建议**：升级到 `next@^15.5.15` 或最新 patch 版本。

---

### 1.6 其他安全风险

#### [🔵 低危] Rate Limit 在 Redis 不可用时静默放行

- **所在文件**：`src/lib/rate-limit.ts:42-52`
- **风险等级**：🔵 低危
- **问题描述**：Upstash Redis 故障时 `checkRateLimit` 返回 `success: true`，所有限流失效。
- **修复建议**：改为 fail-closed（Redis 故障时返回 `success: false`）或使用内存后备计数器。

---

## 二、功能完整性审计 (Functional Completeness)

### 2.1 路由与页面完整性

#### [🔴 严重] 全局缺少 `error.tsx` / `loading.tsx` / `not-found.tsx`

- **所在文件**：全局（`src/app/` 下零个错误边界文件）
- **风险等级**：🔴 严重
- **问题描述**：数据库故障、LLM 超时、404 均无降级 UI，直接白屏或抛 stack trace。
- **修复建议**：创建 `src/app/error.tsx`（全局错误边界）、`src/app/not-found.tsx`（404 页），为 `diary/[id]` 和 `timeline` 添加 `loading.tsx`。

---

#### [🟠 高危] `forgot-encryption-password` 页面功能未实现

- **所在文件**：`src/app/forgot-encryption-password/page.tsx:41`
- **风险等级**：🟠 高危
- **问题描述**：代码中有 `TODO: Implement reset flow in a future issue`，页面为空壳。这是零知识架构的关键安全声明部分，缺失会引起合规问题。
- **修复建议**：至少展示明确信息"加密日记加密密码丢失后永久不可恢复"，后期实现完整重置流程。

---

#### [🟡 中危] `Tone` 类型与 Zod Schema 不一致

- **所在文件**：`src/types/index.ts:1` vs `src/lib/validations.ts:25`
- **风险等级**：🟡 中危
- **问题描述**：TS 类型 `Tone = "warm" | "genki" | "minimal" | "literary"`，但 `VALID_TONES = ["warm"]`。`generateDiary` 已实现 4 种风格但 API 校验只允许 warm。
- **修复建议**：`VALID_TONES` 补全为全部 4 种风格。

---

#### [🟡 中危] `ai/rewrite` 硬编码使用 `WARM_SYSTEM_PROMPT`

- **所在文件**：`src/app/api/ai/rewrite/route.ts:40`
- **风险等级**：🟡 中危
- **问题描述**：重写接口无视用户 tone 设置，始终用温暖风格。
- **修复建议**：从请求体或用户 DB 记录中读取 tone 并选择对应 system prompt。

---

#### [🟡 中危] 统计数据对加密日记失真

- **所在文件**：`src/lib/stats.ts:103`
- **风险等级**：🟡 中危
- **问题描述**：加密日记的 `wordCount = 0`（由 `saveDiary` 写入），导致总字数统计不含加密条目数据。
- **修复建议**：加密时由客户端计算字数并传入 API，或统计时标注"不含加密日记"。

---

#### [🔵 低危] `Subscription` 模型与 `User` 表重复字段

- **所在文件**：`prisma/schema.prisma:11-41`、`prisma/schema.prisma:108-120`
- **风险等级**：🔵 低危
- **问题描述**：`User` 表和 `Subscription` 模型有重复字段且无 FK 关系，未来付费上线时易数据不一致。
- **修复建议**：选择一套方案并统一。

---

### 2.2 UI/UX 完整性

#### [🟡 中危] 全部 32 个文件都是 Client Component

- **所在文件**：所有 `"use client"` 文件
- **风险等级**：🟡 中危
- **问题描述**：未使用 SSR/SSG，所有页面客户端渲染。登录/注册等纯表单页适合 Server Component + Server Actions。
- **修复建议**：将登录/注册/验证等页面重构为 RSC。

---

## 三、冗余代码与质量审计 (Code Quality & Dead Code)

### 3.1 死代码

#### [🟡 中危] 6+ 个类型定义从未被引用

- **所在文件**：`src/types/index.ts`
- **风险等级**：🟡 中危
- **问题描述**：`ApiResponse<T>`、`LocalApiKeyStore`、`AIGenerateRequest`、`AIGenerateResponse`、`DiaryEntry`、`UserConfig` 均无任何引用。`MediaFile` 中的 `width`/`height`/`thumbnail` 从未赋值。
- **修复建议**：删除未使用的类型定义以降低维护成本。

---

#### [🟡 中危] `src/lib/api-helpers.ts` 为纯冗余文件

- **所在文件**：`src/lib/api-helpers.ts`
- **风险等级**：🟡 中危
- **问题描述**：仅 7 行，`getUser` 直接调 `getSessionUserId`，`jsonOk`/`jsonError` 纯 re-export。无意义的间接层。
- **修复建议**：删除此文件，所有引用直接导入 `auth-helpers.ts`。

---

#### [🔵 低危] ESLint 未配置

- **所在文件**：——（无 ESLint 配置）
- **风险等级**：🔵 低危
- **问题描述**：`next lint` 执行时引导交互式配置，说明 ESLint 从未初始化。
- **修复建议**：`npx next lint` 选择 Strict (recommended)，修复所有问题。

---

### 3.2 重复代码

#### [⚪ 建议] 19 个 API Route 存在重复的校验模板代码

- **所在文件**：所有 `route.ts`
- **风险等级**：⚪ 建议
- **问题描述**：每个 POST/PUT 都重复 `try { json() } catch { return jsonError }` + `safeParse` 模式。
- **修复建议**：抽象为 `validateBody<T>(req, schema)` 通用工具函数。

---

### 3.3 TypeScript 类型质量

#### [⚪ 建议] `noUncheckedIndexedAccess` 未启用

- **所在文件**：`tsconfig.json`
- **风险等级**：⚪ 建议
- **问题描述**：`strict: true` 但此选项未启用，存在 `entries[0]`、`entries[entries.length-1]` 等不安全索引。
- **修复建议**：启用 `"noUncheckedIndexedAccess": true` 并修复错误。

---

#### [⚪ 建议] 多处使用 `!` 非空断言和 `as` 类型断言

- **所在文件**：`storage.ts:14-21`（4 处 `!`）、`auth.ts:67`（`as string`）
- **风险等级**：⚪ 建议
- **问题描述**：环境变量使用 `!` 跳过 null 检查，TS 编译器无法保护。
- **修复建议**：添加 `getEnv(key)` 运行时校验函数替换非空断言。

---

### 3.4 性能反模式

#### [🟡 中危] `AppShell` 每次路由变化都请求 `/api/auth/session`

- **所在文件**：`src/components/AppShell.tsx:25-35`
- **风险等级**：🟡 中危
- **问题描述**：`useEffect` 依赖 `pathname`，每次路由切换都发起 fetch。`SessionProvider` 已持有 session。
- **修复建议**：仅首次挂载时 fetch；需要刷新时使用 `useSession().update()`。

---

#### [🔵 低危] `useStreamGenerate` options 对象导致 effect 不稳定

- **所在文件**：`src/hooks/useStreamGenerate.ts:23-26`
- **风险等级**：🔵 低危
- **问题描述**：父组件每次 render 创建新 options 对象时，`useCallback` 依赖数组变化导致重创建。
- **修复建议**：父组件使用 `useMemo` 稳定 options 引用。

---

### 3.5 代码风格

#### [⚪ 建议] `diary.ts:44-51` 嵌套三元可读性差

- **所在文件**：`src/lib/diary.ts:44-51`
- **风险等级**：⚪ 建议
- **问题描述**：6 行嵌套三元选择 tone → systemPrompt，违反可读性标准。
- **修复建议**：改用 `Record<Tone, string>` 映射表。

---

### 3.6 错误处理完整性

#### [🟡 中危] `saveDiary` 加密条目预览/字数返回不一致

- **所在文件**：`src/lib/diary.ts:73-80`、`src/lib/diary.ts:169-196`
- **风险等级**：🟡 中危
- **问题描述**：加密条目 `preview = null`，但 `getEntry` 返回时转为 `""`。类型不一致导致前端判断逻辑混淆。
- **修复建议**：`DiarySummary.preview` 改为 `string | null`，加密时返回 null。

---

#### [🔵 低危] Prisma 错误未转换

- **所在文件**：多个 API 路由和 Service
- **风险等级**：🔵 低危
- **问题描述**：唯一约束冲突（`P2002`）、外键失败等 Prisma 错误直接抛为 500。
- **修复建议**：添加 Prisma 错误处理 wrapper，将已知错误码转为友好 HTTP 状态码和消息。

---

### 3.7 测试覆盖

#### [🔴 严重] 零个测试文件

- **所在文件**：全局
- **风险等级**：🔴 严重
- **问题描述**：关键路径（加密、认证、日记 CRUD、API Key 管理）无任何单元/集成测试。
- **修复建议**：引入 Vitest，优先覆盖 `crypto.ts`、`auth-service.ts`、`diary.ts`。

---

### 3.8 配置文件审计

#### [⚪ 建议] `tsconfig.json` 缺少关键严格选项

- **所在文件**：`tsconfig.json`
- **风险等级**：⚪ 建议
- **问题描述**：`strict: true` 已启用，但 `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` 未开启。
- **修复建议**：逐项启用并修复类型错误。

---

## 四、问题统计汇总

### 按严重等级

| 等级 | 数量 | 占比 |
|------|------|------|
| 🔴 严重 | 7 | 14% |
| 🟠 高危 | 7 | 14% |
| 🟡 中危 | 16 | 32% |
| 🔵 低危 | 8 | 16% |
| ⚪ 建议 | 12 | 24% |
| **合计** | **50** | 100% |

### 按模块

| 模块 | 严重 | 高危 | 中危 | 低危 | 建议 | 小计 |
|------|------|------|------|------|------|------|
| 认证与授权 | 2 | 2 | 2 | 1 | 1 | 8 |
| API 端点 | 2 | 1 | 3 | 0 | 1 | 7 |
| 加密与密钥 | 0 | 1 | 0 | 0 | 1 | 2 |
| 文件存储 | 0 | 0 | 1 | 1 | 0 | 2 |
| 依赖与配置 | 1 | 0 | 0 | 0 | 2 | 3 |
| 其他安全 | 0 | 0 | 0 | 1 | 2 | 3 |
| 路由与页面 | 1 | 1 | 2 | 0 | 1 | 5 |
| 数据流 | 0 | 0 | 3 | 1 | 0 | 4 |
| 死代码 | 0 | 0 | 2 | 1 | 0 | 3 |
| 类型质量 | 0 | 0 | 0 | 0 | 2 | 2 |
| 性能 | 0 | 0 | 1 | 1 | 0 | 2 |
| 风格规范 | 0 | 0 | 0 | 0 | 1 | 1 |
| 错误处理 | 0 | 0 | 1 | 1 | 0 | 2 |
| 测试 | 1 | 0 | 0 | 0 | 0 | 1 |
| 配置文件 | 0 | 0 | 0 | 0 | 1 | 1 |
| UI/UX | 0 | 0 | 1 | 0 | 0 | 1 |
| 架构设计 | 0 | 0 | 0 | 1 | 1 | 2 |

---

## 五、优先级修复路径

```
P0 (1-3 天)          P1 (1 周)              P2 (2 周)               P3 (持续)
─────              ─────                 ─────                  ─────
Next.js 升级       API 限流全覆盖        加密密码变更处理          ESLint 配置
error/loading/404  添加 CSP Header       forgot-encryption 实现   启用严格 TS 选项
关键路径测试       Magic Bytes 校验      账号级锁定                RSC 重构
AUTH_SECRET 校验   Tone Schema 修复      AppShell fetch 优化       Prisma 错误中间件
                   AI rewrite tone 修复  死代码清理                Subscription 整理
                   SSE 超时/断开处理     重复代码重构
                   verify-email 加限流   旧 Token 清理
                   presigned URL 缩短
```


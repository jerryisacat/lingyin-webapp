## 2026-05-23 — 功能: 退出登录功能 (#90)

### 新增
- `src/app/settings/page.tsx`: 页面底部新增「退出登录」危险按钮区域，红色卡片样式，点击调用 `signOut({ callbackUrl: "/" })` 跳回 Landing Page
- `src/components/MobileTabBar.tsx`: 长按「设置」Tab（800ms）弹出退出登录确认浮层（桌面端 mouse 事件同样支持），含「取消」和「确认退出」两个按钮

### 依赖
- 导航栏退出登录已在 #39 中通过 `Header.tsx` 实现（桌面端+移动端均含登出按钮）

## 2026-05-23 — 功能: Landing Page 内容重构 + 导航栏升级 (#39)

### 修改
- `config/navigation.json`: "铃英日记" → "玲音日记", "登陆" → "登录"
- `src/app/page.tsx`: Hero 区加入开源标识、Vibe Coding、DeepSeek 和 GitHub 链接; 新增四个用例场景区块; FEATURES 文案修正（隐私优先强调 AES-256-GCM, 照片入文删除"每一篇都有配图"）; Features/Steps 标题和副文本更新; 已登录仪表盘 "铃英" → "玲音"
- `src/app/settings/page.tsx`: "铃英日记" → "玲音日记"
- `src/components/Header.tsx`: 全新玻璃态悬浮导航栏（sticky top-4, backdrop-blur-md, 圆角卡片, 渐变品牌徽章）; 移动端折叠菜单; 基于 useSession 的导航项过滤; 禁用项处理
- `src/components/AppShell.tsx`: NavBar → Header 替换
- `src/app/globals.css`: 新增 use-case-card / use-case-title / use-case-desc 样式

### 设计决策
- 导航栏从扁平顶部栏升级为 sticky 毛玻璃圆角卡片式（参考 public/demo.html）
- "社交网络" 导航项设为 disabled 隐藏，等待后续功能
- Header 使用 useMemo 优化导航链接计算

## 2026-05-23 — 功能: 首页数据统计仪表盘 (#18)

### 新增
- `src/lib/stats.ts`: `getStats()` 聚合函数 — 单次 `findMany` + JS 侧计算总字数/写作天数/连续天数/月度趋势/标签频率
- `src/app/api/stats/route.ts`: `GET /api/stats` 端点（session 保护）
- `src/components/StatsCard.tsx`: 统计卡片组件（icon + 标签 + 大数字）
- `src/components/DashboardStats.tsx`: "use client" 客户端组件 — loading shimmer / error 重试 / empty 空状态 / 数据展示四态
- `src/types/index.ts`: 新增 `StatsData` / `MonthlyData` / `TagCount` 类型

### 修改
- `src/app/page.tsx`: 登录后仪表盘插入 `<DashboardStats />`（位于快捷操作和小贴士之间），含 4 卡指标网格、Tailwind 柱状月度趋势、标签云

### 设计决策
- 不做独立 `/stats` 页面 — 统计模块嵌入首页已登录仪表盘，无导航入口变更
- 不安装 charting 库 — 月度趋势用纯 Tailwind div 柱状图
- Streak 算法: 日期倒排 → 从今天/昨天倒推连续天数

## 2026-05-23 — 修复: 速率限制 Redis 不可用时导致所有受保护端点返回 500

### 根因
Upstash Redis 环境变量 (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) 未在 Vercel 配置，`checkRateLimit()` 在 production 环境抛出异常而非优雅降级，导致登录/注册/忘记密码等端点全部 500。

### 修复
- `src/lib/rate-limit.ts`: `checkRateLimit()` 在 Redis 不可用时静默跳过速率限制（fail-open），所有环境行为统一
- `src/lib/rate-limit.ts`: `Redis.fromEnv()` → 显式 `new Redis({url, token})`，明确依赖 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `.env` / `.env.example`: 更新注释，说明通过 Vercel Integrations → Upstash for Redis 配置

### 数据库连接验证
- Prisma datasource 使用 `POSTGRES_PRISMA_URL` + `POSTGRES_URL_NON_POOLING`（Vercel Supabase 集成自动注入），健康检查 `/api/health` 确认连接正常
- `DATABASE_URL` 保留在 Vercel 环境变量中作为回退（与 `POSTGRES_PRISMA_URL` 值一致）

## 2026-05-23 — 安全: 密码最小长度从 8 提升至 12 (#74)

### 变更
- `src/lib/auth-service.ts`: `registerUser()` 和 `resetPassword()` 密码最小长度 `8 → 12`，错误提示同步更新
- `src/app/register/page.tsx`: `minLength` 和 placeholder 文本 `8 → 12`
- `src/app/reset-password/page.tsx`: `minLength` 和 placeholder 文本 `8 → 12`

## 2026-05-23 — 日历视图: Timeline 增加日历浏览模式 (#2)

### 新增
- `src/components/CalendarView.tsx`: 月历组件，渲染 7×6 网格，标注有日记的日期（sakura 圆点），支持骨架屏加载态和空月提示
- `src/types/index.ts`: 新增 `CalendarEntry` 类型（`{ id, date }`）
- `src/lib/diary.ts`: 新增 `getCalendarEntries()` 函数，按月查询日记（仅返回 id+date，不读 R2）

### 变更
- `src/app/api/entries/route.ts`: `GET` 增加 `?view=calendar&year=&month=` 查询模式，跳过游标分页，不触发 R2 读取
- `src/app/timeline/page.tsx`: 增加列表/日历视图切换按钮（Lucide List/CalendarDays 图标），日历模式下月切换和日期点击跳转

## 2026-05-23 — 速率限制: 全量 API 端点添加速率限制

**触发原因**: 修复审计发现 #60 — 所有 API 路由无速率限制（P0 安全漏洞）。

### 新增
- `src/lib/rate-limit.ts`: 基于 @upstash/ratelimit + @upstash/redis 的集中速率限制模块，支持 IP 和 userId 标识
- 依赖: @upstash/ratelimit, @upstash/redis

### 速率限制规则
| 端点 | 窗口 | 最大请求 | 标识 |
|------|------|---------|------|
| POST /api/auth/register | 15 分钟 | 3 | IP |
| POST /api/auth/forgot-password | 5 分钟 | 2 | IP |
| POST /api/auth/resend-verification | 5 分钟 | 2 | IP |
| POST /api/auth/reset-password | 15 分钟 | 5 | IP |
| POST /api/auth/[...nextauth] (登录) | 1 分钟 | 5 | IP |
| POST /api/ai/generate | 1 分钟 | 5 | userId |
| POST /api/ai/rewrite | 1 分钟 | 5 | userId |
| POST /api/ai/test | 1 分钟 | 3 | userId |

### 变更
- `.env.example`: 添加 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 环境变量
- `src/lib/auth.ts`: Credentials provider authorize 回调添加登录速率限制，新增 RateLimitError 类
- `src/app/api/auth/register/route.ts`: 添加注册速率限制 (#60)
- `src/app/api/auth/forgot-password/route.ts`: 添加密码重置邮件速率限制 (#60)
- `src/app/api/auth/resend-verification/route.ts`: 添加验证邮件重发速率限制 (#60)
- `src/app/api/auth/reset-password/route.ts`: 添加密码重置速率限制 (#60)
- `src/app/api/ai/generate/route.ts`: 添加 AI 生成速率限制 (#60)
- `src/app/api/ai/rewrite/route.ts`: 添加 AI 改写速率限制 (#60)
- `src/app/api/ai/test/route.ts`: 添加 AI 测试速率限制 (#60)

## 2026-05-23 — 安全加固: 修复代码审计发现的 High/Medium 漏洞

**触发原因**: 全量代码安全审计（排除数据库层）发现 5 High + 10 Medium + 8 Low + 6 Info 问题。

### 修复 (本次)
- `next.config.mjs`: 添加安全响应头 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin` (#64)
- `src/app/api/ai/generate/route.ts`: SSE 错误消息通用化，避免原始错误信息泄露至客户端 (#63)
- `src/app/api/ai/rewrite/route.ts`: 同上 (#63)
- `src/app/api/ai/test/route.ts`: 移除 OpenRouter preflight 网络连通性检查，简化错误处理 (#62)
- 创建 29 个审计发现 Issue (#59-#87)

## 2026-05-22 — 商业化定价模型重构：Token 预算 + 存储配额

**触发原因**: 弃用旧版「每日限额 + 功能门控」定价模式，改为 Token 预算 + 存储配额制。

### 变更
- `config/billing-pricing.json`: 新建定价配置，包含模型价格、套餐定义、加购包
- `docs/07-商业化方案.md`: 全部重写定价章节 - Token 预算制、无日限额、百分比显示、高级模型倍率、加购包
- `docs/04-Phase2到4路线图.md`: 更新 Phase 3 定价策略、成本估算、商业逻辑
- `issues/10`: 更新订阅支付 Issue - Token + 存储配额模式
- `issues/11`: 重写免费用户额度控制 Issue - 取消日限额，改为 Token 预算 + 百分比显示 + 加购
- `issues/12`: 更新统一 API Key Issue - 增加 `config/billing-pricing.json` 定价引用
- `issues/13`: 更新后台管理面板 Issue - 增加 Token 消耗统计
- `issues/14`: 更新数据导出 Issue（无实质变动）
- `issues/15`: 更新存量用户迁移 Issue - 更新定价引用

## 2026-05-22 — 切换默认模型为 DeepSeek V4 Flash + Qwen3.6+ 视觉

**触发原因**: OpenRouter 默认模型从 `openai/gpt-4o-mini` 切换为更高性价比的 DeepSeek 系列。

### 修改
- `src/lib/ai/client.ts`: `defaultModel` 改为 `deepseek/deepseek-v4-flash`，`defaultVisionModel` 改为 `qwen/qwen3.6-plus`

## 2026-05-22 — 排查修复: OpenRouter API 连接错误（根因：X-Title 非 ASCII 字符）

**根因**: `X-Title: 玲音日记` 包含中文字符，Node.js `fetch`（undici）在 Vercel 运行时拒绝非 ASCII HTTP 头值，导致 `APIConnectionError`。preflight GET 可通过因为未设置该头。curl 也不过是因为 curl 不校验头值合法性。

### 修改
- `src/lib/ai/client.ts`: `X-Title` 改为 ASCII-safe 值 `"LingYin Diary"`
- `src/app/api/ai/test/route.ts`: 
  - 新增 `logConnectionError()` 诊断函数，捕获 `APIConnectionError` 的底层 `cause`（可精确定位非 ASCII 头值等错误）
  - 新增 preflight 网络连通性检查（GET `https://openrouter.ai/api/v1/models`，10 秒超时），区分「网络不可达」与「API Key 无效」
  - 返回数据新增 `detail` 字段，根据错误类型给出可操作的诊断建议
  - 正确识别 `OpenAI.AuthenticationError` 和 `OpenAI.RateLimitError`
- `src/app/settings/page.tsx`: 新增 `testDetail` 状态，测试失败时在 UI 展示详细诊断文本
- `src/lib/ai/client.ts`: `HTTP-Referer` 环境变量兼容 `NEXT_PUBLIC_APP_URL` 和 `NEXT_PUBLIC_SITE_URL` 两个变体

## 2026-05-22 — Issue #28: Landing Page 设计优化

**触发原因**: Landing Page v1 设计感不足，缺少日记产品的温暖氛围、动态元素和视觉层次。

### 修改
- `src/app/page.tsx`: Landing Page 完整重写（已登录仪表盘视图不变）
  - **Hero**: 18 个 GPU 加速 CSS 樱花飘落粒子 + 4 层 sakura 渐变光斑背景 + 渐变色副标题（"记下此时此刻，温暖治愈的 AI 日记伴侣"）+ 双 CTA 分离（「开启书写之旅」→ `/login`，「了解更多」→ `scrollIntoView('#features')` 平滑滚动）+ 向下探索箭头指示
  - **Features**: 4 张卡片新增 hover 上浮 (`-translate-y-1`) + 左侧 sakura accent bar（`::before` 伪元素 `scaleY` 展开动画）+ 图标容器 `group-hover:scale-110`
  - **How It Works**: 文案更新为 spec 版（日常倾诉→温暖润色→珍藏回味）+ 桌面端 SVG 贝塞尔虚线连接（含 `dash-move` 流动动画）+ 移动端竖线连接 + 序号 sakura 徽章 + 卡片 hover 上浮
  - **CTA**: 渐变背景 `from-sakura/5 to-sakura/10` + 中心光斑 + 按钮 hover 上浮动效
- `src/app/globals.css`: 新增 `scroll-behavior: smooth`（html）+ 樱花飘落 `@keyframes sakura-fall` + `.feature-card` 左侧 accent bar 动画 + `.step-connector` SVG 虚线流动动画 + `prefers-reduced-motion: reduce` 全面降级
- `src/components/SakuraParticles.tsx`: 新建客户端组件 — 18 个花瓣粒子，`useEffect` 动态生成，`will-change: transform; translate3d(0,0,0)` 强制 GPU 加速，`prefers-reduced-motion` 下自动跳过

### 设计决策
- **纯 CSS 动画优先**: 所有动效使用 CSS keyframes + Tailwind utility，零第三方动画库依赖
- **GPU 加速**: 樱花粒子使用 `translate3d` + `will-change: transform`，避免主线程重绘
- **A11y 降级**: `prefers-reduced-motion: reduce` 下隐藏飘落粒子、禁用连线流动动画
- **平滑滚动**: `html` 元素 `scroll-behavior: smooth`，无需 JS `scrollIntoView`

## 2026-05-22 — Issue #30: 全站 UI/UX 设计升级（Epic 需求规约完善与 Demo 编写）

**触发原因**: 全站 UI/UX 升级的 Epic #30 需求需要进一步精细化与技术规范确立，确保在不破坏现有 PWA 功能、性能与 Next.js SSR 机制的前提下提供温暖柔和的视觉、无闪烁的深色模式与极致的微交互体验。

### 新建文档
- `docs/issue-30-spec.md` — 建立《全站 UI/UX 设计升级（Epic #30）精细化技术需求规约》，涵盖双主题 CSS 变量（Tokens）设计、Landing Page 微动画与 SVG 连线、Next.js 暗色闪烁（FOUC）解决方案、毛玻璃导航与 iOS 底部安全区、沉浸式编辑器与 AI 呼吸状态光晕、详情页 Shimmer 骨架屏、自研弹簧 Toast 及 PWA 物理手势，并输出 6 大子任务开发清单及验收 DoD。
- `public/demo.html` — 编写轻量、全交互的 UI/UX 高保真视觉特效 Demo（包含 GPU 加速樱花雪花背景、一键暗色模式抗闪转换、流式打字机动画配合卡片呼吸光晕、带有物理弹性的 Toast 与 PWA Tabbar 滑动反馈、图片手势 Lightbox 及拟真骨架屏切换），支持开箱即用。

## 2026-05-22 — Issue #33: API 密钥仅支持 OpenRouter

**触发原因**: Phase 1 简化 Provider 管理，OpenRouter 作为统一网关一个 Key 可访问数百种模型，其他 Provider 留待后续 Phase。

### 修改
- `src/types/index.ts`: `ApiProvider` 改为 `"openrouter"`（union type，易于扩展）
- `src/lib/ai/client.ts`: 重构为可扩展的 `ProviderConfig` 结构 — 单点配置 `baseURL` / `defaultModel` / `defaultVisionModel` / `defaultHeaders`，新增 Provider 只需在 `PROVIDER_CONFIGS` 加一条记录；导出 `createOpenAIClient` 和 `PROVIDER_CONFIGS` 供 test route 复用
- `src/app/api/user/api-keys/route.ts`: `VALID_PROVIDERS` 改为 `["openrouter"]`
- `src/app/api/ai/generate/route.ts`: 默认 provider 改为 `"openrouter"`
- `src/app/api/ai/rewrite/route.ts`: 默认 provider 改为 `"openrouter"`
- `src/app/api/ai/test/route.ts`: 移除 fetch 直连，改用共享的 `createOpenAIClient` + `PROVIDER_CONFIGS`
- `src/app/settings/page.tsx`: Provider 列表改为仅 OpenRouter，placeholder 更新为 `sk-or-v1-...`
- `src/app/diary/page.tsx`: `PROVIDER_ORDER` 改为 `["openrouter"]`
- `AGENTS.md`: 更新 LLM providers 为 OpenRouter

### 设计决策
- **Extensible Provider Config**: 新增 Provider 仅需在 `PROVIDER_CONFIGS` 加一条 + 更新 `ApiProvider` union type，无需改动 `generateStream` / `describeImage` 等函数签名
- **Test route 复用 client**: 测试连接直接用 `createOpenAIClient`，与生成流程一致，避免配置不一致
- **OpenRouter Headers**: `HTTP-Referer` + `X-Title` 通过 `defaultHeaders` 统一注入

## 2026-05-22 — Issue #23: R2 用户文件隐私审查与修复

**触发原因**: 图片和 Markdown 文件通过 R2 公开 URL 可被未授权访问，存在隐私泄露风险。

### 修改
- `src/lib/storage.ts`: 移除 `getImageUrl()` 死代码；移除 `getPresignedUrl()` 中的 `R2_PUBLIC_URL` 回退（始终使用真实预签名 URL）；新增 `deleteDirectory()` 批量删除目录
- `src/app/api/image/route.ts`: 添加 Auth.js session 鉴权 + 路径 owner 验证（userId 不匹配返回 404）
- `src/lib/diary.ts`: `deleteDiary()` 增加关联 assets 清理（`ListObjectsV2Command` + `DeleteObjectsCommand`）
- `src/sw.ts`: `/api/image.*` 缓存策略从 `CacheFirst` 改为 `NetworkOnly`（预签名 URL 时效性）
- `next.config.mjs`: 移除 `lingyin-r2.jerryiscat.one` 远程图片域名

### 安全改进
- `/api/image` 未登录访问 → 401
- 用户 A 无法访问用户 B 的图片（路径 userId 不匹配 → 404，不区分不存在与无权限）
- R2 Bucket 关闭 Public Access 后所有文件仅通过预签名 URL 访问
- 删除日记时同步清理关联图片，避免孤儿文件

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

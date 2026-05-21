# Changelog

---

## 2026-05-21 (Stage 7 — Timeline + Diary Detail)

### Stage 7: Timeline 时间线浏览 + Diary 日记详情页
- **内容**：实现时间线浏览（按月分组、cursor 分页加载更多）+ 单篇日记详情页（Markdown 渲染、删除确认弹窗）。
- **因果链**：Stage 6 (Diary Editor) 完成后 → 按 AGENTS.md Stage 7 清单实施。决策：按月分组（month headers）、确认弹窗删除（非滑动删除）、详情页路由使用 `/diary/[id]`（更简单，无需新 API）。
- **新建文件**：
  - `src/app/timeline/page.tsx` — 时间线页面（"use client"）。调用 `GET /api/entries` 获取日记列表，cursor 分页加载更多，传入 TimelineList 渲染。含加载态、错误态、空状态（"还没有日记哦～🌸"）。
  - `src/components/TimelineList.tsx` — 时间线列表组件。按年月分组（`groupByMonth`），渲染月标题 + DiaryCard 列表。含加载骨架屏、空状态、加载更多按钮、"已经到底啦"提示。月标题 sticky 吸顶。
  - `src/components/DiaryCard.tsx` — 日记卡片组件。显示日期方块（大号日期 + 星期）、标题（从 preview 首行提取）、预览文本（line-clamp 3 行）、字数、图片标记（📷 Icon）、标签列表。sakura 粉色圆角边框，hover 高亮。点击跳转 `/diary/[id]`。
  - `src/app/diary/[id]/page.tsx` — 日记详情页（"use client"）。调用 `GET /api/entries/[id]` 获取完整 Markdown（含 R2 读取）。页面显示：返回按钮、删除按钮、日期行、元数据栏（字数/图片/标签）、MarkdownViewer 渲染正文、创建时间。删除按钮 → 确认弹窗 → 调用 `DELETE /api/entries/[id]` → 跳转 `/timeline`。
  - `src/components/MarkdownViewer.tsx` — 可复用 Markdown 渲染器。使用 `react-markdown` + `remark-gfm`（GFM 表格/任务列表）。自定义组件渲染：next/image（支持 R2 remotePatterns）、代码块 / 行内代码（sakura 主题）、引用块（sakura 左边框）、表格等。移动端自适应。
- **修改文件**：
  - `src/components/DiaryEditor.tsx` — 保存后跳转 URL 从 `/diary/${entry.date}` 改为 `/diary/${entry.id}`（因为详情页使用 `/diary/[id]` 路由）。
  - `package.json` — 新增依赖 `remark-gfm`（GFM 扩展支持）。
- **技术细节**：
  - 时间线分组使用 `groupByMonth` 按 `YYYY-MM` 聚合，按月降序排列
  - 卡片预览直接使用 DB 中的 `Entry.preview`（前 200 字符，无 Markdown 语法），无需 R2 调用
  - 详情页通过 `fetch(/api/entries/[id])` 获取完整 Markdown 内容（服务端从 R2 读取）
  - MarkdownViewer 图片使用 `next/image` 组件，`remotePatterns` 已配置 R2 公共 URL（`pub-*.r2.dev`）
  - 删除确认使用 modal 弹窗，backdrop 点击可取消；删除中显示 loading，防止重复操作
  - 详情页错误状态：404 "日记不存在" / 网络错误 "加载失败"，含返回时间线按钮
  - 时间线首次加载、加载更多均独立 loading 状态，避免闪烁
- **决策记录**：
  - 时间线分组：按月分组 + 月标题（选中方案 A — 结构清晰，便于浏览）
  - 删除确认：确认弹窗（选中方案 A — 更安全，适合 MVP）
  - 详情页路由：`/diary/[id]`（非 `/diary/[date]`）— 复用现有 `GET /api/entries/[id]`，无需新建 date→id 解析 API
- **验证**：`npx tsc --noEmit` 零错误

---

## 2026-05-21 (Stage 6 — Diary Editor)

### Stage 6: Diary Editor 核心功能
- **内容**：实现完整日记写作流程——输入 → AI 流式生成（打字机动画）→ Markdown 编辑（预览切换）→ 保存。含图片上传（9 宫格）、SSE 流式 Hook、错误处理。
- **因果链**：Stage 5 (App Shell + Settings) 完成后 → 按 AGENTS.md Stage 6 清单实施。用户选择 (A) 单栏 textarea + 预览切换（移动端友好）、(A) 保存后跳转日记详情页。
- **新建文件**：
  - `src/hooks/useStreamGenerate.ts` — SSE 流式生成 Hook。封装 fetch + ReadableStream 读取，支持 AbortController 停止，累积 tokens 返回 `{ text, isStreaming, error, generate, stop, reset }`
  - `src/components/TypewriterText.tsx` — 打字机动画组件。使用 `requestAnimationFrame` 逐字渲染，流式中显示闪烁光标
  - `src/components/PhotoUploader.tsx` — 图片上传 9 宫格组件。拖拽排序、即时上传（调用 `/api/upload`）、进度条、错误重试、类型/大小校验 (JPG/PNG/WebP, <10MB)
  - `src/components/DiaryEditor.tsx` — 主编辑器组件。3 状态机：`input` (文字输入 + 图片上传 + 生成按钮) → `generating` (TypewriterText + 停止按钮) → `editing` (textarea 编辑 + 预览切换 + 保存/重新生成)。保存调用 `POST /api/entries`，成功后跳转 `/diary/{date}`
  - `src/app/diary/page.tsx` — 日记页面。检查 `useLocalApiKey` 配置，未配置跳转 `/settings`，已配置渲染 DiaryEditor
- **技术细节**：
  - `useStreamGenerate` 通过 `X-API-Key` header 传递用户密钥，body 含 `provider` 从前端 localStorage 读取
  - SSE 解析按行处理，支持 `data: [DONE]` 结束标记和 `data: {"error":"..."}` 错误传递
  - Typewriter 使用动态 chunk size（剩余字符/10）保证大文本流畅渲染
  - PhotoUploader 文件选择后立即上传（带进度条），上传完成才加入 images 列表
  - 生成失败显示错误状态 + 重试/修改输入按钮
  - Editor 状态切换通过 `useEffect` 监听 streaming 完成状态，避免 render 中副作用
- **决策记录**：
  - 编辑器布局：单栏 textarea + 预览切换（选中方案 A，移动端优先）
  - 保存 UX：保存后跳转 `/diary/{date}`（选中方案 A），即使 Stage 7 详情页尚未构建，此 URL 已预留
- **验证**：`npx tsc --noEmit` 零错误

---

## 2026-05-20 (Stage 3+4)

### Stage 4 Bugfixes (代码审计修复)
- **修复 1** `PUT /api/entries/[id]` 忽略 URL id 参数 — 改为先用 `params.id` + `getEntry()` 查原条目（含所有权校验），再用原条目的 date 调用 `saveDiary()`，body 不再接受 date 字段
- **修复 2** `POST /api/upload` `image/jpeg` 扩展名映射错误 — MIME type → 扩展名改用显式映射表 `{ "image/jpeg": "jpg", ... }`，`ALLOWED_TYPES` 直接从映射表 keys 派生
- **因果链**：Stage 4 代码审计发现 2 个 critical bug → 按建议修复
- **受影响文件**：`src/app/api/entries/[id]/route.ts`、`src/app/api/upload/route.ts`

### Stage 4: API Routes 完成
- **内容**：实现全部 6 个 API Route Handler，覆盖日记 CRUD、AI 生成/重写、图片上传、用户配置
- **因果链**：Stage 3 (Backend Services) 完成后 → 按 AGENTS.md Stage 4 清单逐项实施
- **新建文件**：
  - `src/lib/api-helpers.ts` — 共享工具：`getUser()` (从 Supabase session 获取当前用户)、`jsonOk()` / `jsonError()` (统一 ApiResponse 格式)
  - `src/app/api/ai/generate/route.ts` — `POST` SSE 流式日记生成。验证 Session + API Key → 调用 `generateDiary()` → ReadableStream 输出 SSE (`text/event-stream`)
  - `src/app/api/ai/rewrite/route.ts` — `POST` 润色/重写日记。接收 `content` + `instruction` → 调用 `generateStream()` 流式返回润色结果
  - `src/app/api/entries/route.ts` — `GET` cursor 分页列表（`getEntries()`）+ `POST` 保存日记（`saveDiary()` upsert）
  - `src/app/api/entries/[id]/route.ts` — `GET` 单篇（含 R2 markdown 读取）+ `PUT` 更新 + `DELETE` 删除（R2 + DB 双删）
  - `src/app/api/upload/route.ts` — `POST` multipart/form-data 图片上传。校验类型 (JPG/PNG/WebP) + 大小 (<10MB) → R2 上传 → 返回 MediaFile
  - `src/app/api/user/config/route.ts` — `GET` 读取 User.tone 偏好 + `PUT` 更新 tone。API Key 绝不落库
- **技术细节**：
  - 所有 AI 路由接受 `provider` 参数（openai/deepseek/gemini），前端从 localStorage 读取后传入
  - SSE 流格式：`data: {"content":"..."}\n\n` ... `data: [DONE]\n\n`，错误用 `data: {"error":"..."}\n\n`
  - 分页使用 cursor-based（基于 Entry.id），返回 `{ entries, nextCursor }`
  - 上传生成文件名 `IMG_{timestamp}_{random}.{ext}` 避免冲突
  - API Key 通过 `X-API-Key` header 传入，server 不记录日志
- **验证**：`npx tsc --noEmit` 零错误

### Stage 3: Backend Services 完成
- **内容**：实现全部 lib/ 服务层 — R2 文件存储、LLM 客户端（流式 + 视觉）、API Key 守卫、日记编排引擎
- **因果链**：Stage 2 (Auth) 完成后 → 按 AGENTS.md Stage 3 清单逐项实施
- **新建文件**：
  - `src/lib/ai/prompts.ts` — `warm` 语气 system prompt + `buildDiaryPrompt()` 构建 user prompt + `VISION_PROMPT` 视觉分析 prompt
  - `src/lib/ai/client.ts` — OpenAI SDK 封装，支持 3 个 provider (OpenAI/DeepSeek/Gemini)，`generateStream()` 流式生成 + `describeImage()`/`describeImages()` 多模态视觉分析
  - `src/lib/storage.ts` — CloudFlare R2 S3 API (`@aws-sdk/client-s3`)，`saveMarkdown()` / `readMarkdown()` / `uploadImage()` / `deleteEntry()` / `deleteImage()` + 路径生成工具
  - `src/lib/api-key-guard.ts` — `extractApiKey()` 从 `X-API-Key` header 提取 API Key + `requireApiKey()` 返回 401 + `checkApiKey()` 组合校验
  - `src/lib/diary.ts` — 日记编排引擎：`generateDiary()` (vision → llm stream)、`saveDiary()` (R2 + DB upsert)、`getEntries()` (cursor 分页)、`getEntry()` (R2 读取 + 元数据)、`deleteDiary()` (R2 + DB 删除)
- **技术细节**：
  - Provider 模型映射：OpenAI → gpt-4o-mini / DeepSeek → deepseek-chat / Gemini → gemini-2.0-flash
  - Gemini 使用 OpenAI 兼容端点 `https://generativelanguage.googleapis.com/v1beta/openai`
  - 视觉分析失败时降级为 `[图片]`，不影响日记生成
  - `saveDiary()` 用 `prisma.entry.upsert` 实现每人每天一篇日记的幂等写入
  - `preview` 提取时过滤 Markdown 语法，保留纯文字前 200 字
  - `wordCount` 按去除 Markdown 语法后的字符数计算
  - `tags` 从 `#标签` 格式提取，JSON array 存入 DB
- **验证**：`npx tsc --noEmit` 零错误



### Stage 2: Auth System 完成
- **内容**：实现完整的 Supabase Magic Link 认证系统，包含服务端/客户端 Supabase client、全局 auth 中间件、登录页和 auth callback 路由
- **因果链**：Stage 1 (Project Bootstrap) 完成后 → 按 AGENTS.md Stage 2 清单逐项实施
- **新建文件**：
  - `src/lib/supabase/server.ts` — `createServerClient` + Next.js `cookies()` 封装，用于 Route Handlers 和 Server Components
  - `src/lib/supabase/client.ts` — `createBrowserClient` 封装，用于客户端组件
  - `src/lib/supabase/middleware.ts` — `updateSession` 函数，在 middleware 中验证 session，未登录重定向 `/login`
  - `src/middleware.ts` — Next.js 全局中间件，调用 `updateSession`，排除静态资源
  - `src/app/login/page.tsx` — Magic Link 登录页（"use client"），邮箱输入 + `signInWithOtp` + 发送成功/错误状态
  - `src/app/auth/callback/route.ts` — Auth callback route，用 `exchangeCodeForSession(code)` 交换 session 后重定向首页
  - `prisma/sql/01-auth-setup.sql` — Supabase SQL Editor 手动执行脚本：DB trigger 用户同步 + RLS 策略 (User/Entry 表)
- **修改文件**：
  - `src/app/page.tsx` — 改为 Async Server Component，调用 `getUser()` 区分已登录/未登录状态
  - `src/app/layout.tsx` — 无结构变更（`@supabase/ssr` v0.3 无需 provider wrapper）
- **技术细节**：
  - `@supabase/ssr` v0.3.0 — CookieMethods 接口使用 `get`/`set`/`remove`（非 v0.4+ 的 `getAll`/`setAll`）
  - Server client 中 `cookieStore.set()` 包裹 try-catch 以兼容 Server Components 只读上下文
  - Middleware 同时在 `request.cookies`（下游可见）和 `supabaseResponse.cookies`（浏览器可见）上设置 cookie
  - 已登录用户访问 `/login` 自动重定向到 `/`
  - Auth callback 处理三种情况：无 code 参数、exchangeCodeForSession 报错、成功
- **验证**：`npx tsc --noEmit` 零错误；`next dev` 启动成功
- **注意**：需要在 `.env.local` 中配置 `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 后即可运行；RLS 和 DB trigger 需在 Supabase SQL Editor 中执行 `prisma/sql/01-auth-setup.sql`

## 2026-05-20

### Stage 1: Project Bootstrap 完成
- **内容**：创建完整的 Next.js 14 项目骨架，包含 Tailwind CSS (现代优雅设计 Token)、Prisma Schema、TypeScript 类型定义、根布局和首页
- **因果链**：Phase 1 MVP 开发启动 → 按照 AGENTS.md Stage 1 清单逐项创建文件
- **影响文件**：package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.mjs, prisma/schema.prisma, src/types/index.ts, src/lib/db.ts, src/app/globals.css, src/app/layout.tsx, src/app/page.tsx
- **设计 Token**：tailwind.config.ts 实现了现代优雅配色方案（sakura #f0a8b0 / warm-white #faf3e8 / dusty-blue #9caec1 / ink #2c2c2c / surface #f3ebe1），Noto Sans SC 字体，小圆角极简风格
- **验证**：`npm run dev` 启动成功 HTTP 200，`npx prisma generate` 生成成功，`npx tsc --noEmit` 编译零错误
- **注意**：next.config.ts 不被 Next.js 14 支持，改为 next.config.mjs；themeColor 从 metadata 移至 viewport export

### 设计：确立「现代优雅 (Modern Elegant)」设计 Token
- **内容**：确立 Stage 1 界面设计风格为「现代优雅 (Modern Elegant)」，明确色调配比、辅助色、圆角大小、阴影及实体边框等样式规范。
- **因果链**：针对 Stage 1 启动前的 ■ 设计 Token 决策点，用户在「温润治愈」、「现代优雅」、「手账少女」三种方案中选定了「现代优雅」方案，以突出干净、极简、富有质感的数字杂志式日记体验。
- **影响文件**：docs/03-Phase1-MVP说明.md, AGENTS.md

### 存储：Supabase Storage → CloudFlare R2
- **内容**：将所有文档中的存储后端从 Supabase Storage 切换为 CloudFlare R2（S3 兼容，`@aws-sdk/client-s3`）
- **因果链**：用户决定利用 R2 的零出站费特性降低长期成本 → 搜索并替换了 8 个文件（AGENTS.md, docs/02-07, docs/01, README.md）
- **影响文件**：AGENTS.md, docs/01-PRD.md, docs/02-技术架构.md (v1.2), docs/03-Phase1-MVP说明.md, docs/04-Phase2到4路线图.md, docs/05-数据模型.md (v1.2), docs/07-商业化方案.md, README.md, .env.example（新建）

### 前后端分离评估
- **内容**：评估了 CF Pages（前端）+ Vercel（API）方案的可行性，记录在 AGENTS.md 和 docs/02 §2.5
- **因果链**：用户要求评估前后端分离 → 分析发现 Auth cookie 跨域、CORS 延迟、CF Workers 不支持 Prisma TCP 三大阻塞点 → 决定 Phase 1 保持 Vercel 单体部署
- **影响文件**：AGENTS.md, docs/02-技术架构.md

### TypeScript 类型清理（docs/05）
- **内容**：删除重复的 `DiaryEntry`/`DiarySummary` 定义，移除 `StorageConfig`、`videos`/`hasVideos`（Phase 2 内容），新增 `LocalApiKeyStore`
- **因果链**：审计发现 docs/05 有两套重复定义且包含过时的 StorageConfig → 去重并清理
- **影响文件**：docs/05-数据模型.md

### 文档补充：RLS + Auth Session + API Key 守卫 + Prisma-User 同步
- **内容**：扩充 AGENTS.md 和 docs/02，新增 RLS 策略 SQL、`@supabase/ssr` session 管理三层方案、API Key 守卫逻辑、Database Trigger 用户同步方案
- **因果链**：审计指出安全架构缺口（行 505）→ 逐一补充到权威文档中
- **影响文件**：AGENTS.md, docs/02-技术架构.md

### 环境变量参考表
- **内容**：在 docs/02 §7 新增完整的 13 个环境变量表，标注每个变量的用途、获取方式、使用位置
- **因果链**：审计指出环境变量命名不一致 → 集中整理为标准参考表
- **影响文件**：docs/02-技术架构.md

### 架构图 + 定价表修复
- **内容**：清除 docs/02 架构图中的 `<late>` 残留标签；修复 docs/07 定价表中 HTML 错位
- **因果链**：审计发现格式损坏 → 重写相关内容
- **影响文件**：docs/02-技术架构.md, docs/07-商业化方案.md

### README.md 扩展
- **内容**：从 2 行扩展为含 Tech Stack、安装步骤、环境变量说明、全部文档链接的结构化 README
- **因果链**：审计指出 README 对协作者无帮助 → 补充完整
- **影响文件**：README.md

### 新建 .env.example + .gitignore
- **内容**：创建 `.env.example`（13 个变量 + 注释来源）、`.gitignore`（Next.js 标准 + `data/` + Prisma）
- **因果链**：审计缺失 → 新建
- **影响文件**：.env.example（新建）, .gitignore（新建）

### Phase 2 "S3 存储" 功能改名
- **内容**：将 Phase 2 的 "S3 存储" 功能改为 "外部备份"（用户绑定自己的 S3 作为备份，非主存储）
- **因果链**：存储方案切换为 R2 后，"S3 存储" 的原始含义（用户可选 S3/local 主存储）已过时 → 重新定义为可选的用户自有备份
- **影响文件**：docs/04-Phase2到4路线图.md, docs/01-PRD.md, docs/03-Phase1-MVP说明.md

### 添加开发里程碑（8 个 Stage）
- **内容**：在 AGENTS.md 中加入完整的 Phase 1 MVP 8 阶段开发计划，按 vibe coding 优化（每个 Stage ≤120K token 上下文），标注 ■ 决策点
- **因果链**：用户要求设计 AI 友好的分阶段开发计划 → 按依赖关系和代码量将 12 个任务拆分为 8 个自包含 Stage
- **影响文件**：AGENTS.md

### CHANGELOG.md 规则
- **内容**：在 AGENTS.md Conventions 中新增：每次修改必须记录到 CHANGELOG.md（日期 + 内容 + 因果链）
- **因果链**：用户要求 → 添加为全局规范并创建本文件
- **影响文件**：AGENTS.md, CHANGELOG.md（本文件）

---

## 2026-05-20

### Byterover 记忆库初始化
- **内容**：建立 Byterover Context Tree（11 个 context.md，10 个 domain node），写入第一个 Session Memory 到 `.brv/memory-2026-05-20.json`
- **因果链**：用户要求初始化 Byterover 记忆库 → 扫描现有项目状态 → 按 Byterover Context Tree 规范创建 Domain → Topic → Subtopic 结构 contexts

### Stage 5: App Shell + Settings Page 完成
- **内容**：实现全局导航（PC 顶部 NavBar + 移动端底部 TabBar）、API Key 设置页（含服务商选择 + 测试连接）、API Key localStorage Hook、AppShell 布局包装器、首页登录后 Landing 页面
- **因果链**：Stage 4 (API Routes) 完成后 → 按 AGENTS.md Stage 5 清单逐项实施
- **新建文件**：
  - `src/hooks/useLocalApiKey.ts` — localStorage 持久化 API Key Hook。导出 `{ provider, apiKey, setProvider, setApiKey, clearApiKey, isConfigured, hydrated }`。SSR 安全（window 检测），JSON 序列化存储，key 为 `lingyin-api-config`
  - `src/components/AppShell.tsx` — 客户端布局包装器。根据 `usePathname()` 判断：auth 路由（/login、/auth）无导航，其他路由渲染 NavBar + main + MobileTabBar。移动端 main 区 `pb-20` 避开底部 TabBar
  - `src/components/NavBar.tsx` — PC 顶部导航（`hidden md:flex`）。左侧 Logo + "铃英日记"，右侧 写日记/时间线/设置 三个 Tab。`usePathname()` 匹配激活态（sakura 高亮背景）
  - `src/components/MobileTabBar.tsx` — 移动端底部 TabBar（`md:hidden fixed bottom-0`）。三个 Tab（PenLine/Clock/Settings 图标），激活态 sakura 色 + 粗描边，带 `backdrop-blur-sm` 毛玻璃效果 + `safe-area-bottom`
  - `src/app/settings/page.tsx` — 设置页。服务商选择（OpenAI/DeepSeek/Gemini 三选一 radio card），密码式 API Key 输入框（带显示/隐藏切换），「测试连接」按钮（调用 `/api/ai/test`），保存到 localStorage，「当前配置」状态卡片，「清除 API Key」按钮，「关于」信息区
  - `src/app/api/ai/test/route.ts` — `POST` 测试连接 API。接收 `{ provider, apiKey }` → 调对应 LLM 提供商的 `/chat/completions` 发 "Hi" 测试请求（max_tokens: 5，15s 超时）→ 返回 `{ connected: true/false, error? }`。API Key 不走日志，不做服务端存储
- **修改文件**：
  - `src/app/layout.tsx` — 移除内联 `<main>` → 改为 `<AppShell>` 包裹 children
  - `src/app/page.tsx` — 已登录用户首页改为 Landing 风格：欢迎语（你好，{email前缀}）+ CTA 按钮（开始写日记 / 浏览时间线）+「铃英小贴士」提示卡
- **决策**：首页行为 — 用户选择「Landing with diary preview」模式（非 redirect 到 /diary）。当前 Stage 5 先做 Landing 风格（欢迎语 + CTA + 小贴士），Stage 6-7 完成后再接入日记预览数据
- **验证**：`npx tsc --noEmit` 零错误
- **影响文件**：`memory/context.md`, `memory/01-project-overview/` ~ `memory/10-pwa-deploy/`, `.brv/memory-2026-05-20.json`

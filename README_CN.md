# 玲音日记 · LINGYIN

<p align="center">
  <img src="public/icons/icon-192.png" alt="玲音日记" width="96" height="96" />
</p>

<p align="center">
  <strong>AI 驱动的日记 PWA。说几句，拍张照，AI 帮你写成优美的日记。</strong>
</p>

<p align="center">
  <a href="https://lingyindiary.app">lingyindiary.app</a>
</p>

<p align="center">
  <a href="#什么是玲音日记">简介</a> ·
  <a href="#功能">功能</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#部署">部署</a> ·
  <a href="#架构">架构</a> ·
  <a href="#路线图">路线图</a>
</p>

<p align="center">
  <sub>🇬🇧 <a href="README.md">English</a> · 🇯🇵 <a href="README_JA.md">日本語</a></sub>
</p>

---

## 什么是玲音日记？

玲音日记是一个开源的 AI 日记应用。你用日常语言描述今天的生活——上传照片、随手记录——大语言模型会把它转换成一篇优美的、可发表的日记。

- 🧠 **AI 智能生成** — 自然温暖，Markdown 格式的日记写作
- 📷 **照片入文** — 上传图片，AI 分析场景并自然融入故事
- 📱 **PWA 安装** — 支持离线，可安装到手机桌面，缓存近期日记
- 🔐 **密钥加密存储** — API Key 服务端 AES-256-GCM 加密，不暴露给浏览器
- 🪄 **Markdown 编辑器** — 保存前可手动调整 AI 输出
- 🕰️ **时间线** — 浏览你的日记历史，预览摘要
- ✉️ **邮箱密码登录** — 独立账户系统，支持邮箱验证和密码重置

## 功能

| 功能 | 状态 |
|------|------|
| AI 日记生成（文字 + 图片） | ✅ Phase 1 |
| Markdown 编辑器（编辑/预览） | ✅ Phase 1 |
| 图片上传 + AI 视觉描述 | ✅ Phase 1 |
| PWA 安装（离线可用） | ✅ Phase 1 |
| 邮箱/密码登录 + 密码重置 | ✅ Phase 1 |
| 邮箱验证（Resend） | ✅ Phase 1 |
| 服务端加密 API Key（AES-256-GCM） | ✅ Phase 1 |
| 多 LLM 服务商（OpenAI / DeepSeek / Gemini） | ✅ Phase 1 |
| 日历视图 | 🗓️ Phase 2 |
| 视频上传 | 📹 Phase 2 |
| 编辑已保存日记 | ✏️ Phase 2 |
| 暗色模式 | 🌙 Phase 2 |
| 导出（MD / PDF / ZIP） | 📤 Phase 2 |
| 订阅付费 | 💳 Phase 3 |
| 管理后台 | 🛠️ Phase 3 |
| 公开日记分享 | 🌐 Phase 4 |
| 原生移动 App | 📱 Phase 4 |

完整路线图：[GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues)

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [Next.js 14+](https://nextjs.org/) (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | [Supabase](https://supabase.com/) PostgreSQL |
| 认证 | [Auth.js v5](https://authjs.dev/) (Credentials + JWT) |
| 邮件 | [Resend](https://resend.com/) |
| ORM | [Prisma](https://www.prisma.io/) |
| 文件存储 | [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) (S3 兼容) |
| LLM SDK | `openai` (兼容 OpenAI / DeepSeek / Gemini) |
| PWA | [Serwist](https://serwist.pages.dev/) |
| 部署 | [Vercel](https://vercel.com/) |

## 架构

```
┌──────────────────────────────────────────────────────┐
│                    浏览器 (PWA)                       │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ 日记编辑  │  │   设置    │  │   时间线           │ │
│  │          │  │ (API Key) │  │  (日记预览)        │ │
│  └────┬─────┘  └───────────┘  └─────────┬─────────┘ │
│       │                                  │           │
│       │      Auth.js JWT session         │           │
└───────┼──────────────────────────────────┼───────────┘
        │                                  │
   ┌────▼──────────────────────────────────▼─────────┐
   │              Next.js API Routes                  │
   │  /api/ai/generate   /api/entries   /api/upload   │
   │       │                                       │
   │       │ getUserDecryptedApiKey(userId, provider)│
   └───────┼──────────────────────────────────┬──────┘
           │              │                   │
   ┌───────▼──────┐  ┌────▼────────┐  ┌───────▼──────┐
   │   LLM API   │  │ PostgreSQL  │  │  CloudFlare  │
   │  (OpenAI /  │  │ (认证 +     │  │  R2 (日记    │
   │  DeepSeek / │  │  元数据 +   │  │  + 图片)     │
   │  Gemini)    │  │  API Key)   │  │              │
   └──────────────┘  └─────────────┘  └──────────────┘
```

**关键设计决策：**

- **内容与元数据分离：** 日记正文存储在 R2，仅元数据（标题、日期、预览、字数）存 PostgreSQL。查询快速，存储成本低。
- **服务端加密 API Key：** Key 经 AES-256-GCM 加密存储于 PostgreSQL，服务端按需解密后转发至 LLM 服务商，不暴露给浏览器，不记录日志。
- **Auth.js v5 独立认证：** 邮箱 + 密码登录，JWT 会话。无第三方认证服务依赖。
- **预签名 URL：** R2 为私有存储桶，所有文件访问使用短期预签名 URL，按用户验证。
- **每日一篇：** `@@unique([userId, date])` 约束，每人每天最多一篇日记。

## 快速开始

### 前置条件

- Node.js 20+
- npm 10+
- PostgreSQL 数据库（推荐 [Supabase](https://supabase.com) 免费套餐）
- [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) 存储桶（免费套餐：10 GB）
- [Resend](https://resend.com) 账号用于发送邮件（免费套餐：100 封/天）
- 至少一个 LLM 服务商的 API Key：[OpenAI](https://platform.openai.com/)、[DeepSeek](https://platform.deepseek.com/) 或 [Google AI](https://aistudio.google.com/)

### 1. 克隆并安装

```bash
git clone https://github.com/jerryisacat/lingyin-webapp.git
cd lingyin-webapp
npm install
```

### 2. 配置 PostgreSQL

创建 PostgreSQL 数据库。可使用 Supabase（仅 Database，不用 Auth）、Neon 或其他服务商。

获取连接字符串：
```
postgresql://postgres:<password>@<host>:5432/postgres
```

### 3. 配置 CloudFlare R2

1. 创建 R2 存储桶（如 `lingyin-webapp`）
2. 生成 API Token，权限选择 **Object Read & Write**
3. 记录 `Access Key ID`、`Secret Access Key` 和 endpoint URL

### 4. 生成密钥

```bash
openssl rand -hex 32  # AUTH_SECRET（JWT 签名用）
openssl rand -hex 32  # API_KEY_ENCRYPTION_KEY（API Key 加密用）
```

### 5. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
DATABASE_URL="postgresql://postgres:...@host:5432/postgres"
AUTH_SECRET="<上一步生成的 64 位 hex>"
AUTH_URL="http://localhost:3000"
API_KEY_ENCRYPTION_KEY="<上一步生成的 64 位 hex>"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@lingyindiary.app"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_BUCKET="lingyin-webapp"
```

### 6. 初始化数据库并启动

```bash
npx prisma db push
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 部署（Vercel）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jerryisacat/lingyin-webapp)

手动部署：

1. 推送本仓库到 GitHub
2. 在 [Vercel](https://vercel.com/new) 导入仓库
3. 设置 **Build Command** 为：`npx prisma generate && next build`
4. 设置 **Region** 为 `Hong Kong (hkg1)` 以降低国内访问延迟
5. 在 Vercel → Settings → Environment Variables 中添加所有环境变量
6. 部署

详见 [docs/deploy.md](docs/deploy.md)。

### Vercel 环境变量清单

| 变量 | 必须 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | ✅ | JWT 签名密钥（64 hex） |
| `AUTH_URL` | ✅ | `https://your-domain.vercel.app` |
| `API_KEY_ENCRYPTION_KEY` | ✅ | API Key 加密密钥 — **务必备份** |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `EMAIL_FROM` | ✅ | 已验证的发件地址 |
| `NEXT_PUBLIC_APP_URL` | ✅ | 同 AUTH_URL |
| `R2_ACCESS_KEY_ID` | ✅ | |
| `R2_SECRET_ACCESS_KEY` | ✅ | |
| `R2_ENDPOINT` | ✅ | |
| `R2_BUCKET` | ✅ | |

## 目录结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── diary/              # 日记编辑器 + 详情
│   ├── login/              # 邮箱密码登录
│   ├── register/           # 用户注册
│   ├── verify-email/       # 邮箱验证
│   ├── forgot-password/    # 忘记密码
│   ├── reset-password/     # 重置密码
│   ├── settings/           # API Key 配置
│   ├── timeline/           # 时间线浏览
│   └── api/                # API 路由
│       ├── auth/           # 认证（注册/验证/重置）
│       ├── ai/             # AI 生成（SSE 流式）
│       ├── entries/        # 日记 CRUD
│       ├── upload/         # 图片上传
│       ├── image/          # 预签名 URL 代理
│       └── user/           # 用户配置 + API Key 管理
├── components/             # 共享 UI 组件
│   └── auth/               # PasswordInput, VerifyEmailBanner
├── hooks/                  # React hooks (useApiKeys, useStreamGenerate)
├── lib/                    # 核心逻辑
│   ├── auth.ts             # Auth.js v5 配置
│   ├── auth-helpers.ts     # Session 工具函数
│   ├── auth-service.ts     # 注册/验证/重置业务逻辑
│   ├── crypto.ts           # AES-256-GCM 加解密
│   ├── email.ts            # Resend 邮件发送
│   ├── api-helpers.ts      # API 工具函数
│   ├── api-key-guard.ts    # API Key 提取 + 解密
│   ├── ai/                 # LLM 客户端 + Prompt
│   ├── storage.ts          # R2 S3 操作
│   ├── diary.ts            # 日记 CRUD
│   └── db.ts               # Prisma 客户端
├── middleware.ts            # Auth.js 路由保护
└── types/                  # TypeScript 类型定义

prisma/
└── schema.prisma           # 数据库模型

docs/                       # 架构文档（中文）
```

## 文档

| 文档 | 内容 |
|------|------|
| [docs/01-PRD.md](docs/01-PRD.md) | 产品需求文档 |
| [docs/02-技术架构.md](docs/02-技术架构.md) | 技术架构决策 |
| [docs/05-数据模型.md](docs/05-数据模型.md) | 数据模型 & Prisma Schema |
| [docs/deploy.md](docs/deploy.md) | 部署指南 |
| [AGENTS.md](AGENTS.md) | AI Agent 工作流 & 约定 |
| [CHANGELOG.md](CHANGELOG.md) | 变更日志 |

## 路线图

玲音日记分阶段开发。所有后续工作作为 [GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues) 跟踪：

| 阶段 | 重点 | 状态 |
|------|------|------|
| **1 — MVP** | AI 日记、编辑器、PWA、认证、加密 API Key | ✅ 已完成 |
| **2 — 体验** | 日历、视频、暗色模式、导出 | 🚧 计划中 |
| **3 — 商业化** | 订阅付费、管理后台 | 📋 计划中 |
| **4 — 平台化** | 分享、统计、原生 App | 📋 计划中 |

## 隐私与安全

- **API Key 服务端加密存储。** AES-256-GCM 加密存于 PostgreSQL，请求时内存解密，转发至 LLM 服务商，不落日志，不暴露给浏览器。
- **独立认证系统。** Auth.js v5 + bcrypt 密码哈希，不依赖第三方认证服务。
- **日记内容存 R2。** 数据库仅存元数据（日期、标题、字数），日记正文在 CloudFlare R2。
- **预签名 URL。** 图片通过短期预签名 URL 提供，不公开存储桶。
- **用户数据隔离。** 所有数据库查询通过 `getSessionUserId()` 限定当前用户。

完整安全模型见 [docs/02-技术架构.md](docs/02-技术架构.md)。

## 参与贡献

玲音日记正在活跃开发中，欢迎提交 Issue、功能建议和 Pull Request！

1. 浏览 [open issues](https://github.com/jerryisacat/lingyin-webapp/issues) — 选择一个或提出新 Issue
2. 从 `main` 分支创建：`git checkout -b feature/your-feature`
3. 遵循 [AGENTS.md](AGENTS.md) 中的约定进行开发
4. 运行 `npx tsc --noEmit` 确保 TypeScript 无错误
5. 推送并创建 Pull Request

重要变更请先创建 Issue 讨论。

## 开源协议

[MIT](LICENSE) © 2026 玲音日记 Contributors
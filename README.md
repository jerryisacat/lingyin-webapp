# 玲音日记 · LINGYIN

<p align="center">
  <img src="public/icons/icon-192.png" alt="玲音日记" width="96" height="96" />
</p>

<p align="center">
  <strong>AI-powered diary PWA. Talk about your day. AI writes it beautifully.</strong>
</p>

<p align="center">
  <a href="https://lingyindiary.app">lingyindiary.app</a>
</p>

<p align="center">
  <a href="#what-is-lingyin">About</a> ·
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#deploy">Deploy</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <sub>📖 <a href="README_CN.md">中文</a> · 🇯🇵 <a href="README_JA.md">日本語</a></sub>
</p>

---

## What is 玲音日记?

玲音日记 (LINGYIN Diary) is an open-source AI diary app. You describe your day in your own words — upload photos, jot down thoughts — and a large language model transforms it into a polished, publishable diary entry.

- 🧠 **AI-generated prose** — natural, warm, markdown-formatted diary writing
- 📷 **Photo to prose** — upload images, AI describes what it sees and weaves it into the story
- 📱 **Install as PWA** — works offline, lives on your home screen, caches recent entries
- 🔐 **Your keys, encrypted** — API keys AES-256-GCM encrypted on the server, never exposed to the browser
- 🪄 **Markdown editor** — fine-tune the AI output before saving
- 🕰️ **Timeline** — browse your diary history with preview snippets
- ✉️ **Email + password auth** — independent account system with email verification and password reset

## Features

| Feature | Status |
|---------|--------|
| AI diary generation (text + image) | ✅ Phase 1 |
| Markdown editor with preview | ✅ Phase 1 |
| Image upload + AI vision description | ✅ Phase 1 |
| PWA install (offline-capable) | ✅ Phase 1 |
| Email/password login + password reset | ✅ Phase 1 |
| Email verification via Resend | ✅ Phase 1 |
| Server-side encrypted API keys (AES-256-GCM) | ✅ Phase 1 |
| Multiple LLM providers (OpenAI / DeepSeek / Gemini) | ✅ Phase 1 |
| Calendar view | 🗓️ Phase 2 |
| Video upload in diary | 📹 Phase 2 |
| Edit saved diaries | ✏️ Phase 2 |
| Dark mode | 🌙 Phase 2 |
| Export (MD / PDF / ZIP) | 📤 Phase 2 |
| Subscription billing | 💳 Phase 3 |
| Admin dashboard | 🛠️ Phase 3 |
| Public diary sharing | 🌐 Phase 4 |
| Native mobile app | 📱 Phase 4 |

Full roadmap: [GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14+](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | [Supabase](https://supabase.com/) PostgreSQL |
| Auth | [Auth.js v5](https://authjs.dev/) (Credentials + JWT) |
| Email | [Resend](https://resend.com/) |
| ORM | [Prisma](https://www.prisma.io/) |
| File Storage | [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible) |
| LLM SDK | `openai` (compatible with OpenAI / DeepSeek / Gemini) |
| PWA | [Serwist](https://serwist.pages.dev/) |
| Deploy | [Vercel](https://vercel.com/) |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (PWA)                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │  Diary   │  │  Settings │  │  Timeline          │ │
│  │  Editor  │  │  (API Key)│  │  (Entry previews)  │ │
│  └────┬─────┘  └───────────┘  └─────────┬─────────┘ │
│       │                                  │           │
│       │     Auth.js JWT session          │           │
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
   │   LLM API    │  │ PostgreSQL  │  │  CloudFlare  │
   │  (OpenAI /   │  │ (Auth +     │  │  R2 (Diary   │
   │  DeepSeek /  │  │  Metadata + │  │  + Images)   │
   │  Gemini)     │  │  API Keys)  │  │              │
   └──────────────┘  └─────────────┘  └──────────────┘
```

**Key design decisions:**

- **Content vs metadata split:** Diary markdown lives in R2; only metadata (title, date, preview, word count) is in PostgreSQL. Fast queries, cheap storage.
- **Server-side encrypted API keys:** Keys are AES-256-GCM encrypted in PostgreSQL. The server decrypts per-request and forwards to LLM providers. Never exposed to the browser, never logged.
- **Auth.js v5 independent accounts:** Email + password login with JWT sessions. No external auth provider dependency.
- **Pre-signed URLs:** R2 bucket is private. All file access goes through short-lived pre-signed URLs, verified per user.
- **One entry per day:** `@@unique([userId, date])` constraint — one diary entry per user per calendar day.

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL database (e.g. [Supabase](https://supabase.com) free tier)
- A [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (free tier: 10 GB)
- A [Resend](https://resend.com) account for email sending (free tier: 100 emails/day)
- An API key from one of: [OpenAI](https://platform.openai.com/), [DeepSeek](https://platform.deepseek.com/), or [Google AI](https://aistudio.google.com/)

### 1. Clone & install

```bash
git clone https://github.com/jerryisacat/lingyin-webapp.git
cd lingyin-webapp
npm install
```

### 2. Set up PostgreSQL

Create a PostgreSQL database. You can use Supabase (Database only, no Auth), Neon, or any PostgreSQL provider.

Get your connection string:
```
postgresql://postgres:<password>@<host>:5432/postgres
```

### 3. Set up CloudFlare R2

1. Create an R2 bucket (e.g. `lingyin-webapp`)
2. Generate an API token with **Object Read & Write** permission
3. Note your `Access Key ID`, `Secret Access Key`, and endpoint URL

### 4. Generate encryption keys

```bash
openssl rand -hex 32  # AUTH_SECRET
openssl rand -hex 32  # API_KEY_ENCRYPTION_KEY
```

### 5. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:...@host:5432/postgres"
AUTH_SECRET="<64 hex chars from step 4>"
AUTH_URL="http://localhost:3000"
API_KEY_ENCRYPTION_KEY="<64 hex chars from step 4>"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@lingyindiary.app"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_BUCKET="lingyin-webapp"
```

### 6. Push database & start

```bash
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jerryisacat/lingyin-webapp)

Or manually:

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Set **Build Command** to: `npx prisma generate && next build`
4. Set **Region** to `Hong Kong (hkg1)` for lowest latency to Chinese users
5. Add all environment variables from `.env.example` in Vercel → Settings → Environment Variables
6. Deploy

See [docs/deploy.md](docs/deploy.md) for the full deployment guide.

### Env var checklist for Vercel

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | 64 hex chars (`openssl rand -hex 32`) |
| `AUTH_URL` | ✅ | `https://your-domain.vercel.app` |
| `API_KEY_ENCRYPTION_KEY` | ✅ | 64 hex chars — **back this up** |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `EMAIL_FROM` | ✅ | Verified sender address |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same as AUTH_URL |
| `R2_ACCESS_KEY_ID` | ✅ | |
| `R2_SECRET_ACCESS_KEY` | ✅ | |
| `R2_ENDPOINT` | ✅ | |
| `R2_BUCKET` | ✅ | |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── diary/              # Diary editor + detail
│   ├── login/              # Email/password login
│   ├── register/           # User registration
│   ├── verify-email/       # Email verification
│   ├── forgot-password/    # Password reset request
│   ├── reset-password/     # Set new password
│   ├── settings/           # API key config
│   ├── timeline/           # Entry browsing
│   └── api/                # API routes
│       ├── auth/           # Auth (register, verify, reset)
│       ├── ai/             # LLM generation (SSE streaming)
│       ├── entries/        # Entry CRUD
│       ├── upload/         # Image upload
│       ├── image/          # Pre-signed URL proxy
│       └── user/           # User config + API keys
├── components/             # Shared UI components
│   └── auth/               # PasswordInput, VerifyEmailBanner
├── hooks/                  # React hooks (useApiKeys, useStreamGenerate)
├── lib/                    # Core logic
│   ├── auth.ts             # Auth.js v5 config
│   ├── auth-helpers.ts     # Session helpers
│   ├── auth-service.ts     # Register/verify/reset logic
│   ├── crypto.ts           # AES-256-GCM encrypt/decrypt
│   ├── email.ts            # Resend email sending
│   ├── api-helpers.ts      # API utilities
│   ├── api-key-guard.ts    # API key retrieval + decryption
│   ├── ai/                 # LLM client + prompts
│   ├── storage.ts          # R2 S3 operations
│   ├── diary.ts            # Entry CRUD helpers
│   └── db.ts               # Prisma client
├── middleware.ts            # Auth.js route protection
└── types/                  # TypeScript type definitions

prisma/
└── schema.prisma           # Database schema

docs/                       # Architecture docs (Chinese)
```

## Documentation

| Document | Content |
|----------|---------|
| [docs/01-PRD.md](docs/01-PRD.md) | Product requirements (Chinese) |
| [docs/02-技术架构.md](docs/02-技术架构.md) | Technical architecture (Chinese) |
| [docs/05-数据模型.md](docs/05-数据模型.md) | Data models & Prisma schema (Chinese) |
| [docs/deploy.md](docs/deploy.md) | Deployment guide (Chinese) |
| [AGENTS.md](AGENTS.md) | Agent workflow & conventions |
| [CHANGELOG.md](CHANGELOG.md) | Change history |

## Roadmap

玲音日记 is developed in phases. All future work is tracked as [GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues):

| Phase | Focus | Status |
|-------|-------|--------|
| **1 — MVP** | AI diary, editor, PWA, auth, encrypted API keys | ✅ Done |
| **2 — UX** | Calendar, video, dark mode, export | 🚧 Planned |
| **3 — Monetization** | Subscriptions, admin dashboard | 📋 Planned |
| **4 — Platform** | Sharing, stats, native apps | 📋 Planned |

## Privacy & Security

- **API Keys encrypted on server.** Stored in PostgreSQL with AES-256-GCM encryption. Decrypted per-request in memory, forwarded to the LLM provider, never logged or exposed to the browser.
- **Independent auth system.** Auth.js v5 with bcrypt-hashed passwords. No third-party auth provider dependency.
- **Your diary content in R2.** We store only metadata (date, title, word count) in the database. The actual diary text lives in CloudFlare R2.
- **Pre-signed URLs.** Images are served through short-lived pre-signed URLs. No public bucket access.
- **User-scoped queries.** All database queries are scoped to the authenticated user via `getSessionUserId()`.

See [docs/02-技术架构.md](docs/02-技术架构.md) for the full security model (Chinese).

## Contributing

玲音日记 is in active development. Contributions, issues, and feature requests are welcome!

1. Check the [open issues](https://github.com/jerryisacat/lingyin-webapp/issues) — pick one or propose a new one
2. Branch from `main`: `git checkout -b feature/your-feature`
3. Make your changes, following the conventions in [AGENTS.md](AGENTS.md)
4. Run `npx tsc --noEmit` to verify TypeScript is clean
5. Push and open a Pull Request

## License

[MIT](LICENSE) © 2026 玲音日记 Contributors

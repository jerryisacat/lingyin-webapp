# 玲音日记 · LINGYIN

<p align="center">
  <a href="README.md">🇨🇳 中文</a> · <a href="README.en.md">🇺🇸 English</a>
</p>

<p align="center">
  <img src="public/icons/icon-192.png" alt="玲音日记" width="96" height="96" />
</p>

<p align="center">
  <strong>AI-powered diary PWA. Talk about your day. AI writes it beautifully.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#deploy">Deploy</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is 玲音日记?

玲音日记 (LINGYIN Diary) is an open-source AI diary app. You describe your day in your own words — upload photos, jot down thoughts — and a large language model transforms it into a polished, publishable diary entry.

- 🧠 **AI Generation** — describe your day in natural language, AI crafts warm, formatted Markdown diary entries
- 📷 **Photo to Prose** — upload photos, AI analyzes scenes and atmosphere, weaving them naturally into your story
- ✏️ **Markdown Editor** — refine AI-generated content; preview, insert, and delete images while editing
- 📱 **PWA Offline** — install to home screen, read diaries offline
- 🔐 **Email + Password Login** — Auth.js v5 Credentials, email verification + JWT sessions
- 🗝️ **Bring Your Own API Key** — bind your OpenRouter key, encrypted server-side with AES-256-GCM
- 🕰️ **Timeline** — browse all diaries by date with preview snippets

## Features

| Feature | Description |
|---------|-------------|
| AI Diary Generation | Describe your day + upload photos → AI generates warm Markdown diary |
| Markdown Editor | Live preview, edit AI output, image preview/insert/delete in edit mode |
| Image Management | Upload up to 9 images, drag-to-reorder, add/remove while editing |
| PWA Install | Desktop & mobile install, Service Worker offline caching |
| Timeline Browsing | Browse all diaries by date, preview snippets, cursor-based pagination |
| Email + Password Auth | Auth.js v5 Credentials + JWT, Resend email verification |
| API Key Management | Bind your OpenRouter key, AES-256-GCM server-side encryption |
| Diary Editing | Edit saved diary content (including images), auto-updates R2 on save |

[View full roadmap →](https://github.com/jerryisacat/lingyin-webapp/issues)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14+](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | [Supabase](https://supabase.com/) PostgreSQL |
| Auth | Auth.js v5 (Credentials + JWT) |
| Email | [Resend](https://resend.com/) |
| ORM | [Prisma](https://www.prisma.io/) |
| File Storage | [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible) |
| LLM Gateway | [OpenRouter](https://openrouter.ai/) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) |
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
└───────┼──────────────────────────────────┼───────────┘
        │                                  │
   ┌────▼──────────────────────────────────▼─────────┐
   │              Next.js API Routes                  │
   │  /api/ai/generate   /api/entries   /api/upload   │
   └────┬──────────────┬──────────────┬──────────────┘
        │              │              │
   ┌────▼────┐   ┌─────▼──────┐  ┌───▼──────────┐
   │  LLM    │   │  Supabase  │  │  CloudFlare   │
   │  API    │   │  (Metadata)│  │  R2 (Diary    │
   │         │   │            │  │  + Images)    │
   └─────────┘   └────────────┘  └───────────────┘
```

**Key design decisions:**
- **Content vs metadata split:** Diary markdown lives in R2; only metadata (date, preview, word count) is in PostgreSQL.
- **Server-encrypted API keys:** User API keys are AES-256-GCM encrypted in PostgreSQL. The server decrypts on-the-fly per request.
- **Pre-signed URLs:** R2 bucket is private. All file access uses short-lived pre-signed URLs, verified per user.
- **One entry per day:** `@@unique([userId, date])` — one diary entry per user per calendar day.

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (free tier works)
- A [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (free tier: 10 GB)
- An [OpenRouter](https://openrouter.ai/) API key

### 1. Clone & install

```bash
git clone https://github.com/jerryisacat/lingyin-webapp.git
cd lingyin-webapp
npm install
```

### 2. Set up Supabase (Database only)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string
3. Note: Auth is handled by Auth.js, NOT Supabase Auth

### 3. Set up CloudFlare R2

1. Create an R2 bucket named `lingyin-webapp`
2. Generate an API token with **Object Read & Write** permission
3. Note your `Access Key ID`, `Secret Access Key`, and endpoint URL

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres"
AUTH_SECRET="openssl rand -base64 32"
API_KEY_ENCRYPTION_KEY="openssl rand -hex 32"
RESEND_API_KEY="re_..."
AUTH_RESEND_KEY="re_..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_BUCKET="lingyin-webapp"
```

### 5. Push database & start

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
4. Add all environment variables from `.env.example` in Vercel → Settings → Environment Variables
5. Deploy

### Env var checklist for Vercel

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Supabase connection string |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `API_KEY_ENCRYPTION_KEY` | ✅ | `openssl rand -hex 32` — back this up! |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `AUTH_RESEND_KEY` | ✅ | Resend API key (can be same as above) |
| `R2_ACCESS_KEY_ID` | ✅ | |
| `R2_SECRET_ACCESS_KEY` | ✅ | |
| `R2_ENDPOINT` | ✅ | |
| `R2_BUCKET` | ✅ | |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── diary/              # Diary editor
│   ├── login/              # Auth pages
│   ├── settings/           # API key config
│   ├── timeline/           # Entry browsing
│   └── api/                # API routes
│       ├── ai/             # LLM generation (SSE streaming)
│       ├── entries/        # Entry CRUD
│       ├── upload/         # Image upload
│       └── image/          # Pre-signed URL proxy
├── components/             # Shared UI components
├── lib/                    # Core logic
│   ├── ai/                 # LLM client + prompts
│   ├── storage.ts          # R2 S3 operations
│   ├── diary.ts            # Entry CRUD helpers
│   └── db.ts               # Prisma client
└── types/                  # TypeScript type definitions

prisma/
├── schema.prisma           # Database schema

docs/                       # Architecture docs (Chinese)
```

## Documentation

| Document | Content |
|----------|---------|
| [docs/01-PRD.md](docs/01-PRD.md) | Product requirements (Chinese) |
| [docs/02-技术架构.md](docs/02-技术架构.md) | Technical architecture (Chinese) |
| [docs/05-数据模型.md](docs/05-数据模型.md) | Data models & Prisma schema (Chinese) |
| [AGENTS.md](AGENTS.md) | Agent workflow & conventions |
| [CHANGELOG.md](CHANGELOG.md) | Change history |

## Roadmap

All future work is tracked as [GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues):

| Phase | Focus | Status |
|-------|-------|--------|
| **1 — MVP** | AI diary, editor, PWA, Auth | ✅ Done |
| **2 — UX** | Calendar, video, multi-tone, dark mode, export | 🚧 In progress |
| **3 — Monetization** | Subscriptions, admin dashboard | 📋 Planned |
| **4 — Platform** | Sharing, stats, native apps, public API | 📋 Planned |

## Privacy & Security

- **API keys encrypted server-side.** User API keys are AES-256-GCM encrypted in PostgreSQL, decrypted on-the-fly per request. Never logged, never persisted in plaintext.
- **Diary content in your R2 bucket.** Only metadata (date, word count, etc.) is stored in the database. The actual diary text lives in CloudFlare R2.
- **Pre-signed URLs.** Images are served through short-lived pre-signed URLs, verified against user session. No public bucket access.
- **Row Level Security.** Every database query is scoped to the authenticated user.

See [docs/02-技术架构.md](docs/02-技术架构.md) for the full security model.

## Contributing

玲音日记 is in active development. Contributions, issues, and feature requests are welcome!

1. Check the [open issues](https://github.com/jerryisacat/lingyin-webapp/issues) — pick one or propose a new one
2. Branch from `main`: `git checkout -b feature/your-feature`
3. Make your changes, following the conventions in [AGENTS.md](AGENTS.md)
4. Run `npx tsc --noEmit` to verify TypeScript is clean
5. Push and open a Pull Request

For significant changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE) © 2026 玲音日记 Contributors

# 玲音日记 · LINGYIN

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

- 🧠 **AI-generated prose** — natural, warm, markdown-formatted diary writing
- 📷 **Photo to prose** — upload images, AI describes what it sees and weaves it into the story
- 📱 **Install as PWA** — works offline, lives on your home screen, caches recent entries
- 🔐 **Your keys, your data** — bring your own LLM API key; diary content stored in your own CloudFlare R2 bucket
- 🪄 **Markdown editor** — fine-tune the AI output before saving
- 🕰️ **Timeline** — browse your diary history with preview snippets

## Features

| Feature | Status |
|---------|--------|
| AI diary generation (text + image) | ✅ Phase 1 |
| Markdown editor with preview | ✅ Phase 1 |
| Image upload + AI vision description | ✅ Phase 1 |
| PWA install (offline-capable) | ✅ Phase 1 |
| Magic Link email login | ✅ Phase 1 |
| Multiple LLM providers (OpenAI / DeepSeek / Gemini) | ✅ Phase 1 |
| Calendar view | 🗓️ Phase 2 |
| Video upload in diary | 📹 Phase 2 |
| Edit saved diaries | ✏️ Phase 2 |
| Dark mode | 🌙 Phase 2 |
| Password login | 🔐 Phase 2 |
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
| Auth | Supabase Auth (Magic Link) |
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
│       │  X-API-Key header               │           │
└───────┼──────────────────────────────────┼───────────┘
        │                                  │
   ┌────▼──────────────────────────────────▼─────────┐
   │              Next.js API Routes                  │
   │  /api/ai/generate   /api/entries   /api/upload   │
   └────┬──────────────┬──────────────┬──────────────┘
        │              │              │
   ┌────▼────┐   ┌─────▼──────┐  ┌───▼──────────┐
   │  LLM    │   │  Supabase  │  │  CloudFlare   │
   │  API    │   │  (Auth +   │  │  R2 (Diary    │
   │         │   │   Metadata)│  │  + Images)    │
   └─────────┘   └────────────┘  └───────────────┘
```

**Key design decisions:**
- **Content vs metadata split:** Diary markdown lives in R2; only metadata (title, date, preview, word count) is in PostgreSQL. This keeps database queries fast and storage cheap.
- **User-managed API keys:** Each user brings their own LLM API key (stored in browser `localStorage`, sent via `X-API-Key` header). The server never stores or logs it.
- **Pre-signed URLs:** R2 bucket is private. All file access goes through short-lived pre-signed URLs, verified per user.
- **One entry per day:** `@@unique([userId, date])` constraint — one diary entry per user per calendar day.

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (free tier works)
- A [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (free tier: 10 GB)
- An API key from one of: [OpenAI](https://platform.openai.com/), [DeepSeek](https://platform.deepseek.com/), or [Google AI](https://aistudio.google.com/)

### 1. Clone & install

```bash
git clone https://github.com/jerryisacat/lingyin-webapp.git
cd lingyin-webapp
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the setup script from `scripts/supabase-setup.sql`
3. Go to **Authentication → Settings**:
   - Enable **Email provider** with Magic Link
   - Set **Site URL** to `http://localhost:3000` (for local dev)
4. Copy your project URL and anon key from **Settings → API**

### 3. Set up CloudFlare R2

1. Create an R2 bucket named `lingyin-webapp`
2. Generate an API token with **Object Read & Write** permission
3. Note your `Access Key ID`, `Secret Access Key`, and endpoint URL

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the values:

```env
DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
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
5. ⚠️ **Important:** Vercel does NOT expand `${VAR}` references. Paste the actual values, not `"${SUPABASE_ANON_KEY}"`.
6. Deploy

After deploy, update Supabase **Site URL** and **Redirect URLs** to your production domain.

### Env var checklist for Vercel

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | ✅ Supabase connection string |
| `SUPABASE_URL` | ✅ Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ For server-side operations |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Same as SUPABASE_URL (literal value) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Same as SUPABASE_ANON_KEY (literal value) |
| `R2_ACCESS_KEY_ID` | ✅ |
| `R2_SECRET_ACCESS_KEY` | ✅ |
| `R2_ENDPOINT` | ✅ |
| `R2_BUCKET` | ✅ |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── diary/              # Diary editor
│   ├── login/              # Auth (Magic Link)
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
| [docs/01-PRD.md](docs/01-PRD.md) | Product requirements |
| [docs/02-技术架构.md](docs/02-技术架构.md) | Technical architecture decisions |
| [docs/05-数据模型.md](docs/05-数据模型.md) | Data models & Prisma schema |
| [AGENTS.md](AGENTS.md) | Agent workflow & conventions |
| [CHANGELOG.md](CHANGELOG.md) | Change history |

## Roadmap

玲音日记 is developed in phases. All future work is tracked as [GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues):

| Phase | Focus | Issues |
|-------|-------|--------|
| **1 — MVP** ✅ | AI diary, editor, PWA | Done |
| **2 — UX** 🚧 | Calendar, video, dark mode, password login, export | 8 issues |
| **3 — Monetization** | Subscriptions, admin dashboard, unified keys | 6 issues |
| **4 — Platform** | Sharing, stats, native apps, open API | 6 issues |

## Privacy & Security

- **Your API key never touches our servers.** It's stored in your browser's `localStorage` and sent per-request via `X-API-Key` header. The server forwards it to the LLM provider and never logs it.
- **Your diary content is in your R2 bucket.** We store only metadata (date, title, word count) in the database. The actual diary text lives in CloudFlare R2 under your own account.
- **Pre-signed URLs.** Images are served through short-lived pre-signed URLs, verified against your user session. No public bucket access.
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

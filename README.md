# 铃英日记 (lingyin-webapp)

AI-powered diary PWA. Users submit text + images, AI generates a polished Markdown diary entry.

## Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (Magic Link)
- **Storage:** CloudFlare R2 (S3-compatible)
- **PWA:** Serwist
- **Deploy:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project ([supabase.com](https://supabase.com))
- CloudFlare R2 bucket (optional for dev, use local `data/` fallback)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Fill in .env.local with your Supabase + R2 credentials

# 4. Push Prisma schema to database
npx prisma db push

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — Supabase PostgreSQL connection string
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase Auth
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` / `R2_BUCKET` — CloudFlare R2

## Documentation

| Document | Description |
|----------|-------------|
| [docs/01-PRD.md](docs/01-PRD.md) | Product requirements |
| [docs/02-技术架构.md](docs/02-技术架构.md) | Technical architecture |
| [docs/03-Phase1-MVP说明.md](docs/03-Phase1-MVP说明.md) | Phase 1 MVP scope & tasks |
| [docs/04-Phase2到4路线图.md](docs/04-Phase2到4路线图.md) | Phase 2-4 roadmap |
| [docs/05-数据模型.md](docs/05-数据模型.md) | Data models & Prisma schema |
| [docs/06-用户体验与交互流程.md](docs/06-用户体验与交互流程.md) | UX flows |
| [docs/07-商业化方案.md](docs/07-商业化方案.md) | Monetization plan |
| [AGENTS.md](AGENTS.md) | Agent instructions / source of truth |

## License

Private — pre-release.

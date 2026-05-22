# Deploy Guide — 玲音日记

## Overview

- **Deploy target:** Vercel (Next.js monolith, region: hkg1)
- **Database:** Supabase PostgreSQL (via Prisma + `DATABASE_URL`)
- **File storage:** CloudFlare R2 (S3-compatible, `@aws-sdk/client-s3`)
- **Auth:** Auth.js v5 (Credentials + JWT, with Resend email)
- **PWA:** Serwist (`@serwist/next`)

## Prerequisites

- Node.js 18+
- A Vercel account linked to the repo
- A Supabase project (free tier works) with a PostgreSQL instance
- A CloudFlare R2 bucket
- A Resend account with a verified sending domain

## 1. Environment Variables

All variables below must be set in Vercel's Environment Variables dashboard (Project Settings → Environment Variables). The `.env.example` lists the same keys for local dev.

### 1.1 Generate Secrets

Run these locally, then paste the outputs into Vercel:

```bash
# Auth.js JWT signing key (64 hex chars)
openssl rand -hex 32

# API Key encryption key (64 hex chars, for AES-256-GCM)
openssl rand -hex 32
```

### 1.2 Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:<password>@<host>:5432/postgres` — your Supabase PG connection string. In Supabase Dashboard → Project Settings → Database → Connection String, use **Session mode (port 5432)**. |
| `AUTH_SECRET` | Yes | 64-char hex string from `openssl rand -hex 32`. JWT signing key for Auth.js. |
| `AUTH_URL` | Yes | `https://your-domain.vercel.app` — your production URL. |
| `API_KEY_ENCRYPTION_KEY` | Yes | 64-char hex string from `openssl rand -hex 32`. Encrypts user LLM API keys at rest. If lost, all stored API keys become unrecoverable — back it up in a password manager. |
| `RESEND_API_KEY` | Yes | `re_...` — API key from Resend. |
| `EMAIL_FROM` | Yes | Verified sender address, e.g., `noreply@lingyin.app`. |
| `R2_ACCESS_KEY_ID` | Yes | CloudFlare R2 access key (Dashboard → R2 → Manage Tokens). |
| `R2_SECRET_ACCESS_KEY` | Yes | CloudFlare R2 secret key. |
| `R2_ENDPOINT` | Yes | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | Yes | Bucket name, e.g., `lingyin-webapp`. |

### 1.3 Vercel-Specific

- `NEXT_PUBLIC_APP_URL` is auto-injected by Vercel as `https://<project-name>.vercel.app` (use in place of `AUTH_URL` if you prefer).
- Set `NODE_ENV=production` (auto-set by Vercel in production deployments).

## 2. Database Setup

### 2.1 Supabase PostgreSQL

1. Create a Supabase project
2. Go to Project Settings → Database → Connection String
3. Copy the **Session mode** URI (port 5432)
4. Replace `<password>` with your database password
5. Set this as `DATABASE_URL` in Vercel

### 2.2 Prisma Migrations

After setting `DATABASE_URL` locally:

```bash
# Apply pending migrations to the database
npx prisma migrate deploy

# Or, for the initial deploy:
npx prisma migrate dev --name init
```

Vercel's build command (`vercel.json`) already runs `npx prisma generate` before `next build`. Migrations (`prisma migrate deploy`) must be run separately — either:

- **Manually** from your local machine with `DATABASE_URL` pointing to production
- **Via Vercel CLI:** `vercel env pull && npx prisma migrate deploy`
- **Via CI/CD** as a post-deploy step

> The `prisma/schema.prisma` datasource already points to `env("DATABASE_URL")` — Supabase PG, direct connection, no connection pooler needed for Prisma.

### 2.3 RLS (Row-Level Security)

RLS is **not required** with Auth.js v5. The app connects to Supabase PostgreSQL directly via Prisma (not via Supabase client). API routes handle authorization via Auth.js session. Supabase Auth is not used.

If you previously had RLS policies for `@supabase/ssr`, they are no longer needed and can be disabled.

## 3. CloudFlare R2

### 3.1 Create Bucket & Token

1. CloudFlare Dashboard → R2 → Create bucket (`lingyin-webapp`)
2. Manage R2 API Tokens → Create token with **Object Read & Write** permission
3. Copy Access Key ID and Secret Access Key
4. Note your Account ID from the CloudFlare dashboard URL: `dash.cloudflare.com/<account-id>`

### 3.2 Storage Path Structure

Diary markdown and uploaded images are stored in R2 under:
```
{userId}/entries/{YYYY}/{MM}/{YYYY-MM-DD}.md
{userId}/images/{upload-id}.{ext}
```

No manual setup needed — the app creates paths on first write.

### 3.3 CORS (for image serving)

If serving images directly from R2 (via presigned URLs), configure CORS on the bucket:

```json
{
  "AllowedOrigins": ["https://your-domain.vercel.app"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

## 4. Resend Email

1. Create a Resend account
2. Add and verify your sending domain
3. Create an API key with "Sending" permission
4. Set `RESEND_API_KEY` and `EMAIL_FROM` (must match a verified domain/email)

> Free tier: 100 emails/day. Sufficient for low-traffic MVP.

## 5. Vercel Deployment

### 5.1 Initial Deploy

1. Push to `main` branch — Vercel auto-deploys from `main`
2. Set all environment variables in Vercel dashboard before first deploy
3. Vercel runs `prisma generate && next build` (configured in `vercel.json`)

### 5.2 Build Command

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["hkg1"],
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm install"
}
```

- `prisma generate` creates the Prisma client before `next build` imports it
- `next build` compiles the Next.js app (App Router)

### 5.3 Branch Deploys

- Only `main` triggers production deployment
- `develop/*` branches do NOT auto-deploy
- Preview deployments are optional (configure in Vercel dashboard)

### 5.4 Cold Start Note

Auth.js v5 + Prisma + Next.js API routes combine for ~1-2s cold start on Vercel hobby tier (hkg1 region). Warm invocations are < 200ms.

## 6. PWA

The Serwist service worker (`src/sw.ts`) handles offline caching:

- App shell (`/`, `/timeline`) — CacheFirst, 7 days
- Diary API (`/api/entries`) — NetworkFirst, 5s timeout, 1h cache
- Images — CacheFirst, 30 days
- Other API routes — NetworkOnly

Icons (`public/icons/icon-192.png`, `icon-512.png`) and `manifest.json` are prebuilt. The SW is compiled at `next build` time into `public/sw.js`.

## 7. Supabase Project-Level Setup

Since the project only uses Supabase PostgreSQL (not Supabase Auth, Storage, or Edge Functions):

1. **Disable Supabase Auth** in Project Settings → Authentication → turn off if unused services cause confusion
2. **No `SUPABASE_SERVICE_ROLE_KEY` needed** — the app uses Prisma direct connection
3. **No Supabase client libraries** in dependencies (`@supabase/ssr`, `@supabase/supabase-js` are removed)

## 8. Post-Deploy Verification

After deploying, verify these flows:

```bash
# 1. App loads without 500
curl -I https://your-domain.vercel.app

# 2. Auth pages render
curl https://your-domain.vercel.app/login
curl https://your-domain.vercel.app/register

# 3. API routes respond (should return 401 for unauthenticated requests)
curl https://your-domain.vercel.app/api/user/api-keys

# 4. PWA manifest served
curl https://your-domain.vercel.app/manifest.json

# 5. Service worker served
curl https://your-domain.vercel.app/sw.js
```

Then do a manual E2E walkthrough:
1. Register a new account → verify email → login
2. Set an API key in Settings → test connection
3. Write a diary entry (AI generation)
4. Check timeline for the saved entry
5. Install PWA on mobile

## 9. Backup Strategy

- **Database:** Supabase provides automatic daily backups (free tier). Enable Point-in-Time Recovery if needed.
- **R2 Storage:** Enable Object Versioning on the bucket. Optionally set up `rclone sync` to a secondary bucket.
- **API Key Encryption:** `API_KEY_ENCRYPTION_KEY` must be backed up independently (password manager). If lost, all user API keys are permanently unrecoverable.

## 10. Monitoring

- **Vercel Analytics:** `@vercel/analytics` is included — monitor in Vercel dashboard
- **Vercel Logs:** `vercel logs https://your-domain.vercel.app`
- **Database:** Supabase dashboard → Database → Statistics

## 11. Common Issues

| Issue | Cause | Fix |
|---|---|---|
| `DATABASE_URL` connection refused | IP not allowlisted | In Supabase Dashboard → Project Settings → Database, add Vercel's IP ranges or enable IPv4 for all |
| Prisma client not found | `prisma generate` not run | Check `vercel.json` build command |
| Auth.js `AUTH_SECRET` missing | Env var not set in Vercel | Add via Vercel Dashboard → Environment Variables |
| Resend 429 | Free tier limit (100/day) | Wait or upgrade |
| R2 403 Access Denied | Token permissions | Ensure R2 token has Object Read & Write |
| `API_KEY_ENCRYPTION_KEY` rejected | Not exactly 64 hex chars | Regenerate: `openssl rand -hex 32` |
| Service worker not registering | SW path mismatch | Ensure `public/sw.js` exists after build |

---
children_hash: f6f399c9cc1586c32ced5d769b009b5a9d7e31010fd58d66909ab13d5afd657c
compression_ratio: 0.4797619047619048
condensation_order: 1
covers: [r2_privacy_and_asset_management.md]
covers_token_total: 840
summary_level: d1
token_count: 403
type: summary
---
# R2 Privacy and Asset Management

**Entry:** `r2_privacy_and_asset_management.md`

## Purpose
Documents privacy hardening and storage enhancements for Cloudflare R2 (Issue #23). Enforces owner-only access via presigned URLs, removes all public URL fallbacks, and adds asset cleanup on diary deletion.

## Architectural Decisions
- **Storage layer** (`src/lib/storage.ts`): S3Client with R2 endpoint; path builders (`buildMarkdownPath`, `buildAssetPath`) under `users/{userId}/entries/{year}/{month}/`; `getPresignedUrl` always returns time-bound signed URLs (3600s default); new `deleteDirectory` for prefix-based batch deletion via `ListObjectsV2` + `DeleteObjectsCommand`.
- **Image API** (`src/app/api/image/route.ts`): `GET` enforces `getUser()` + owner verification; returns 404 on mismatch to avoid info leaks.
- **Diary lifecycle** (`src/lib/diary.ts`): `deleteDiary` now calls `storage.deleteEntry` + `storage.deleteDirectory` before Prisma removal.
- **Service Worker** (`src/sw.ts`): `/api/image` switched to `NetworkOnly` for time-sensitive presigned URLs.
- **Config cleanup**: Removed `R2_PUBLIC_URL` and remote image domain from `next.config`.

## Key Entities & Functions
- `upsertDiary`, `getEntries`, `getEntry`, `deleteDiary` (Prisma + storage coordination)
- `DiarySummary` type (id, date, title, preview, hasImages, wordCount, tags, createdAt)
- `r2_client`, path builders, `presigned_url`, `delete_directory`, `image_api_auth`

## Relationships
- Depends on R2 env vars, Prisma `Entry` model, Serwist SW.
- Privacy invariants: no public URLs, owner-only access, full asset cleanup on delete.
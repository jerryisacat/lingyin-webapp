---
title: R2 Privacy and Asset Management
summary: 'R2 storage with privacy fixes: presigned URLs only, owner auth on /api/image returning 404, deleteDirectory, SW NetworkOnly, asset cleanup in deleteDiary'
tags: []
related: []
keywords: []
createdAt: '2026-05-22T10:43:25.645Z'
updatedAt: '2026-05-22T10:43:25.645Z'
---
## Reason
Document R2 storage privacy fixes from Issue #23 including auth, presigned URLs, and cleanup

## Raw Concept
**Task:**
R2 user file privacy fix and storage enhancements

**Changes:**
- Removed getImageUrl dead code and R2_PUBLIC_URL fallback
- getPresignedUrl always uses real presigned URL
- Added deleteDirectory for batch R2 prefix deletion
- Added session auth + owner verification to /api/image (404 on mismatch)
- deleteDiary now cleans associated assets
- Changed SW /api/image to NetworkOnly
- Removed remote image domain from next.config

**Files:**
- src/lib/storage.ts
- src/app/api/image/route.ts
- src/lib/diary.ts
- src/sw.ts

**Flow:**
User requests -> auth check -> presigned URL or delete ops -> asset cleanup on diary delete

## Narrative
### Structure
Storage layer in src/lib/storage.ts uses AWS S3 SDK for R2 with path builders for markdown and assets under user/year/month. API route protects image access. SW caches selectively.

### Dependencies
Requires R2 env vars, Prisma for entries, Serwist for SW

### Highlights
Privacy: no public URLs, owner-only access via 404, time-bound presigned URLs, full asset cleanup on delete

## Facts
- **upsertDiary**: upsertDiary function handles create/update of diary entries using Prisma upsert on Entry model with fields: id, userId, date, title, preview, wordCount, hasImages, imageCount, markdownPath, tags
- **getEntries**: getEntries fetches paginated DiarySummary list for userId using Prisma findMany with cursor-based pagination, ordered by date desc, limit default 20
- **getEntry**: getEntry retrieves single entry markdown from storage and metadata from Prisma for given userId and entryId
- **deleteDiary**: deleteDiary removes entry from Prisma, deletes markdown via storage.deleteEntry, and removes assets directory via storage.deleteDirectory using year/month prefix
- **DiarySummary**: DiarySummary return type includes: id, date (YYYY-MM-DD), title, preview, hasImages, wordCount, tags (parsed JSON array), createdAt
- **r2_client**: R2 storage uses S3Client with custom endpoint and credentials from env vars R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- **path_building**: buildMarkdownPath and buildAssetPath construct user-specific paths under users/{userId}/entries/{year}/{month}/
- **presigned_url**: getPresignedUrl always generates signed URLs with 3600s default expiry, no public URL fallback
- **delete_directory**: deleteDirectory implements batch deletion via ListObjectsV2 + DeleteObjectsCommand for prefix-based cleanup
- **image_api_auth**: /api/image GET route enforces auth with getUser() and owner verification returning 404 on mismatch to avoid info leak
- **sw_caching**: SW /api/image uses NetworkOnly strategy for time-sensitive presigned URLs
- **privacy_fix**: Removed getImageUrl dead code and R2_PUBLIC_URL fallback for privacy
- **diary_cleanup**: deleteDiary now cleans up associated assets directory before deleting entry
- **config_cleanup**: Removed lingyin-r2.jerryiscat.one from next.config remote images

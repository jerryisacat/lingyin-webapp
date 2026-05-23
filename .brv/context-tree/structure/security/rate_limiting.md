---
title: Rate Limiting
summary: Upstash rate limiting with sliding window on 8 API endpoints, graceful Redis degradation (fail-open dev, fail-closed prod)
tags: []
related: []
keywords: []
createdAt: '2026-05-23T08:25:29.223Z'
updatedAt: '2026-05-23T08:25:29.223Z'
consolidated_at: '2026-05-23T18:01:05.545Z'
consolidated_from: [{date: '2026-05-23T18:01:05.545Z', path: structure/security/rate_limiting.abstract.md, reason: 'All three files cover identical topic (rate limiting) with high content overlap: main file contains full details, abstract and overview are condensed versions of the same changes and highlights.'}, {date: '2026-05-23T18:01:05.545Z', path: structure/security/rate_limiting.overview.md, reason: 'All three files cover identical topic (rate limiting) with high content overlap: main file contains full details, abstract and overview are condensed versions of the same changes and highlights.'}]
---
## Reason
Curate rate limiting implementation from context

## Raw Concept
**Task:**
Add rate limiting to all API endpoints

**Changes:**
- Implemented @upstash/ratelimit + @upstash/redis sliding window
- checkRateLimit() wrapper for graceful degradation
- Added rate-limit.ts unified module

**Files:**
- src/lib/rate-limit.ts

**Flow:**
request -> checkRateLimit() -> allow/deny with Redis sliding window

## Narrative
### Structure
Covers login, register, email, password reset, AI generate/rewrite/test endpoints (8 total)

### Highlights
Fail-open in development, fail-closed in production when Redis unavailable

## Facts
- **rate_limiting**: 全量 API 端点添加速率限制 — 使用 @upstash/ratelimit + @upstash/redis 实现 sliding window 速率限制，覆盖登录、注册、邮件发送、密码重置、AI 生成/改写/测试 8 个端点。通过 checkRateLimit() 包装器实现 Redis 不可用时的优雅降级（开发环境 fail-open，生产环境 fail-closed）。新增 rate-limit.ts 统一模块。 [project]

## Abstract
The document details Upstash rate limiting with sliding window applied to eight API endpoints and graceful Redis degradation that fails open in development and closed in production.

## Overview
- Key points: Upstash rate limiting with sliding window on 8 API endpoints (login, register, email, password reset, AI generate/rewrite/test); @upstash/ratelimit + @upstash/redis implementation; checkRateLimit() wrapper for graceful Redis degradation; fail-open in dev, fail-closed in prod; unified rate-limit.ts module added
- Structure / sections summary: Reason (curate implementation); Raw Concept (task, changes, files, flow); Narrative (Structure covering 8 endpoints, Highlights on degradation); Facts (Chinese/English summary of rate_limiting feature)
- Notable entities/patterns/decisions: rate_limiting feature; checkRateLimit() function; src/lib/rate-limit.ts; request -> checkRateLimit() -> allow/deny flow; sliding window pattern; environment-based Redis failure handling
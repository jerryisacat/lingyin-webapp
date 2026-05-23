---
title: Landing Page Refactor
summary: 'Landing page refactor: fixed brand/copy, added OSS/GitHub info, new use-case blocks, sticky glass navbar, Header useMemo, AES-256-GCM privacy, AppShell migration'
tags: []
related: [ui/landing/landing_page_and_auth_routing.md]
keywords: []
createdAt: '2026-05-23T10:37:15.680Z'
updatedAt: '2026-05-23T10:37:15.680Z'
consolidated_at: '2026-05-23T18:00:53.762Z'
consolidated_from: [{date: '2026-05-23T18:00:53.762Z', path: ui/landing/landing_page_refactor.abstract.md, reason: Abstract and overview are derived summaries (>70% overlap) of the detailed main file; merge into richest source to eliminate redundancy while preserving all unique details.}, {date: '2026-05-23T18:00:53.762Z', path: ui/landing/landing_page_refactor.overview.md, reason: Abstract and overview are derived summaries (>70% overlap) of the detailed main file; merge into richest source to eliminate redundancy while preserving all unique details.}]
---
## Reason
Document landing page UI/UX refactor changes

## Raw Concept
**Task:**
Landing Page 重构

**Changes:**
- 修复品牌名和文案硬伤
- Hero 加入开源/GitHub/Vibe Coding 信息
- 新增四个用例场景区块(追演出/旅行/日常/生活)
- 导航栏升级为 sticky top-4 毛玻璃悬浮卡片式
- Header 使用 useMemo 优化
- 禁用项处理(社交网络)
- FEATURES 隐私描述改为 AES-256-GCM 加密说明
- AppShell 从 NavBar 迁移到 Header

**Flow:**
refactor -> UI updates -> component migration

## Narrative
### Structure
Updates to landing page hero, navbar (sticky frosted glass), use-case sections, privacy copy, Header/AppShell structure

### Highlights
Improved visual polish with glassmorphism, better UX scenarios, security clarification

**Abstract Summary (consolidated):** The document details a landing page refactor that fixes branding/copy, adds OSS/GitHub info and four use-case blocks, upgrades the navbar to a sticky frosted-glass style, optimizes Header with useMemo, migrates AppShell, and clarifies privacy with AES-256-GCM encryption.

**Overview Key Points (consolidated):** 
- Key points: fixed brand/copy errors; added OSS/GitHub/Vibe Coding to Hero; introduced 4 use-case blocks (performance/travel/daily/life); upgraded navbar to sticky top-4 frosted-glass floating card; Header optimized via useMemo; switched FEATURES privacy text to AES-256-GCM; migrated AppShell from NavBar to Header
- Structure/sections summary: Reason (document changes); Raw Concept (task + detailed changes + refactor flow); Narrative (Structure of hero/navbar/use-cases/privacy/Header updates + Highlights on glassmorphism/UX/security)
- Notable entities/patterns/decisions: glassmorphism polish, component migration pattern, security clarification to AES-256-GCM, disabled social items, UI/UX refactor flow
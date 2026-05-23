# Phase 2 — 体验升级 实施计划

> **编写:** 2026-05-22
> **前置:** Phase 1 MVP 已完成（Auth.js v5, 基本日记 CRUD, PWA, 图片上传）
> **目标:** 补齐核心体验，让产品适合日常使用

---

## 总览

### Issues 清单

| # | 标题 | 优先级 | 范围 | 估算工作量 |
|---|------|--------|------|-----------|
| #43 | 🐛 AI 生成后上传的图片丢失 | **P1** | fullstack | 小 |
| #5 | 🎭 多语气切换（4 种） | **P1** | fullstack | 中 |
| #4 | ✏️ 编辑已保存日记 | **P1** | fullstack | 中 |
| #2 | 🗓️ 日历浏览 | **P1** | fullstack | 中 |
| #3 | 📹 视频上传 + 嵌入日记 | **P1** | fullstack | 大 |
| #6 | ☁️ 用户自有 S3 外部备份 | **P1** | backend | 大 |
| #7 | 📤 日记导出（MD/ZIP） | **P2** | backend | 中 |
| #8 | 🖼️ 图片灯箱 | **P2** | frontend | 小 |
| #9 | 🌙 夜间模式 | **P3** | frontend | 中 |

### 依赖关系

```
#43 (bug → 先修)
 |
 ├── #5 (多语气 ─ 独立)
 ├── #4 (编辑日记 ─ 独立)
 ├── #2 (日历 ─ 独立)
 │
 ├── #3 (视频 ─ 依赖 upload API, 可并行)
 ├── #6 (S3备份 ─ 依赖 storage 层, 可并行)
 ├── #7 (导出 ─ 依赖 R2, 可并行)
 │
 ├── #8 (灯箱 ─ 纯前端, 独立)
 └── #9 (夜间 ─ 纯前端, 独立)
```

### 执行批次

| 批次 | Issues | 策略 | 预估时间 |
|------|--------|------|---------|
| **Batch 1** | #43 | 先修 bug | ~15min |
| **Batch 2** | #5 + #4 | 并行（subagent） | ~1h |
| **Batch 3** | #2 + #8 | 并行（subagent） | ~1h |
| **Batch 4** | #3 + #6 + #7 | 并行（subagent） | ~2h |
| **Batch 5** | #9 | 可选（P3，时间不够可跳过） | ~45min |

**总估算:** ~5h (不含 #9 约 4h)

---

## Batch 1: #43 图片丢失 Bug

### 问题定位

`src/components/DiaryEditor.tsx` 中，`useStreamGenerate` hook 接收 `images` 参数，但 `POST /api/entries` 保存时只传了 `imagePaths`（图片的 R2 路径），而 AI 生成的 markdown 内容中图片引用（`![](描述)`）是纯描述文本，不包含真实图片 URL。

根因是 **AI 生成的 markdown 中图片占位符用的是文本描述而非实际图片 URL**，或者图片上传后的 URL 未正确注入到 prompt 中。

**排查路径:**
1. 检查 `useStreamGenerate` hook 是否将图片 URL 传给 generate API
2. 检查 `POST /api/ai/generate` 是否接收图片数据
3. 检查 `generateDiary()` 中 `describeImages()` 的输出是否被正确拼接到 user prompt

### 修复步骤

**Step 1:** 检查 `src/hooks/useStreamGenerate.ts` 中如何传图片给 API
**Step 2:** 检查 `src/app/api/ai/generate/route.ts` 中如何使用图片数据
**Step 3:** 确保 AI 生成的 markdown 中包含 `![](R2_URL)` 而非描述文本
**Step 4:** 修复后验证：上传图片 → 生成 → markdown 中包含图片

**分支:** `develop/issue-43`

---

## Batch 2: 核心体验（并行）

### Issue #5 — 多语气切换

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/lib/ai/prompts.ts` | 修改 | 新增 genki / minimal / literary 3 个 system prompt |
| `src/components/DiaryEditor.tsx` | 修改 | 输入区域增加 `ToneSelector`，选中后传给 API |
| `src/app/api/ai/generate/route.ts` | 修改 | body 接收 `tone` 参数，透传给 `generateDiary()` |
| `src/app/diary/page.tsx` | 修改 | 传递 `tone` 给 DiaryEditor |
| `src/app/settings/page.tsx` | 修改 | 新增「默认语气」设置项 |

#### 4 种语气 prompt 要点

| Tone | 风格 | 特点 |
|------|------|------|
| warm | 温暖姐姐 | 温柔细腻，如沐春风（已有） |
| genki | 元气少女 | 活泼可爱，多用「！～」和 emoji |
| minimal | 简约派 | 简洁克制，一针见血，不用形容词 |
| literary | 文艺风 | 诗意优美，像散文，多用比喻 |

**分支:** `develop/issue-5`

---

### Issue #4 — 编辑已保存日记

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/app/diary/[id]/page.tsx` | 修改 | 详情页增加编辑按钮 + 编辑模式 |
| `src/components/MarkdownViewer.tsx` | 修改 | 添加编辑按钮（如传入 onEdit） |
| `src/app/api/entries/[id]/route.ts` | 修改 | PUT handler: 接收 markdown → 写 R2 → 更新 DB |
| `src/lib/diary.ts` | 修改 | 新增 `updateEntry()` 方法 |

#### API 契约

```
PUT /api/entries/[id]
body: { markdown: string }
→ { ok: true, data: { id, preview, updatedAt } }
auth: session → 验证 entry.userId === session.userId
```

**分支:** `develop/issue-4`

---

## Batch 3: 浏览体验（并行）

### Issue #2 — 日历浏览

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/components/CalendarView.tsx` | 新建 | 日历组件，月历网格 + 日期标注 |
| `src/app/timeline/page.tsx` | 修改 | 新增列表/日历切换，渲染 CalendarView |
| `src/app/api/entries/route.ts` | 修改 | GET 增加 `?view=calendar` 查询模式 |

#### API 契约

```
GET /api/entries?view=calendar&year=2026&month=5
→ { entries: [{ id, date }] }
// 轻量查询，只从 DB 读 date 字段，不触发 R2
```

#### 组件规格

`CalendarView` 状态机: `loading → skeleton` / `loaded → 月历` / `empty → "这个月还没有日记～🌸"`

**分支:** `develop/issue-2`

---

### Issue #8 — 图片灯箱

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/components/Lightbox.tsx` | 新建 | 全屏灯箱：缩放、左右切换 |
| `src/components/MarkdownViewer.tsx` | 修改 | 图片点击 → openLightbox |

**分支:** `develop/issue-8`

---

## Batch 4: 存储与导出（并行）

### Issue #3 — 视频上传

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/components/PhotoUploader.tsx` | 修改 | 扩展为 `MediaUploader`，支持视频 |
| `src/app/api/upload/route.ts` | 修改 | 增加 video/mp4 等 MIME type |
| `src/components/MarkdownViewer.tsx` | 修改 | 支持渲染 `<video>` 标签 |
| `src/lib/ai/client.ts` | 修改 | 视频提取帧截图送 vision |

**分支:** `develop/issue-3`

---

### Issue #6 — 用户自有 S3 外部备份

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/lib/backup.ts` | 新建 | `BackupProvider` 接口 + `S3Backup` 实现 |
| `src/app/settings/page.tsx` | 修改 | 新增 backup 配置区域 |
| `src/lib/diary.ts` | 修改 | 保存后异步触发 backup |
| `prisma/schema.prisma` | 修改 | User 表新增 backup 配置字段 |

**分支:** `develop/issue-6`

---

### Issue #7 — 日记导出

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `src/app/api/export/route.ts` | 新建 | GET 导出接口 |
| `src/app/diary/[id]/page.tsx` | 修改 | 单篇导出按钮 |
| `src/app/timeline/page.tsx` | 修改 | 全部导出按钮 |
| `src/lib/diary.ts` | 修改 | 新增导出方法|

**分支:** `develop/issue-7`

---

## Batch 5: 夜间模式（可选）

### Issue #9 — 暗色主题

#### 改动文件

| 文件 | 操作 | 改动说明 |
|------|------|---------|
| `tailwind.config.ts` | 修改 | `darkMode: "class"` |
| `src/app/globals.css` | 修改 | CSS 变量 dark 色板 |
| `src/app/layout.tsx` | 修改 | 注入 blocking script 防 FOUC |
| `src/app/settings/page.tsx` | 修改 | 外观设置 |
| 各组件 | 修改 | 硬编码色 → CSS 变量 / `dark:` 前缀 |

**分支:** `develop/issue-9`

---

## 文件冲突矩阵

以下文件被多个 Issue 涉及，实施时需注意合并冲突：

| 文件 | 涉及 Issue |
|------|-----------|
| `src/components/MarkdownViewer.tsx` | #3, #8 |
| `src/lib/diary.ts` | #3, #4, #6, #7 |
| `src/app/timeline/page.tsx` | #2, #7 |
| `src/app/diary/[id]/page.tsx` | #4, #7 |
| `src/app/settings/page.tsx` | #5, #6, #9 |

**建议实施顺序（按分支 merge 顺序）:**
1. 先合 #5（settings.tsx 新增默认语气）
2. 再合 #6（settings.tsx 新增 backup 配置）
3. 再合 #9（settings.tsx 新增外观设置）

这样可以避免多个分支同时改 `settings/page.tsx` 导致冲突。

---

## 风险点

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 视频上传 Vercel 超时 | 中 | 高 | 分片上传，函数 timeout 设 60s |
| ffmpeg 在 Vercel 不可用 | 高 | 中 | 改纯前端取视频第一帧 |
| S3 兼容性（MinIO/R2 差异） | 中 | 中 | 统一用 `@aws-sdk/client-s3` v3 |
| #43 bug 修复后发现更多图片问题 | 中 | 中 | 加 e2e 测试覆盖上传→生成→保存链路 |
| 夜间模式 FOUC 白屏闪烁 | 低 | 高 | blocking script + `<meta>` 双重保障 |

---

## 工作流

每一个 Issue 按以下流程：
1. `git checkout -b develop/issue-N main`
2. 实现 → `npx tsc --noEmit` 零错误
3. 更新 `CHANGELOG.md`
4. `git add && git commit && git push origin develop/issue-N`
5. `gh issue comment N --body "完成"` + `gh pr create`
6. 等待你 review 后手动 merge

---

**准备好了就从 Batch 1（#43 bug）开始推，还是想先看某个 Issue 的详细 task 分解？**

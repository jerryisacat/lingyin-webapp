# Changelog

本文档记录所有变更的日期、内容及因果链。

---

## 2026-05-20

### 存储：Supabase Storage → CloudFlare R2
- **内容**：将所有文档中的存储后端从 Supabase Storage 切换为 CloudFlare R2（S3 兼容，`@aws-sdk/client-s3`）
- **因果链**：用户决定利用 R2 的零出站费特性降低长期成本 → 搜索并替换了 8 个文件（AGENTS.md, docs/02-07, docs/01, README.md）
- **影响文件**：AGENTS.md, docs/01-PRD.md, docs/02-技术架构.md (v1.2), docs/03-Phase1-MVP说明.md, docs/04-Phase2到4路线图.md, docs/05-数据模型.md (v1.2), docs/07-商业化方案.md, README.md, .env.example（新建）

### 前后端分离评估
- **内容**：评估了 CF Pages（前端）+ Vercel（API）方案的可行性，记录在 AGENTS.md 和 docs/02 §2.5
- **因果链**：用户要求评估前后端分离 → 分析发现 Auth cookie 跨域、CORS 延迟、CF Workers 不支持 Prisma TCP 三大阻塞点 → 决定 Phase 1 保持 Vercel 单体部署
- **影响文件**：AGENTS.md, docs/02-技术架构.md

### TypeScript 类型清理（docs/05）
- **内容**：删除重复的 `DiaryEntry`/`DiarySummary` 定义，移除 `StorageConfig`、`videos`/`hasVideos`（Phase 2 内容），新增 `LocalApiKeyStore`
- **因果链**：审计发现 docs/05 有两套重复定义且包含过时的 StorageConfig → 去重并清理
- **影响文件**：docs/05-数据模型.md

### 文档补充：RLS + Auth Session + API Key 守卫 + Prisma-User 同步
- **内容**：扩充 AGENTS.md 和 docs/02，新增 RLS 策略 SQL、`@supabase/ssr` session 管理三层方案、API Key 守卫逻辑、Database Trigger 用户同步方案
- **因果链**：审计指出安全架构缺口（行 505）→ 逐一补充到权威文档中
- **影响文件**：AGENTS.md, docs/02-技术架构.md

### 环境变量参考表
- **内容**：在 docs/02 §7 新增完整的 13 个环境变量表，标注每个变量的用途、获取方式、使用位置
- **因果链**：审计指出环境变量命名不一致 → 集中整理为标准参考表
- **影响文件**：docs/02-技术架构.md

### 架构图 + 定价表修复
- **内容**：清除 docs/02 架构图中的 `<late>` 残留标签；修复 docs/07 定价表中 HTML 错位
- **因果链**：审计发现格式损坏 → 重写相关内容
- **影响文件**：docs/02-技术架构.md, docs/07-商业化方案.md

### README.md 扩展
- **内容**：从 2 行扩展为含 Tech Stack、安装步骤、环境变量说明、全部文档链接的结构化 README
- **因果链**：审计指出 README 对协作者无帮助 → 补充完整
- **影响文件**：README.md

### 新建 .env.example + .gitignore
- **内容**：创建 `.env.example`（13 个变量 + 注释来源）、`.gitignore`（Next.js 标准 + `data/` + Prisma）
- **因果链**：审计缺失 → 新建
- **影响文件**：.env.example（新建）, .gitignore（新建）

### Phase 2 "S3 存储" 功能改名
- **内容**：将 Phase 2 的 "S3 存储" 功能改为 "外部备份"（用户绑定自己的 S3 作为备份，非主存储）
- **因果链**：存储方案切换为 R2 后，"S3 存储" 的原始含义（用户可选 S3/local 主存储）已过时 → 重新定义为可选的用户自有备份
- **影响文件**：docs/04-Phase2到4路线图.md, docs/01-PRD.md, docs/03-Phase1-MVP说明.md

### 添加开发里程碑（8 个 Stage）
- **内容**：在 AGENTS.md 中加入完整的 Phase 1 MVP 8 阶段开发计划，按 vibe coding 优化（每个 Stage ≤120K token 上下文），标注 ■ 决策点
- **因果链**：用户要求设计 AI 友好的分阶段开发计划 → 按依赖关系和代码量将 12 个任务拆分为 8 个自包含 Stage
- **影响文件**：AGENTS.md

### CHANGELOG.md 规则
- **内容**：在 AGENTS.md Conventions 中新增：每次修改必须记录到 CHANGELOG.md（日期 + 内容 + 因果链）
- **因果链**：用户要求 → 添加为全局规范并创建本文件
- **影响文件**：AGENTS.md, CHANGELOG.md（本文件）

# 玲音日記 · LINGYIN

<p align="center">
  <img src="public/icons/icon-192.png" alt="玲音日記" width="96" height="96" />
</p>

<p align="center">
  <strong>AI 搭載の日記 PWA。一日の出来事を話すだけで、AI が美しい日記に仕上げます。</strong>
</p>

<p align="center">
  <a href="https://lingyindiary.app">lingyindiary.app</a>
</p>

<p align="center">
  <a href="#玲音日記とは">概要</a> ·
  <a href="#機能">機能</a> ·
  <a href="#クイックスタート">クイックスタート</a> ·
  <a href="#デプロイ">デプロイ</a> ·
  <a href="#アーキテクチャ">アーキテクチャ</a> ·
  <a href="#ロードマップ">ロードマップ</a>
</p>

<p align="center">
  <sub>🇬🇧 <a href="README.md">English</a> · 📖 <a href="README_CN.md">中文</a></sub>
</p>

---

## 玲音日記とは？

玲音日記（LINGYIN Diary）は、オープンソースの AI 日記アプリです。日常の出来事を自分の言葉で語り、写真をアップロードし、思いついたことを書き留めるだけで、大規模言語モデルが洗練された日記エントリに変換します。

- 🧠 **AI による文章生成** — 自然で温かみのある Markdown 形式の日記
- 📷 **写真から文章へ** — 画像をアップロードすると、AI が情景を分析しストーリーに織り込みます
- 📱 **PWA 対応** — オフラインでも動作、ホーム画面にインストール可能
- 🔐 **暗号化された API キー** — AES-256-GCM でサーバー側に暗号化保存、ブラウザに露出しません
- 🪄 **Markdown エディタ** — 保存前に AI の出力を微調整可能
- 🕰️ **タイムライン** — プレビュースニペット付きで日記履歴を閲覧
- ✉️ **メール＋パスワード認証** — 独立したアカウントシステム、メール確認とパスワードリセット対応

## 機能

| 機能 | 状態 |
|------|------|
| AI 日記生成（テキスト＋画像） | ✅ Phase 1 |
| プレビュー付き Markdown エディタ | ✅ Phase 1 |
| 画像アップロード＋AI ビジョン説明 | ✅ Phase 1 |
| PWA インストール（オフライン対応） | ✅ Phase 1 |
| メール／パスワードログイン＋パスワードリセット | ✅ Phase 1 |
| Resend 経由のメール確認 | ✅ Phase 1 |
| サーバー側暗号化 API キー（AES-256-GCM） | ✅ Phase 1 |
| 複数 LLM プロバイダー（OpenAI／DeepSeek／Gemini） | ✅ Phase 1 |
| カレンダービュー | 🗓️ Phase 2 |
| 動画アップロード | 📹 Phase 2 |
| 保存済み日記の編集 | ✏️ Phase 2 |
| ダークモード | 🌙 Phase 2 |
| エクスポート（MD／PDF／ZIP） | 📤 Phase 2 |
| サブスクリプション課金 | 💳 Phase 3 |
| 管理ダッシュボード | 🛠️ Phase 3 |
| 日記の公開共有 | 🌐 Phase 4 |
| ネイティブモバイルアプリ | 📱 Phase 4 |

完全なロードマップ：[GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues)

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | [Next.js 14+](https://nextjs.org/) (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | [Supabase](https://supabase.com/) PostgreSQL |
| 認証 | [Auth.js v5](https://authjs.dev/) (Credentials + JWT) |
| メール | [Resend](https://resend.com/) |
| ORM | [Prisma](https://www.prisma.io/) |
| ファイルストレージ | [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) (S3 互換) |
| LLM SDK | `openai`（OpenAI／DeepSeek／Gemini 互換） |
| PWA | [Serwist](https://serwist.pages.dev/) |
| デプロイ | [Vercel](https://vercel.com/) |

## アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│                   ブラウザ (PWA)                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ 日記編集  │  │   設定    │  │  タイムライン      │ │
│  │          │  │ (API Key) │  │  (日記プレビュー)  │ │
│  └────┬─────┘  └───────────┘  └─────────┬─────────┘ │
│       │                                  │           │
│       │      Auth.js JWT セッション      │           │
└───────┼──────────────────────────────────┼───────────┘
        │                                  │
   ┌────▼──────────────────────────────────▼─────────┐
   │              Next.js API Routes                  │
   │  /api/ai/generate   /api/entries   /api/upload   │
   │       │                                       │
   │       │ getUserDecryptedApiKey(userId, provider)│
   └───────┼──────────────────────────────────┬──────┘
           │              │                   │
   ┌───────▼──────┐  ┌────▼────────┐  ┌───────▼──────┐
   │   LLM API   │  │ PostgreSQL  │  │  CloudFlare  │
   │  (OpenAI /  │  │ (認証 +     │  │  R2 (日記    │
   │  DeepSeek / │  │  メタデータ │  │  + 画像)     │
   │  Gemini)    │  │  + API Key) │  │              │
   └──────────────┘  └─────────────┘  └──────────────┘
```

**主要な設計判断：**

- **コンテンツとメタデータの分離：** 日記本文は R2 に保存し、メタデータ（タイトル、日付、プレビュー、文字数）のみ PostgreSQL に保存。高速クエリ、低コスト。
- **サーバー側暗号化 API キー：** キーは AES-256-GCM で暗号化され PostgreSQL に保存。リクエストごとにメモリ内で復号し LLM プロバイダーに転送。ブラウザへの露出なし、ログ記録なし。
- **Auth.js v5 独立認証：** メール＋パスワードログイン、JWT セッション。外部認証プロバイダーへの依存なし。
- **署名付き URL：** R2 バケットは非公開。全ファイルアクセスは短期間の署名付き URL を使用。
- **1日1エントリ：** `@@unique([userId, date])` 制約 — ユーザーは1日1つの日記エントリのみ。

## クイックスタート

### 前提条件

- Node.js 20+
- npm 10+
- PostgreSQL データベース（例：[Supabase](https://supabase.com) 無料プラン）
- [CloudFlare R2](https://www.cloudflare.com/developer-platform/r2/) バケット（無料枠：10 GB）
- [Resend](https://resend.com) アカウント（無料枠：100通/日）
- 以下のいずれかの API キー：[OpenAI](https://platform.openai.com/)、[DeepSeek](https://platform.deepseek.com/)、[Google AI](https://aistudio.google.com/)

### 1. クローンとインストール

```bash
git clone https://github.com/jerryisacat/lingyin-webapp.git
cd lingyin-webapp
npm install
```

### 2. PostgreSQL のセットアップ

PostgreSQL データベースを作成します。Supabase（データベースのみ、Auth 不要）、Neon、その他 PostgreSQL プロバイダーを使用できます。

接続文字列を取得：
```
postgresql://postgres:<password>@<host>:5432/postgres
```

### 3. CloudFlare R2 のセットアップ

1. R2 バケットを作成（例：`lingyin-webapp`）
2. **Object Read & Write** 権限で API トークンを生成
3. `Access Key ID`、`Secret Access Key`、エンドポイント URL を控える

### 4. 暗号鍵の生成

```bash
openssl rand -hex 32  # AUTH_SECRET（JWT 署名用）
openssl rand -hex 32  # API_KEY_ENCRYPTION_KEY（API Key 暗号化用）
```

### 5. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
DATABASE_URL="postgresql://postgres:...@host:5432/postgres"
AUTH_SECRET="<手順4で生成した64桁の16進数>"
AUTH_URL="http://localhost:3000"
API_KEY_ENCRYPTION_KEY="<手順4で生成した64桁の16進数>"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@lingyindiary.app"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_BUCKET="lingyin-webapp"
```

### 6. データベースの初期化と起動

```bash
npx prisma db push
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

## デプロイ（Vercel）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jerryisacat/lingyin-webapp)

手動デプロイ：

1. このリポジトリを GitHub にプッシュ
2. [Vercel](https://vercel.com/new) でリポジトリをインポート
3. **Build Command** を `npx prisma generate && next build` に設定
4. **Region** を `Hong Kong (hkg1)` に設定
5. Vercel → Settings → Environment Variables に全環境変数を追加
6. デプロイ

詳細は [docs/deploy.md](docs/deploy.md) を参照。

### Vercel 環境変数チェックリスト

| 変数 | 必須 | 備考 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 接続文字列 |
| `AUTH_SECRET` | ✅ | JWT 署名鍵（64桁の16進数） |
| `AUTH_URL` | ✅ | `https://your-domain.vercel.app` |
| `API_KEY_ENCRYPTION_KEY` | ✅ | API Key 暗号化鍵 — **必ずバックアップ** |
| `RESEND_API_KEY` | ✅ | Resend API キー |
| `EMAIL_FROM` | ✅ | 認証済み送信者アドレス |
| `NEXT_PUBLIC_APP_URL` | ✅ | AUTH_URL と同じ |
| `R2_ACCESS_KEY_ID` | ✅ | |
| `R2_SECRET_ACCESS_KEY` | ✅ | |
| `R2_ENDPOINT` | ✅ | |
| `R2_BUCKET` | ✅ | |

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router ページ
│   ├── diary/              # 日記エディタ＋詳細
│   ├── login/              # メール／パスワードログイン
│   ├── register/           # ユーザー登録
│   ├── verify-email/       # メール確認
│   ├── forgot-password/    # パスワードリセットリクエスト
│   ├── reset-password/     # 新しいパスワード設定
│   ├── settings/           # API キー設定
│   ├── timeline/           # タイムライン閲覧
│   └── api/                # API ルート
│       ├── auth/           # 認証（登録／確認／リセット）
│       ├── ai/             # AI 生成（SSE ストリーミング）
│       ├── entries/        # 日記 CRUD
│       ├── upload/         # 画像アップロード
│       ├── image/          # 署名付き URL プロキシ
│       └── user/           # ユーザー設定＋API キー管理
├── components/             # 共有 UI コンポーネント
│   └── auth/               # PasswordInput, VerifyEmailBanner
├── hooks/                  # React hooks (useApiKeys, useStreamGenerate)
├── lib/                    # コアロジック
│   ├── auth.ts             # Auth.js v5 設定
│   ├── auth-helpers.ts     # セッションヘルパー
│   ├── auth-service.ts     # 登録／確認／リセットロジック
│   ├── crypto.ts           # AES-256-GCM 暗号化／復号
│   ├── email.ts            # Resend メール送信
│   ├── api-helpers.ts      # API ユーティリティ
│   ├── api-key-guard.ts    # API キー取得＋復号
│   ├── ai/                 # LLM クライアント＋プロンプト
│   ├── storage.ts          # R2 S3 操作
│   ├── diary.ts            # 日記 CRUD ヘルパー
│   └── db.ts               # Prisma クライアント
├── middleware.ts            # Auth.js ルート保護
└── types/                  # TypeScript 型定義

prisma/
└── schema.prisma           # データベーススキーマ

docs/                       # アーキテクチャドキュメント（中国語）
```

## ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [docs/01-PRD.md](docs/01-PRD.md) | 製品要件定義書（中国語） |
| [docs/02-技术架构.md](docs/02-技术架构.md) | 技術アーキテクチャ（中国語） |
| [docs/05-数据模型.md](docs/05-数据模型.md) | データモデル＆Prisma スキーマ（中国語） |
| [docs/deploy.md](docs/deploy.md) | デプロイガイド（中国語） |
| [AGENTS.md](AGENTS.md) | エージェントワークフロー＆規約 |
| [CHANGELOG.md](CHANGELOG.md) | 変更履歴 |

## ロードマップ

玲音日記はフェーズに分けて開発されています。今後の作業はすべて [GitHub Issues](https://github.com/jerryisacat/lingyin-webapp/issues) で管理：

| フェーズ | フォーカス | 状態 |
|----------|-----------|------|
| **1 — MVP** | AI 日記、エディタ、PWA、認証、暗号化 API キー | ✅ 完了 |
| **2 — UX** | カレンダー、動画、ダークモード、エクスポート | 🚧 計画中 |
| **3 — 収益化** | サブスクリプション、管理ダッシュボード | 📋 計画中 |
| **4 — プラットフォーム** | 共有、統計、ネイティブアプリ | 📋 計画中 |

## プライバシーとセキュリティ

- **API キーはサーバー側で暗号化。** PostgreSQL に AES-256-GCM で保存。リクエストごとにメモリ内で復号し LLM プロバイダーに転送。ログ記録なし、ブラウザ露出なし。
- **独立した認証システム。** Auth.js v5 + bcrypt パスワードハッシュ。外部認証サービスへの依存なし。
- **日記コンテンツは R2 に保存。** データベースにはメタデータ（日付、タイトル、文字数）のみ保存。
- **署名付き URL。** 画像は短期の署名付き URL で提供。パブリックバケットアクセスなし。
- **ユーザースコープのクエリ。** 全データベースクエリは `getSessionUserId()` で認証ユーザーに制限。

完全なセキュリティモデルは [docs/02-技术架构.md](docs/02-技术架构.md) を参照（中国語）。

## コントリビューション

玲音日記は活発に開発中です。Issue、機能リクエスト、Pull Request を歓迎します！

1. [open issues](https://github.com/jerryisacat/lingyin-webapp/issues) を確認 — 選択するか新規 Issue を提案
2. `main` からブランチを作成：`git checkout -b feature/your-feature`
3. [AGENTS.md](AGENTS.md) の規約に従って変更
4. `npx tsc --noEmit` を実行して TypeScript エラーがないことを確認
5. プッシュして Pull Request を作成

大きな変更の場合は、まず Issue で議論してください。

## ライセンス

[MIT](LICENSE) © 2026 玲音日記 Contributors
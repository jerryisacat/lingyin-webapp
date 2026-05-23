# 玲音日记 (lingyin-webapp) 审计修复方案

**对应审计报告：** `docs/audit-report.md`  
**创建日期：** 2026-05-23  
**最后更新：** 2026-05-23

---

## 前置决策

以下决策已于 2026-05-23 确认，影响本方案的多个修复项：

| # | 决策项 | 结论 | 影响范围 |
|---|--------|------|----------|
| 1 | Next.js 升级方案 | **锁 14.x 最新 patch**（非 15.x） | P0-1 |
| 2 | CSP 外部域名 | 无额外域名（Vercel Analytics 走同源） | P1-2 |
| 3 | Vercel 环境变量 | 已全部配齐（R2、Redis、Resend 等） | P3-4 |
| 4 | Vercel 套餐 | **Hobby 版**（函数超时 10s） | P1-6 |
| 5 | AppShell 认证方式 | **保留 SSR session 传递**（不切换纯 client-side） | P2-4 |

---

## P0 — 立即修复（1-3 天）

### P0-1 升级 Next.js 修复已知 CVE

> **决策：** 锁 14.x 最新 patch 版本，避免 15.x breaking changes 风险。

**涉及文件：** `package.json`

```diff
- "next": "^14.2.0",
+ "next": "^14.3.0",
```

然后执行：

```bash
npm install
```

> **注：** 若 14.x 最新 patch 仍无法覆盖全部 CVE（部分修复仅在 15.x），需后续升级到 15.x。届时配合 `npx @next/codemod@latest upgrade .` 自动迁移。

---

### P0-2 创建全局错误边界层

**新建文件：`src/app/error.tsx`**

```tsx
"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-ink">出错了</h1>
      <p className="text-sm text-ink/60">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "页面遇到了意外错误，请稍后重试"}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-sakura px-6 py-2 text-sm text-white transition hover:opacity-90"
      >
        重试
      </button>
    </div>
  )
}
```

**新建文件：`src/app/not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold text-sakura">404</h1>
      <p className="text-ink/60">页面不存在</p>
    </div>
  )
}
```

**新建文件：`src/app/loading.tsx`**

```tsx
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sakura border-t-transparent" />
    </div>
  )
}
```

**新建文件：`src/app/diary/[id]/loading.tsx`**

```tsx
export default function DiaryLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sakura border-t-transparent" />
    </div>
  )
}
```

**新建文件：`src/app/timeline/loading.tsx`**

```tsx
export default function TimelineLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-warm-white/50"
        />
      ))}
    </div>
  )
}
```

---

### P0-3 添加关键路径测试

**安装测试依赖：**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**新建文件：`vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**新建文件：`src/lib/__tests__/crypto.test.ts`**

```ts
import { describe, it, expect } from "vitest"

// Mock env before import
process.env.API_KEY_ENCRYPTION_KEY = "a".repeat(64)

const { encryptApiKey, decryptApiKey } = await import("../crypto")

describe("crypto", () => {
  it("encrypt and decrypt round-trip", () => {
    const plaintext = "sk-or-v1-test-key-12345"
    const encrypted = encryptApiKey(plaintext)
    expect(encrypted).not.toBe(plaintext)
    const decrypted = decryptApiKey(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it("produces different ciphertexts for same plaintext", () => {
    const a = encryptApiKey("same-key")
    const b = encryptApiKey("same-key")
    expect(a).not.toBe(b) // different IV
  })

  it("throws on missing key", () => {
    delete process.env.API_KEY_ENCRYPTION_KEY
    expect(() => encryptApiKey("test")).toThrow()
  })
})
```

**新建文件：`src/lib/__tests__/auth-service.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import bcrypt from "bcryptjs"

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}))

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

const { registerUser, verifyEmail, resetPassword } = await import("../auth-service")
const { prisma } = await import("@/lib/db")

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects short password", async () => {
    const result = await registerUser({
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    })
    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("error")
  })

  it("rejects mismatched passwords", async () => {
    const result = await registerUser({
      email: "test@example.com",
      password: "123456789012",
      confirmPassword: "different1234",
    })
    expect(result.ok).toBe(false)
  })

  it("rejects invalid email", async () => {
    const result = await registerUser({
      email: "not-an-email",
      password: "123456789012",
      confirmPassword: "123456789012",
    })
    expect(result.ok).toBe(false)
  })

  it("registers successfully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as never)

    const result = await registerUser({
      email: "test@example.com",
      password: "123456789012",
      confirmPassword: "123456789012",
    })
    expect(result.ok).toBe(true)
  })
})
```

在 `package.json` 添加测试脚本：

```diff
"scripts": {
+  "test": "vitest run",
+  "test:watch": "vitest",
   "dev": "next dev",
```

---

### P0-4 修复 `AUTH_SECRET` 生产环境校验

**文件：`src/lib/auth.ts:11-16`**

```diff
-if (!process.env.AUTH_SECRET) {
-  if (process.env.NODE_ENV === "production") {
-    throw new Error("AUTH_SECRET environment variable is required")
-  }
-  console.warn("⚠ AUTH_SECRET not set — using random secret (sessions will be invalidated on restart)")
-}
+if (!process.env.AUTH_SECRET) {
+  if (process.env.NODE_ENV === "production") {
+    throw new Error("AUTH_SECRET environment variable is required")
+  }
+  throw new Error("AUTH_SECRET environment variable is required (set it in .env.local)")
+}
```

---

## P1 — 本周内修复（1 周）

### P1-1 API 限流全覆盖

**新建文件：`src/lib/rate-limit.ts` — 在现有基础上追加：**

```ts
export const rateLimiters = {
  // ...existing...
  entriesRead: createLimiter(30, "1 m"),
  entriesWrite: createLimiter(20, "1 m"),
  userConfig: createLimiter(10, "1 m"),
  encryptionPassword: createLimiter(5, "5 m"),
  apiKeyWrite: createLimiter(5, "5 m"),
  uploadImage: createLimiter(10, "1 m"),
  imageProxy: createLimiter(30, "1 m"),
  stats: createLimiter(10, "1 m"),
  migrate: createLimiter(10, "1 m"),
  verifyEmail: createLimiter(10, "1 m"),
}
```

**文件：`src/app/api/entries/route.ts` — 在 GET 函数开头添加：**

```typescript
import { checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"
import { getClientIP } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return jsonError("Unauthorized", 401)

  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.entriesRead, ip)
  if (!success) return rateLimitError(reset)

  // ...existing code...
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return jsonError("Unauthorized", 401)

  const { success, reset } = await checkRateLimit(rateLimiters.entriesWrite, user.id)
  if (!success) return rateLimitError(reset)

  // ...existing code...
}
```

**同理应用于：**
- `src/app/api/user/config/route.ts` → `rateLimiters.userConfig`
- `src/app/api/user/encryption-password/route.ts` → `rateLimiters.encryptionPassword`
- `src/app/api/user/api-keys/route.ts` → `rateLimiters.apiKeyWrite`
- `src/app/api/upload/route.ts` → `rateLimiters.uploadImage`
- `src/app/api/image/route.ts` → `rateLimiters.imageProxy`
- `src/app/api/stats/route.ts` → `rateLimiters.stats`
- `src/app/api/diary/migrate-encrypt/route.ts` → `rateLimiters.migrate`
- `src/app/api/diary/migrate-status/route.ts` → `rateLimiters.migrate`

---

### P1-2 添加 CSP Header

> **决策：** Vercel Analytics（`@vercel/analytics`）的脚本和数据上报走同源路径，无需额外 CSP 放行。仅需放行 OpenRouter API 和 R2 存储。

**文件：`next.config.mjs`**

```diff
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
+           {
+             key: "Content-Security-Policy",
+             value: [
+               "default-src 'self'",
+               "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
+               "style-src 'self' 'unsafe-inline'",
+               "img-src 'self' https://*.r2.cloudflarestorage.com data:",
+               "connect-src 'self' https://openrouter.ai",
+               "font-src 'self'",
+               "manifest-src 'self'",
+             ].join("; "),
+           },
          ],
        },
      ]
    },
```

---

### P1-3 图片上传 Magic Bytes 校验

**文件：`src/app/api/upload/route.ts`**

```diff
 const EXT_MAP: Record<string, string> = {
   "image/jpeg": "jpg",
   "image/png": "png",
   "image/webp": "webp",
 };
 
+const MAGIC_BYTES: Record<string, number[]> = {
+  jpg: [0xff, 0xd8, 0xff],
+  png: [0x89, 0x50, 0x4e, 0x47],
+  webp: [0x52, 0x49, 0x46, 0x46],
+};
+
 const ALLOWED_TYPES = Object.keys(EXT_MAP);
 const MAX_SIZE = 10 * 1024 * 1024;
 
+function validateMagicBytes(buffer: Buffer, ext: string): boolean {
+  const expected = MAGIC_BYTES[ext]
+  if (!expected) return false
+  return expected.every((byte, i) => buffer[i] === byte)
+}
+
 export async function POST(request: NextRequest) {
   // ...existing auth and formData code...

   const ext = EXT_MAP[file.type];
   const filename = generateFilename(ext);
   const buffer = Buffer.from(await file.arrayBuffer());
 
+  if (!validateMagicBytes(buffer, ext)) {
+    return jsonError("File content does not match declared type")
+  }
 
   const mediaFile = await uploadImage(
     user.id,
     buffer,
     filename,
     file.type
   );
```

---

### P1-4 修复 `Tone` Schema 与类型不一致

**文件：`src/lib/validations.ts:25`**

```diff
-const VALID_TONES = ["warm"] as const;
+const VALID_TONES = ["warm", "genki", "minimal", "literary"] as const;
```

**文件：`src/types/index.ts:1`**

```diff
-export type Tone = "warm" | "genki" | "minimal" | "literary";
+import { z } from "zod"
+// Tone type is derived from the Zod schema to keep a single source of truth
+export type Tone = "warm" | "genki" | "minimal" | "literary"
```

---

### P1-5 修复 `ai/rewrite` 硬编码 tone

**文件：`src/app/api/ai/rewrite/route.ts`**

```diff
-import { WARM_SYSTEM_PROMPT } from "@/lib/ai/prompts";
+import {
+  WARM_SYSTEM_PROMPT,
+  GENKI_SYSTEM_PROMPT,
+  MINIMAL_SYSTEM_PROMPT,
+  LITERARY_SYSTEM_PROMPT,
+} from "@/lib/ai/prompts";
+import type { Tone } from "@/types";
+import { prisma } from "@/lib/db";
+
+const TONE_PROMPTS: Record<Tone, string> = {
+  warm: WARM_SYSTEM_PROMPT,
+  genki: GENKI_SYSTEM_PROMPT,
+  minimal: MINIMAL_SYSTEM_PROMPT,
+  literary: LITERARY_SYSTEM_PROMPT,
+}
```

在函数体中：

```diff
-  const systemPrompt = WARM_SYSTEM_PROMPT;
+  const dbUser = await prisma.user.findUnique({
+    where: { id: user.id },
+    select: { tone: true },
+  })
+  const tone = (dbUser?.tone ?? "warm") as Tone
+  const systemPrompt = TONE_PROMPTS[tone]
```

---

### P1-6 SSE 流添加超时与客户端断开处理

> **决策：** Vercel Hobby 版函数超时仅 10s，AI 生成超时设为 8s（留 2s buffer）。建议后续升级 Pro 或将 AI 路由切到 Edge Functions。

**文件：`src/app/api/ai/generate/route.ts:56-76`**

```diff
   const stream = new ReadableStream({
     async start(controller) {
+      let aborted = false
+
+      // Listen for client disconnect
+      request.signal?.addEventListener("abort", () => {
+        aborted = true
+        controller.close()
+      })
+
+      // Global timeout (8s for Vercel Hobby, leaves 2s buffer)
+      const timeout = setTimeout(() => {
+        if (!aborted) {
+          controller.enqueue(
+            encoder.encode(`data: ${JSON.stringify({ error: "生成超时，请稍后重试" })}\n\n`)
+          )
+          controller.close()
+        }
+      }, 8_000)
+
       try {
         for await (const chunk of generator) {
+          if (aborted) break
           controller.enqueue(
             encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
           );
         }
+        if (!aborted) {
           controller.enqueue(encoder.encode("data: [DONE]\n\n"));
+        }
       } catch (error) {
         console.error("[AI Generate] stream error:", error instanceof Error ? error.message : error);
+        if (!aborted) {
           controller.enqueue(
             encoder.encode(`data: ${JSON.stringify({ error: "生成失败，请稍后再试" })}\n\n`)
           );
+        }
       } finally {
+        clearTimeout(timeout)
         controller.close();
       }
     },
   });
```

**同样的修改应用于 `src/app/api/ai/rewrite/route.ts:51-74`**

---

### P1-7 `verify-email` 添加速率限制

**文件：`src/app/api/auth/verify-email/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyEmail } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.verifyEmail, ip)
  if (!success) return rateLimitError(reset)

  const token = request.nextUrl.searchParams.get("token")
  // ...existing code...
}
```

---

### P1-8 缩短 Presigned URL 有效期

**文件：`src/lib/storage.ts:59`**

```diff
-export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
+export async function getPresignedUrl(key: string, expiresIn = 300): Promise<string> {
```

**文件：`src/app/api/image/route.ts:28`**

```diff
-    const signedUrl = await getPresignedUrl(key, 3600);
+    const signedUrl = await getPresignedUrl(key);
```

---

## P2 — 下个 Sprint（2 周）

### P2-1 加密密码变更时添加防护

**文件：`src/app/api/user/encryption-password/route.ts`**

在 PUT handler 中添加旧密码验证：

```typescript
// Add to imports
import { verifyEncryptionPasswordSchema } from "@/lib/validations"

// Add to the schema definition
const changeEncryptionPasswordSchema = z.object({
  oldPassword: z.string().min(1, "请输入旧密码"),
  newPassword: z
    .string()
    .min(8, "加密密码至少需要 8 位")
    .regex(/[a-zA-Z]/, "密码需包含字母")
    .regex(/[0-9]/, "密码需包含数字"),
})

// In the PUT handler:
const parseResult = changeEncryptionPasswordSchema.safeParse(rawBody)
// ...verify oldPassword against existing encryptionPasswordHash...
// ...throw 401 if invalid...
// Then proceed with generating new salt and hash
```

---

### P2-2 实现 `forgot-encryption-password` 页面

**文件：`src/app/forgot-encryption-password/page.tsx`**

替换 TODO 注释为完整内容：

```tsx
"use client"

import Link from "next/link"

export default function ForgotEncryptionPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-2xl border border-sakura/20 bg-white p-8 shadow-sm max-w-md">
        <h1 className="text-xl font-semibold text-ink">加密密码不可恢复</h1>

        <div className="mt-4 space-y-3 text-sm text-ink/60">
          <p>
            玲音日记采用<strong>零知识加密</strong>，加密密码只在你的设备本地使用，
            我们的服务器<strong>从未</strong>存储或接触过你的加密密码。
          </p>
          <p>
            如果你忘记了加密密码，已加密的日记将<strong className="text-sakura">永久无法解密</strong>。
            这是零知识架构的特性，确保只有你本人能访问日记内容。
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-warm-white/50 p-4 text-left text-sm">
          <p className="font-medium text-ink">你可以尝试：</p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-ink/60">
            <li>回忆你常用的密码组合</li>
            <li>检查密码管理器中的记录</li>
            <li>联系我们的支持团队获取帮助（但我们无法帮你解密）</li>
          </ul>
        </div>

        <Link
          href="/settings"
          className="mt-6 block rounded-lg bg-sakura px-6 py-2.5 text-sm text-white transition hover:opacity-90"
        >
          返回设置
        </Link>
      </div>
    </div>
  )
}
```

---

### P2-3 添加账号级登录失败锁定

**文件：`src/lib/auth.ts`**

```typescript
const MAX_FAILED_ATTEMPTS = 5
const ACCOUNT_LOCK_MINUTES = 15

async function authorize(credentials, request) {
  const email = credentials?.email as string | undefined
  const password = credentials?.password as string | undefined

  if (!email || !password) return null

  const ip = getClientIP(request)

  // IP-level rate limit
  const { success: ipOk } = await checkRateLimit(rateLimiters.login, ip)
  if (!ipOk) throw new RateLimitError()

  // Account-level rate limit
  const { success: accountOk, reset } = await checkRateLimit(
    rateLimiters.loginAccount,
    `login:account:${email.toLowerCase()}`
  )
  if (!accountOk) {
    const minutes = Math.ceil((reset - Date.now()) / 1000 / 60)
    throw new CredentialsSignin(
      `Account temporarily locked — too many failed attempts. Try again in ${minutes} minutes.`
    )
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.emailVerified) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.nickname || user.email,
  }
}
```

**在 `rate-limit.ts` 中添加新的 limiter：**

```ts
loginAccount: createLimiter(MAX_FAILED_ATTEMPTS, `${ACCOUNT_LOCK_MINUTES} m`),
```

---

### P2-4 优化 `AppShell` 认证逻辑

> **决策：** 保留 SSR 传递 session 的方式（避免首次加载闪烁），仅优化 `useEffect` 中不必要的重复 fetch。

**文件：`src/components/AppShell.tsx`**

去掉每次路由变化时都发起的 `/api/auth/session` fetch。`SessionProvider` 已维护 session 状态，仅需在挂载时确认一次与 SSR 的一致性：

```typescript
"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Header from "./Header"
import MobileTabBar from "./MobileTabBar"
import { EncryptionProvider } from "@/hooks/useEncryptionPassword"

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
const ALWAYS_NO_SHELL = ["/auth"]

interface AppShellProps {
  children: React.ReactNode
  authenticated: boolean
}

export default function AppShell({ children, authenticated: ssrAuth }: AppShellProps) {
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(ssrAuth)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    // Only verify session once on initial mount (not on every route change)
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(!!data?.user)
      })
      .catch(() => {
        // Keep SSR value on error
      })
  }, []) // Empty deps — run only once

  // ...rest of existing logic unchanged...
}
```

> **注：** `layout.tsx` 中的 `auth()` 调用和 `<AppShell authenticated={authenticated}>` 保持不变。

---

### P2-5 清理死代码

**删除文件：`src/lib/api-helpers.ts`**

所有引用（`api/stats/route.ts`、`api/image/route.ts`、`api/upload/route.ts`、`api/entries/route.ts`、`api/entries/[id]/route.ts`、`api/user/config/route.ts`、`api/ai/generate/route.ts`、`api/ai/rewrite/route.ts`、`api/ai/test/route.ts`）改为：

```diff
-import { getUser, jsonError, jsonOk } from "@/lib/api-helpers"
+import { getSessionUserId, jsonError, jsonOk } from "@/lib/auth-helpers"
+
+export async function getUser() { return getSessionUserId() }
```

或在每个 route 中直接调用 `getSessionUserId`。

**清理 `src/types/index.ts`：** 删除以下未使用的类型：
- `ApiResponse<T>` (line 64-68)
- `LocalApiKeyStore` (line 70-73)
- `AIGenerateRequest` (line 46-51)
- `AIGenerateResponse` (line 53-57)
- `DiaryEntry` (line 10-22)
- `UserConfig` (line 5-8)

---

### P2-6 重构 API 校验模板为通用函数

**新建方式：扩展 `src/lib/auth-helpers.ts`**

```typescript
import { z } from "zod"
import { NextRequest } from "next/server"
import { formatZodError } from "@/lib/validations"

export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | NextResponse<{ ok: false; error: string }>> {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const parseResult = schema.safeParse(rawBody)
  if (!parseResult.success) {
    return jsonError(formatZodError(parseResult.error), 400)
  }

  return { data: parseResult.data }
}
```

然后在 API route 中使用：

```typescript
const result = await validateBody(request, createEntrySchema)
if (result instanceof NextResponse) return result
const { date, markdown, tone, imagePaths, encrypted } = result.data
```

---

### P2-7 删除旧验证 Token

**文件：`src/lib/auth-service.ts:114-151`**

```diff
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    // ...existing checks...

+   // Delete all existing tokens for this user before creating a new one
+   await prisma.verificationToken.deleteMany({ where: { userId: user.id } })

    const token = generateToken()
    await prisma.verificationToken.create({
      // ...
    })
```

**同理应用于 `forgotPassword`（line 153-186）：**

```diff
+   await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
    const token = generateToken()
    await prisma.passwordResetToken.create({
      // ...
    })
```

---

## P3 — 持续改进

### P3-1 配置 ESLint

```bash
npx next lint  # 选择 Strict (recommended)
```

在 `package.json` 添加：

```diff
"scripts": {
+  "lint": "next lint",
+  "lint:fix": "next lint --fix",
```

### P3-2 修复嵌套三元为 Map 查找

**文件：`src/lib/diary.ts:44-51`**

```diff
+const TONE_PROMPTS: Record<Tone, string> = {
+  warm: WARM_SYSTEM_PROMPT,
+  genki: GENKI_SYSTEM_PROMPT,
+  minimal: MINIMAL_SYSTEM_PROMPT,
+  literary: LITERARY_SYSTEM_PROMPT,
+}
+
 export async function* generateDiary(params: { ... }) {
   // ...
-  const systemPrompt =
-    tone === "warm"
-      ? WARM_SYSTEM_PROMPT
-      : tone === "genki"
-        ? GENKI_SYSTEM_PROMPT
-        : tone === "minimal"
-          ? MINIMAL_SYSTEM_PROMPT
-          : LITERARY_SYSTEM_PROMPT;
+  const systemPrompt = TONE_PROMPTS[tone]
```

### P3-3 启用严格 TS 选项

**文件：`tsconfig.json`**

```diff
-    "strict": true,
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "exactOptionalPropertyTypes": false,  // too breaking for codebase size
```

### P3-4 添加全局环境变量校验

**新建文件：`src/lib/env.ts`**

```typescript
function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value
}

export const env = {
  get AUTH_SECRET() { return getEnv("AUTH_SECRET") },
  get API_KEY_ENCRYPTION_KEY() { return getEnv("API_KEY_ENCRYPTION_KEY") },
  get RESEND_API_KEY() { return getEnv("RESEND_API_KEY") },
  get R2_ENDPOINT() { return getEnv("R2_ENDPOINT") },
  get R2_ACCESS_KEY_ID() { return getEnv("R2_ACCESS_KEY_ID") },
  get R2_SECRET_ACCESS_KEY() { return getEnv("R2_SECRET_ACCESS_KEY") },
  get R2_BUCKET() { return getEnv("R2_BUCKET") },
}
```

然后将 `storage.ts` 中的 `!` 断言替换为 `env.R2_ENDPOINT` 等。

### P3-5 添加 Prisma 错误处理中间件

**新建文件：`src/lib/prisma-errors.ts`**

```typescript
import { Prisma } from "@prisma/client"

export function handlePrismaError(error: unknown): {
  status: number
  message: string
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return { status: 409, message: "该记录已存在" }
      case "P2025":
        return { status: 404, message: "记录不存在" }
      case "P2003":
        return { status: 400, message: "关联数据不存在" }
      default:
        console.error("[Prisma] Unhandled error code:", error.code, error.message)
        return { status: 500, message: "服务器内部错误" }
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "请求数据格式不正确" }
  }

  console.error("[Prisma] Unexpected error:", error)
  return { status: 500, message: "服务器内部错误" }
}
```

### P3-6 添加 vercel.json build 校验

```diff
{
  "framework": "nextjs",
  "regions": ["hkg1"],
-  "buildCommand": "npx prisma generate && next build",
+  "buildCommand": "npx prisma generate && npx tsc --noEmit && next build",
  "installCommand": "npm install"
}
```

---

## Quick Wins（30 分钟内可完成的低风险修复）

| # | 动作 | 文件 | 时间 |
|---|------|------|------|
| 1 | 删除 `src/lib/api-helpers.ts` | 删除文件 + 更新 9 个 import | 5 min |
| 2 | 删除 `types/index.ts` 中 6 个未使用类型 | 删除 30 行 | 2 min |
| 3 | 修复 `VALID_TONES = ["warm", "genki", "minimal", "literary"]` | `validations.ts:25` | 1 min |
| 4 | 嵌套三元 → Map lookup | `diary.ts:44-51` | 3 min |
| 5 | `diary.ts` 提取 `TONE_PROMPTS` 常量 | `diary.ts` 顶部 | 2 min |
| 6 | 删除 `auth.ts:15` 的 `console.warn` 改为 `throw Error` | `auth.ts:11-16` | 2 min |
| 7 | `resendVerification` 创建 Token 前删除旧 Token | `auth-service.ts:136` | 3 min |
| 8 | 优化 `AppShell.tsx` 去掉 route-change 重复 fetch | `AppShell.tsx` | 5 min |

---

## 验证检查清单

在合并修复代码前，验证以下项：

- [ ] `npx tsc --noEmit` 零错误
- [ ] `npx next lint` 零错误
- [ ] `npm audit` 零 high/critical
- [ ] `npm test` 全部通过
- [ ] 手动测试：注册 → 验证邮件 → 登录 → 创建日记 → 查看日记 → 删除日记
- [ ] 手动测试：API Key 配置 → AI 生成 → SSE 流式输出
- [ ] 手动测试：上传图片 → 图片正确显示
- [ ] 手动测试：加密密码设置 → 加密日记 → 解密查看 → 修改密码流程
- [ ] 手动测试：错误的 API Key → 正确的错误提示
- [ ] 手动测试：刷新页面 → Session 保持
- [ ] 手动测试：404 页面 → `not-found.tsx` 渲染
- [ ] 手动测试：断开网络 → 错误边界渲染友好提示

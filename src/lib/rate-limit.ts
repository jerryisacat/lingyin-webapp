import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
})

type Duration = `${number} ${"s" | "m" | "h" | "d"}`

function createLimiter(maxRequests: number, window: Duration) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, window),
    prefix: "lingyin:ratelimit",
  })
}

export const rateLimiters = {
  login: createLimiter(5, "1 m"),
  register: createLimiter(3, "15 m"),
  forgotPassword: createLimiter(2, "5 m"),
  resendVerification: createLimiter(2, "5 m"),
  resetPassword: createLimiter(5, "15 m"),
  aiGenerate: createLimiter(5, "1 m"),
  aiRewrite: createLimiter(5, "1 m"),
  aiTest: createLimiter(3, "1 m"),
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

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    return { success, limit, remaining, reset }
  } catch (error) {
    console.error(
      "[RateLimit] Redis error:",
      error instanceof Error ? error.message : error
    )
    console.warn("[RateLimit] Redis unavailable — skipping rate limit")
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "127.0.0.1"
}

export function rateLimitError(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return NextResponse.json(
    { ok: false, error: "请求过于频繁，请稍后重试" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  )
}

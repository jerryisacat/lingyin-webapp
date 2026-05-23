import { NextResponse } from "next/server"
import { forgotPassword } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.forgotPassword, ip)
  if (!success) return rateLimitError(reset)

  try {
    const { email } = await request.json()
    const result = await forgotPassword(email)

    if (result.ok) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result, { status: 400 })
  } catch {
    return NextResponse.json(
      { ok: false, error: "发送失败，请稍后再试" },
      { status: 500 }
    )
  }
}

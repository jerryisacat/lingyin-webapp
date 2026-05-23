import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.resetPassword, ip)
  if (!success) return rateLimitError(reset)

  try {
    const body = await request.json()
    const result = await resetPassword(body)

    if (result.ok) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result, { status: 400 })
  } catch {
    return NextResponse.json(
      { ok: false, error: "重置失败，请稍后再试" },
      { status: 500 }
    )
  }
}

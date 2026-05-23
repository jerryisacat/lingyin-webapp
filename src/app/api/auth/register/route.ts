import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-service"
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit"
import { jsonError } from "@/lib/auth-helpers"
import { formatZodError, registerSchema } from "@/lib/validations"

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const { success, reset } = await checkRateLimit(rateLimiters.register, ip)
  if (!success) return rateLimitError(reset)

  try {
    const body = await request.json()
    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return jsonError(formatZodError(parseResult.error), 400)
    }
    const result = await registerUser(parseResult.data)

    if (result.ok) {
      return NextResponse.json(result, { status: 201 })
    }

    return NextResponse.json(result, { status: 400 })
  } catch {
    return NextResponse.json(
      { ok: false, error: "注册失败，请稍后再试" },
      { status: 500 }
    )
  }
}

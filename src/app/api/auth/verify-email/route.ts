import { NextRequest, NextResponse } from "next/server"
import { verifyEmail } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "缺少验证令牌" },
      { status: 400 }
    )
  }

  const result = await verifyEmail(token)

  if (result.ok) {
    return NextResponse.json(result)
  }

  return NextResponse.json(result, { status: 400 })
}

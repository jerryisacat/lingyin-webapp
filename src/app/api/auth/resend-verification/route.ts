import { NextResponse } from "next/server"
import { resendVerification } from "@/lib/auth-service"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const result = await resendVerification(email)

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

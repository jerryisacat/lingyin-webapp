import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await registerUser(body)

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

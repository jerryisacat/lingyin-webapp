import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const secret = process.env.HEALTH_SECRET
  if (secret) {
    const token = request.nextUrl.searchParams.get("token")
    if (token !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    // silently fail — no error details in production
  }

  let emailOk = false
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    emailOk = true
  }

  const allOk = dbOk && emailOk

  return NextResponse.json(
    { ok: allOk },
    { status: allOk ? 200 : 500 }
  )
}

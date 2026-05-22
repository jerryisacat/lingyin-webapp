import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {}

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = { status: "ok" }
  } catch (err) {
    checks.db = {
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  let emailError: string | null = null
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    emailError = null
  } else if (!process.env.RESEND_API_KEY) {
    emailError = "RESEND_API_KEY not set"
  } else {
    emailError = "EMAIL_FROM not set"
  }

  checks.email = {
    status: emailError ? "error" : "ok",
    ...(emailError && { detail: emailError }),
  }

  checks.env = {
    status: "info",
    detail: `
AUTH_URL: ${process.env.AUTH_URL || "MISSING"}
NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || "MISSING"}
NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "MISSING"}
R2_BUCKET: ${process.env.R2_BUCKET || "MISSING"}
R2_ENDPOINT: ${process.env.R2_ENDPOINT || "MISSING"}
    `.trim(),
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok" || c.status === "info")

  return NextResponse.json(
    { ok: allOk, checks },
    { status: allOk ? 200 : 500 }
  )
}

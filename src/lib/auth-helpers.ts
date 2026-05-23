import { auth } from "@/lib/auth"
import { NextResponse, NextRequest } from "next/server"
import { z } from "zod"
import { formatZodError } from "@/lib/validations"

export type AuthUser = { id: string; email: string }

export async function getSessionUserId(): Promise<AuthUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email ?? "",
  }
}

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

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json<{ ok: false; error: string }>({ ok: false, error }, { status })
}
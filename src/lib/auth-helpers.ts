import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export type AuthUser = { id: string; email: string }

export async function getSessionUserId(): Promise<AuthUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email ?? "",
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}
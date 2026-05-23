import { NextResponse } from "next/server"

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json<{ ok: false; error: string }>({ ok: false, error }, { status })
}

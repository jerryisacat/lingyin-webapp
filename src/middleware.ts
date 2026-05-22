import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const PAGE_ROUTES = {
  public: ["/", "/register", "/verify-email", "/forgot-password", "/reset-password"],
  auth: ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"],
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (req.auth && PAGE_ROUTES.auth.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (!req.auth) {
    const isPublic = PAGE_ROUTES.public.includes(pathname) || PAGE_ROUTES.auth.includes(pathname)
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|workbox-.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
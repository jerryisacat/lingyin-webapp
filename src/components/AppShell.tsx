"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { MobileTabBar } from "@/components/MobileTabBar"
import { EncryptionProvider } from "@/hooks/useEncryptionPassword"

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
const ALWAYS_NO_SHELL = ["/auth"]

interface AppShellProps {
  children: React.ReactNode
  authenticated: boolean
}

export function AppShell({ children, authenticated: ssrAuth }: AppShellProps) {
  const pathname = usePathname()

  const [authenticated, setAuthenticated] = useState(ssrAuth)
  const [authLoaded, setAuthLoaded] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(!!data?.user)
        setAuthLoaded(true)
      })
      .catch(() => {
        setAuthLoaded(true)
      })
  }, [])

  if (ALWAYS_NO_SHELL.some((route) => pathname.startsWith(route))) {
    return <>{children}</>
  }

  if (AUTH_PAGES.some((route) => pathname.startsWith(route))) {
    return <>{children}</>
  }

  // Public landing page — no shell
  if (pathname === "/" && !authenticated) {
    return <>{children}</>
  }

  // Authenticated pages — desktop sidebar + mobile top bar + mobile bottom tabs
  return (
    <EncryptionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 md:pl-56">
          {/* Mobile mini header */}
          <div className="md:hidden sticky top-0 z-30 bg-warm-white/90 backdrop-blur-sm border-b border-surface-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sakura to-sakura-light">
                <span className="text-white text-xs">🌸</span>
              </div>
              <span className="text-sm font-bold text-ink">玲音日记</span>
            </div>
          </div>
          <main className="flex-1 px-4 py-6 md:px-10 md:py-10 pb-24 md:pb-10 max-w-3xl w-full mx-auto">
            {children}
          </main>
        </div>
        <MobileTabBar />
      </div>
    </EncryptionProvider>
  )
}

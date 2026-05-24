"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { GlassNavBar } from "@/components/GlassNavBar"
import { EncryptionProvider } from "@/hooks/useEncryptionPassword"
import { useUserConfig } from "@/contexts/UserConfigContext"

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
const ALWAYS_NO_SHELL = ["/auth"]

interface AppShellProps {
  children: React.ReactNode
  authenticated: boolean
}

export function AppShell({ children, authenticated: ssrAuth }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading: configLoading, hasCompletedSetup } = useUserConfig()

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

  useEffect(() => {
    if (authenticated && !configLoading && !hasCompletedSetup && pathname !== "/setup") {
      router.replace("/setup")
    }
  }, [authenticated, configLoading, hasCompletedSetup, pathname, router])

  if (ALWAYS_NO_SHELL.some((route) => pathname.startsWith(route))) {
    return <>{children}</>
  }

  if (AUTH_PAGES.some((route) => pathname.startsWith(route))) {
    return <>{children}</>
  }

  // Public landing page — glass nav bar + full-width content
  if (pathname === "/" && !authenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <GlassNavBar />
        <main className="flex-1 w-full pt-6 pb-24 md:pt-[104px] md:pb-10">
          {children}
        </main>
      </div>
    )
  }

  // Authenticated pages — glass nav bar + unified content container
  return (
    <EncryptionProvider>
      <div className="flex min-h-screen flex-col">
        <GlassNavBar />
        {configLoading && pathname !== "/setup" ? (
          <main className="flex-1 w-full mx-auto px-4 md:px-10 max-w-3xl pt-6 pb-24 md:pt-[104px] md:pb-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
          </main>
        ) : (
          <main className="flex-1 w-full mx-auto px-4 md:px-10 max-w-3xl pt-6 pb-24 md:pt-[104px] md:pb-10">
            {children}
          </main>
        )}
      </div>
    </EncryptionProvider>
  )
}

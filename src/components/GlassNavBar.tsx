"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  Home,
  PenLine,
  Clock,
  Settings,
  Users,
  LogIn,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import navConfig from "@/../config/navigation.json"

interface NavItem {
  id: string
  href: string | null
  label: string
  icon: string
  show: "always" | "authenticated" | "unauthenticated"
  disabled?: boolean
}

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Home,
  PenLine,
  Clock,
  Settings,
  Users,
  LogIn,
}

const DESKTOP_NAV_HEIGHT = 64

export function GlassNavBar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const email = session?.user?.email ?? ""
  const isAuthenticated = status === "authenticated"
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const items = (navConfig.items as NavItem[]).filter(
    (item) =>
      (item.show === "authenticated" || item.show === "always") &&
      !item.disabled &&
      item.href
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  // Scroll detection for glass opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close logout popup on navigation
  useEffect(() => {
    setShowLogoutConfirm(false)
    setShowUserMenu(false)
  }, [pathname])

  const handleSignOut = async () => {
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch (error) {
      console.error("Failed to clear caches on sign out:", error)
    }
    await signOut({ callbackUrl: "/" })
  }

  // Settings long-press for mobile logout
  const handleSettingsTouchStart = useCallback(() => {
    if (!isAuthenticated) return
    longPressTimer.current = setTimeout(() => {
      setShowLogoutConfirm(true)
    }, 800)
  }, [isAuthenticated])

  const handleSettingsTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const glassBg = scrolled
    ? "bg-warm-white/95 dark:bg-gray-900/95"
    : "bg-warm-white/80 dark:bg-gray-900/80"

  const glassBlur = scrolled ? "backdrop-blur-xl" : "backdrop-blur-md"

  // ─── Desktop: Top Nav Bar ─────────────────────────
  const desktopNav = (
    <div
      className={`hidden md:flex md:fixed md:top-0 md:left-0 md:right-0 md:z-50 md:items-center md:justify-between md:px-6 md:border-b md:border-surface-border/50 transition-all duration-300 ${glassBg} ${glassBlur}`}
      style={{ height: DESKTOP_NAV_HEIGHT }}
    >
      {/* Left: Logo + Nav Items */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sakura to-sakura-light">
            <BookOpen className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">
            {navConfig.brand.label}
          </span>
        </Link>

        {/* Nav Items */}
        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] || BookOpen
            const active = isActive(item.href!)
            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-sakura-dark"
                    : "text-ink-light hover:text-ink hover:bg-surface/50"
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 rounded-lg bg-sakura/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.5} />
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right: User Menu */}
      {isAuthenticated && (
        <div className="relative">
          <button
            ref={triggerRef}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sakura to-sakura-light text-xs font-semibold text-white">
              {email.charAt(0).toUpperCase()}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-ink-light transition-transform duration-200 ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-surface-border/50 bg-warm-white dark:bg-gray-800 shadow-lg shadow-black/5 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-surface-border/50">
                  <div className="truncate text-sm font-medium text-ink dark:text-gray-200">
                    {email}
                  </div>
                  <div className="text-xs text-ink-light/60 dark:text-gray-400 mt-0.5">玲音日记</div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-light dark:text-gray-300 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  退出登录
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  // ─── Mobile: Bottom Tab Bar ───────────────────────
  const mobileNav = (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border/50 bg-warm-white/90 dark:bg-gray-900/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {(navConfig.mobileItems as { id: string; href: string; label: string; icon: string }[]).map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = ICON_MAP[item.icon] || Home

          if (item.id === "settings") {
            return (
              <Link
                key={item.id}
                href={item.href}
                onTouchStart={isAuthenticated ? handleSettingsTouchStart : undefined}
                onTouchEnd={isAuthenticated ? handleSettingsTouchEnd : undefined}
                onTouchCancel={isAuthenticated ? handleSettingsTouchEnd : undefined}
                onMouseDown={isAuthenticated ? handleSettingsTouchStart : undefined}
                onMouseUp={isAuthenticated ? handleSettingsTouchEnd : undefined}
                onMouseLeave={isAuthenticated ? handleSettingsTouchEnd : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                  active ? "text-sakura" : "text-ink-light"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-active-indicator"
                    className="absolute inset-1 rounded-lg bg-sakura/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                </span>
                <span className="relative z-10 text-2xs font-medium">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                active ? "text-sakura" : "text-ink-light"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="mobile-active-indicator"
                  className="absolute inset-1 rounded-lg bg-sakura/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              </span>
              <span className="relative z-10 text-2xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      {desktopNav}
      {mobileNav}

      {/* Mobile logout confirmation popup */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="mx-4 mb-20 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="h-5 w-5 text-red-400" strokeWidth={1.5} />
                <h3 className="text-lg font-medium text-ink dark:text-white">退出登录</h3>
              </div>
              <p className="text-sm text-ink-light dark:text-gray-300 mb-4">
                退出后需要重新登录才能访问你的日记。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-lg border border-surface-border px-4 py-2.5 text-sm font-medium text-ink-light hover:bg-surface transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                >
                  确认退出
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

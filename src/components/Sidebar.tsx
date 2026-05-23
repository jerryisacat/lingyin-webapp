"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  BookOpen,
  Home,
  PenLine,
  Clock,
  Settings,
  Users,
  LogIn,
  LogOut,
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

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const email = session?.user?.email ?? ""

  const items = (navConfig.items as NavItem[]).filter(
    (item) => item.show === "authenticated" && !item.disabled && item.href
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const handleSignOut = async () => {
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch {}
    await signOut({ callbackUrl: "/" })
  }

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-56 md:border-r md:border-surface-border md:bg-warm-white md:z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-7 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sakura to-sakura-light">
          <BookOpen className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-lg font-bold tracking-tight text-ink">{navConfig.brand.label}</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || BookOpen
          const active = isActive(item.href!)
          return (
            <Link
              key={item.id}
              href={item.href!}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-sakura/10 text-sakura-dark"
                  : "text-ink-light hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-surface-border px-3 py-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sakura to-sakura-light text-xs font-semibold text-white">
            {email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{email}</div>
            <div className="text-2xs text-ink-light/60">免费版</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-surface hover:text-ink"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          退出登录
        </button>
      </div>
    </aside>
  )
}

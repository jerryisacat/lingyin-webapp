'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface NavItem {
  id: string;
  href: string | null;
  label: string;
  icon: string;
  show: "always" | "authenticated" | "unauthenticated";
  disabled?: boolean;
}
import navigationConfig from "@/../config/navigation.json";

import { BookOpen, Clock, Home, LogIn, Menu, PenLine, Settings, Users, X } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Home,
  PenLine,
  Clock,
  Settings,
  Users,
  LogIn,
  BookOpen,
};

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = useMemo(() => {
    return (navigationConfig.items as NavItem[]).filter((item) => {
      // Skip disabled items
      if (item.disabled) return false;
      // Skip items without href
      if (!item.href) return false;
      if (item.show === 'authenticated') return status === 'authenticated';
      if (item.show === 'unauthenticated') return status !== 'authenticated';
      return true;
    });
  }, [status]);

  const handleSignOut = async () => {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    await signOut({ callbackUrl: '/' });
  };

  const renderNavLinks = (isMobile: boolean = false) => {
    return navLinks.map(item => {
      const Icon = iconMap[item.icon];
      const isActive = pathname === item.href;
      return (
        <Link
          key={item.id}
          href={item.href as string}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isMobile ? 'text-ink' : 'text-ink-light'}
            ${isActive
              ? 'bg-sakura/10 text-sakura'
              : 'hover:bg-zinc-200/50 hover:text-ink'
            }`}
        >
          {Icon && <Icon className="h-4 w-4" strokeWidth={1.5} />}
          {item.label}
        </Link>
      );
    });
  };

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 items-center justify-between rounded-2xl bg-white/70 px-4 shadow-soft ring-1 ring-black/5 backdrop-blur-md">
        {/* 品牌 Logo */}
        <Link href={session ? "/timeline" : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sakura/80 to-sakura">
            <BookOpen className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="bg-gradient-to-r from-sakura-dark via-sakura to-sakura-light bg-clip-text text-lg font-bold text-transparent">
            {navigationConfig.brand.label}
          </span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden items-center gap-2 md:flex">
          {renderNavLinks()}
          {status === 'authenticated' && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink-light transition-colors hover:bg-zinc-200/50 hover:text-ink"
            >
              登出
            </button>
          )}
        </nav>

        {/* 移动端菜单按钮 */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-md p-2 text-ink-light hover:bg-zinc-200/50">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* 移动端展开菜单 */}
      {isMenuOpen && (
        <div className="mt-2 rounded-2xl border border-surface-border bg-white/95 p-4 shadow-soft backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-2">
            {renderNavLinks(true)}
            {status === 'authenticated' && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-zinc-200/50"
              >
                登出
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

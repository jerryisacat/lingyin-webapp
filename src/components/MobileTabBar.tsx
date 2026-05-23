"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PenLine,
  Clock,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import navConfig from "@/../config/navigation.json";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  PenLine,
  Clock,
  Settings,
};

export default function MobileTabBar() {
  const pathname = usePathname();
  const { status } = useSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthenticated = status === "authenticated";

  // Close the logout popup when navigating away
  useEffect(() => {
    setShowLogoutConfirm(false);
  }, [pathname]);

  const handleSettingsTouchStart = useCallback(() => {
    if (!isAuthenticated) return;
    longPressTimer.current = setTimeout(() => {
      setShowLogoutConfirm(true);
    }, 800);
  }, [isAuthenticated]);

  const handleSettingsTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-warm-white/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {(navConfig.mobileItems as { id: string; href: string; label: string; icon: string }[]).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = ICON_MAP[item.icon] || Home;

            // Settings tab: add long-press for logout
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
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                    isActive ? "text-sakura" : "text-ink-light"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-2xs font-medium">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                  isActive ? "text-sakura" : "text-ink-light"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-2xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout confirmation popup */}
      {showLogoutConfirm && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
          <div className="mx-4 mb-20 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <LogOut className="h-5 w-5 text-red-400" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-ink">退出登录</h3>
            </div>
            <p className="text-sm text-ink-light mb-4">
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
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

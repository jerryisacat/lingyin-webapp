"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PenLine,
  Clock,
  Settings,
  type LucideIcon,
} from "lucide-react";
import navConfig from "@/../config/navigation.json";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  PenLine,
  Clock,
  Settings,
};

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-warm-white/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {(navConfig.mobileItems as { id: string; href: string; label: string; icon: string }[]).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICON_MAP[item.icon] || Home;
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
  );
}

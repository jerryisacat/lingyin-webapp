"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Clock, Settings } from "lucide-react";

const TAB_ITEMS = [
  { href: "/diary", label: "写日记", icon: PenLine },
  { href: "/timeline", label: "时间线", icon: Clock },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-warm-white/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {TAB_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                isActive ? "text-sakura" : "text-ink-light"
              }`}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-2xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

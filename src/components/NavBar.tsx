"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, PenLine, Clock, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/diary", label: "写日记", icon: PenLine },
  { href: "/timeline", label: "时间线", icon: Clock },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center justify-between border-b border-surface-border bg-warm-white px-6 py-3">
      <Link href="/" className="flex items-center gap-2 text-ink hover:text-sakura transition-colors">
        <BookOpen className="h-5 w-5" strokeWidth={1.5} />
        <span className="font-medium tracking-tight">铃英日记</span>
      </Link>

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sakura/10 text-sakura"
                  : "text-ink-light hover:bg-surface hover:text-ink"
              }`}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

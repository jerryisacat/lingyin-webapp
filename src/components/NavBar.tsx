"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  PenLine,
  Clock,
  Settings,
  Users,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import navConfig from "@/../config/navigation.json";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Home,
  PenLine,
  Clock,
  Settings,
  Users,
  LogIn,
};

interface NavItem {
  id: string;
  href: string | null;
  label: string;
  icon: string;
  show: "always" | "authenticated" | "unauthenticated";
  disabled?: boolean;
}

interface NavBarProps {
  authenticated: boolean;
}

function shouldShowItem(item: NavItem, authenticated: boolean): boolean {
  if (item.show === "always") return true;
  if (item.show === "authenticated") return authenticated;
  if (item.show === "unauthenticated") return !authenticated;
  return false;
}

export default function NavBar({ authenticated }: NavBarProps) {
  const pathname = usePathname();
  const brand = navConfig.brand;
  const BrandIcon = ICON_MAP[brand.icon] || BookOpen;

  return (
    <nav className="hidden md:flex items-center justify-between border-b border-surface-border bg-warm-white px-6 py-3">
      <Link
        href={brand.href}
        className="flex items-center gap-2 text-ink hover:text-sakura transition-colors"
      >
        <BrandIcon className="h-5 w-5" strokeWidth={1.5} />
        <span className="font-medium tracking-tight">{brand.label}</span>
      </Link>

      <div className="flex items-center gap-1">
        {(navConfig.items as NavItem[])
          .filter((item) => shouldShowItem(item, authenticated))
          .map((item) => {
            const isActive =
              item.href &&
              (pathname === item.href || pathname.startsWith(item.href + "/"));
            const Icon = ICON_MAP[item.icon] || Home;

            if (item.disabled || !item.href) {
              return (
                <span
                  key={item.id}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-light/40 cursor-not-allowed select-none"
                  title="即将上线"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sakura/10 text-sakura"
                    : "text-ink-light hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}

"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import MobileTabBar from "./MobileTabBar";

/** Routes that never show the navigation shell */
const ALWAYS_NO_SHELL = ["/login", "/auth", "/register", "/forgot-password", "/reset-password", "/verify-email"];

interface AppShellProps {
  children: React.ReactNode;
  authenticated: boolean;
}

export default function AppShell({ children, authenticated }: AppShellProps) {
  const pathname = usePathname();

  // Routes that always skip the shell
  if (ALWAYS_NO_SHELL.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  // Landing page (logged-out) → no shell
  if (pathname === "/" && !authenticated) {
    return <>{children}</>;
  }

  // All authenticated pages → show shell
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileTabBar />
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import MobileTabBar from "./MobileTabBar";

const NO_SHELL_ROUTES = ["/login", "/auth", "/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noShell = NO_SHELL_ROUTES.some((route) => pathname.startsWith(route));

  if (noShell) {
    return <>{children}</>;
  }

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

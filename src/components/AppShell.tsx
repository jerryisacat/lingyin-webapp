"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import MobileTabBar from "./MobileTabBar";
import { EncryptionProvider } from "@/hooks/useEncryptionPassword";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const ALWAYS_NO_SHELL = ["/auth"];

interface AppShellProps {
  children: React.ReactNode;
  /** SSR-time auth hint, used as initial value before client fetch resolves */
  authenticated: boolean;
}

export default function AppShell({ children, authenticated: ssrAuth }: AppShellProps) {
  const pathname = usePathname();

  // Client-side auth — always fresh, even after client navigation
  const [authenticated, setAuthenticated] = useState(ssrAuth);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(!!data?.user);
        setAuthLoaded(true);
      })
      .catch(() => {
        setAuthLoaded(true);
      });
  }, [pathname]);

  if (ALWAYS_NO_SHELL.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  // Auth pages (login/register/etc) → no shell
  if (AUTH_PAGES.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  // Public landing page → show NavBar only (no MobileTabBar)
  if (pathname === "/" && !authenticated) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  // Authenticated pages → full shell
  return (
    <EncryptionProvider>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileTabBar />
    </EncryptionProvider>
  );
}

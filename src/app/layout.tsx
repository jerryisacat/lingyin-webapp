import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f0a8b0",
};

export const metadata: Metadata = {
  title: "玲音日记",
  description: "AI 帮你写日记",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "玲音日记",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={notoSansSC.variable}>
      <body className="min-h-screen bg-warm-white text-ink font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

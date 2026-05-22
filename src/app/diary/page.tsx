"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApiKeys } from "@/hooks/useApiKeys";
import DiaryEditor from "@/components/DiaryEditor";
import type { ApiProvider } from "@/types";

const PROVIDER_ORDER: ApiProvider[] = ["openai", "deepseek", "gemini"];

export default function DiaryPage() {
  const router = useRouter();
  const { keys, loading } = useApiKeys();

  const activeProvider = useMemo(() => {
    for (const p of PROVIDER_ORDER) {
      if (keys.some((k) => k.provider === p)) return p;
    }
    return null;
  }, [keys]);

  useEffect(() => {
    if (!loading && !activeProvider) {
      router.replace("/settings");
    }
  }, [loading, activeProvider, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pt-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeProvider) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  return <DiaryEditor date={today} provider={activeProvider} />;
}

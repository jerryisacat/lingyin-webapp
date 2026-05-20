"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalApiKey } from "@/hooks/useLocalApiKey";
import DiaryEditor from "@/components/DiaryEditor";

export default function DiaryPage() {
  const router = useRouter();
  const { provider, apiKey, isConfigured, hydrated } = useLocalApiKey();

  useEffect(() => {
    if (hydrated && !isConfigured) {
      router.replace("/settings");
    }
  }, [hydrated, isConfigured, router]);

  if (!hydrated) {
    return (
      <div className="max-w-2xl mx-auto pt-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConfigured) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  return <DiaryEditor date={today} provider={provider} apiKey={apiKey} />;
}

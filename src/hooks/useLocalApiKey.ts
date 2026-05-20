"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiProvider, LocalApiKeyStore } from "@/types";

const STORAGE_KEY = "lingyin-api-config";

function readStore(): LocalApiKeyStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalApiKeyStore;
    if (parsed.provider && parsed.apiKey) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStore(store: LocalApiKeyStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function clearStore(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function useLocalApiKey() {
  const [config, setConfig] = useState<LocalApiKeyStore | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(readStore());
    setHydrated(true);
  }, []);

  const setProvider = useCallback((provider: ApiProvider) => {
    setConfig((prev) => {
      const next: LocalApiKeyStore = { provider, apiKey: prev?.apiKey ?? "" };
      writeStore(next);
      return next;
    });
  }, []);

  const setApiKey = useCallback((apiKey: string) => {
    setConfig((prev) => {
      const next: LocalApiKeyStore = {
        provider: prev?.provider ?? "openai",
        apiKey,
      };
      writeStore(next);
      return next;
    });
  }, []);

  const clearApiKey = useCallback(() => {
    clearStore();
    setConfig(null);
  }, []);

  const isConfigured = hydrated && config !== null && config.apiKey.length > 0;

  return {
    provider: config?.provider ?? ("openai" as ApiProvider),
    apiKey: config?.apiKey ?? "",
    setProvider,
    setApiKey,
    clearApiKey,
    isConfigured,
    hydrated,
  };
}

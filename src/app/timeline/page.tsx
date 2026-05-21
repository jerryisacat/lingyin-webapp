"use client";

import { useState, useEffect, useCallback } from "react";
import TimelineList from "@/components/TimelineList";
import type { DiarySummary, ApiResponse } from "@/types";

interface EntriesData {
  entries: DiarySummary[];
  nextCursor: string | null;
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<DiarySummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(
    async (cursorValue: string | null, append: boolean) => {
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (cursorValue) params.set("cursor", cursorValue);

        const res = await fetch(`/api/entries?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "加载失败");
        }

        const json: ApiResponse<EntriesData> = await res.json();
        if (!json.ok || !json.data) {
          throw new Error(json.error ?? "加载失败");
        }

        const { entries: newEntries, nextCursor } = json.data;

        if (append) {
          setEntries((prev) => [...prev, ...newEntries]);
        } else {
          setEntries(newEntries);
        }

        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "加载失败";
        setError(msg);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");

        const res = await fetch(`/api/entries?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "加载失败");
        }

        const json: ApiResponse<EntriesData> = await res.json();
        if (!json.ok || !json.data) {
          throw new Error(json.error ?? "加载失败");
        }

        if (!cancelled) {
          setEntries(json.data.entries);
          setCursor(json.data.nextCursor);
          setHasMore(json.data.nextCursor !== null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "加载失败";
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !cursor) return;
    setIsLoadingMore(true);
    await fetchEntries(cursor, true);
    setIsLoadingMore(false);
  }, [cursor, isLoadingMore, fetchEntries]);

  // Error state
  if (error && !isLoading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-400 font-medium mb-2">加载失败</p>
        <p className="text-sm text-ink-light mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchEntries(null, false).then(() => setIsLoading(false));
          }}
          className="btn-secondary text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-ink">时间线</h1>
        <p className="text-sm text-ink-light mt-1">浏览你的所有日记 📖</p>
      </div>

      <TimelineList
        entries={entries}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
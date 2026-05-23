"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { List, CalendarDays } from "lucide-react";
import { TimelineList } from "@/components/TimelineList";
import { CalendarView } from "@/components/CalendarView";
import type { DiarySummary, CalendarEntry, ApiResponse } from "@/types";

interface EntriesData {
  entries: DiarySummary[];
  nextCursor: string | null;
}

interface CalendarData {
  entries: CalendarEntry[];
}

function getTodayYear(): number {
  return new Date().getFullYear();
}

function getTodayMonth(): number {
  return new Date().getMonth() + 1;
}

export default function TimelinePage() {
  const router = useRouter();

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // List state (preserved across mode switches)
  const [entries, setEntries] = useState<DiarySummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const [calendarYear, setCalendarYear] = useState(getTodayYear());
  const [calendarMonth, setCalendarMonth] = useState(getTodayMonth());
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Fetch list entries
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

  // Fetch calendar entries for a given year/month
  const fetchCalendarEntries = useCallback(
    async (year: number, month: number) => {
      setCalendarLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("view", "calendar");
        params.set("year", String(year));
        params.set("month", String(month));

        const res = await fetch(`/api/entries?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "加载失败");
        }

        const json: ApiResponse<CalendarData> = await res.json();
        if (!json.ok || !json.data) {
          throw new Error(json.error ?? "加载失败");
        }

        setCalendarEntries(json.data.entries);
      } catch {
        setCalendarEntries([]);
      } finally {
        setCalendarLoading(false);
      }
    },
    []
  );

  // Initial list load (only once)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
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

  // Fetch calendar data when entering calendar mode or month changes
  useEffect(() => {
    fetchCalendarEntries(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth, fetchCalendarEntries]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !cursor) return;
    setIsLoadingMore(true);
    await fetchEntries(cursor, true);
    setIsLoadingMore(false);
  }, [cursor, isLoadingMore, fetchEntries]);

  const handlePrevMonth = useCallback(() => {
    setCalendarYear((prev) => (calendarMonth === 1 ? prev - 1 : prev));
    setCalendarMonth((prev) => (prev === 1 ? 12 : prev - 1));
  }, [calendarMonth]);

  const handleNextMonth = useCallback(() => {
    setCalendarYear((prev) => (calendarMonth === 12 ? prev + 1 : prev));
    setCalendarMonth((prev) => (prev === 12 ? 1 : prev + 1));
  }, [calendarMonth]);

  const handleDayClick = useCallback(
    (entryId: string) => {
      router.push(`/diary/${entryId}`);
    },
    [router]
  );

  const showListError = viewMode === "list" && error && !isLoading && entries.length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-ink">时间线</h1>
          <p className="text-sm text-ink-light mt-1">浏览你的所有日记 📖</p>
        </div>
        <div className="flex items-center gap-1 bg-surface rounded-xl border border-surface-border p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-sakura/20 text-sakura"
                : "text-ink-light hover:text-ink"
            }`}
            aria-label="列表视图"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "calendar"
                ? "bg-sakura/20 text-sakura"
                : "text-ink-light hover:text-ink"
            }`}
            aria-label="日历视图"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <>
          {showListError ? (
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
          ) : (
            <TimelineList
              entries={entries}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          )}
        </>
      )}

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <CalendarView
          entries={calendarEntries}
          year={calendarYear}
          month={calendarMonth}
          isLoading={calendarLoading}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDayClick={handleDayClick}
        />
      )}
    </div>
  );
}

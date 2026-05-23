"use client";

import { useCallback, useMemo } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import { DiaryCard } from "@/components/DiaryCard";
import type { DiarySummary } from "@/types";

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

interface MonthGroup {
  label: string;
  entries: DiarySummary[];
}

function groupByMonth(entries: DiarySummary[]): MonthGroup[] {
  const map = new Map<string, DiarySummary[]>();

  for (const entry of entries) {
    const d = new Date(entry.date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = `${year}年${MONTHS[month]}`;

    const group = map.get(key);
    if (group) {
      group.push(entry);
    } else {
      map.set(key, [entry]);
      // store label on the array
      const arr: DiarySummary[] & { label?: string } = [entry];
      arr.label = label;
      map.set(key, arr);
    }
  }

  const result: MonthGroup[] = [];
  for (const [key, entries] of map) {
    const d = new Date(entries[0].date);
    const year = d.getFullYear();
    const month = d.getMonth();
    result.push({
      label: `${year}年${MONTHS[month]}`,
      entries,
    });
  }

  // Sort groups in descending order (most recent first)
  result.sort((a, b) => {
    const [ay, am] = a.label.replace("年", "-").replace("月", "").split("-").map(Number);
    const [by, bm] = b.label.replace("年", "-").replace("月", "").split("-").map(Number);
    return by * 12 + bm - (ay * 12 + am);
  });

  return result;
}

interface TimelineListProps {
  entries: DiarySummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-4 p-4 rounded-2xl bg-surface border border-surface-border animate-pulse"
        >
          <div className="w-14 h-14 rounded-xl bg-sakura/10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-sakura/10 rounded w-1/3" />
            <div className="h-4 bg-sakura/10 rounded w-2/3" />
            <div className="h-3 bg-sakura/10 rounded w-full" />
            <div className="h-3 bg-sakura/10 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineList({
  entries,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: TimelineListProps) {
  const groups = useMemo(() => groupByMonth(entries), [entries]);

  // Initial loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((g) => (
          <section key={g}>
            <div className="h-5 bg-sakura/10 rounded w-24 mb-3 animate-pulse" />
            <LoadingSkeleton />
          </section>
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-sakura/10 flex items-center justify-center mb-4">
          <PackageOpen className="w-10 h-10 text-sakura/50" strokeWidth={1.5} />
        </div>
        <p className="text-ink-light text-base mb-6 leading-relaxed">
          还没有日记哦～
          <br />
          点击「写日记」开始你的第一篇吧！🌸
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-sm font-medium text-ink-light mb-3 px-1 sticky top-0 bg-warm-white/80 backdrop-blur-sm py-1 z-10">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.entries.map((entry) => (
              <DiaryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                加载中...
              </>
            ) : (
              "加载更多"
            )}
          </button>
        </div>
      )}

      {/* All loaded indicator */}
      {!hasMore && entries.length > 0 && (
        <p className="text-center text-xs text-ink-light/50 pb-4">
          — 已经到底啦 🌸 —
        </p>
      )}
    </div>
  );
}
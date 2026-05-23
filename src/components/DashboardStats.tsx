"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  Flame,
  Image,
  TrendingUp,
  Tags,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import type { StatsData } from "@/types";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-ink/5 ${className ?? ""}`}
    />
  );
}

function BarChart({ data }: { data: StatsData["monthlyData"] }) {
  if (data.length === 0) {
    return (
      <div className="flex justify-center py-8 text-sm text-ink-light/60">
        暂无数据
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const recent = data.slice(-12);

  return (
    <div className="flex items-end gap-1.5 h-32 px-1">
      {recent.map((item) => {
        const heightPct = Math.max((item.count / maxCount) * 100, 4);
        const [, monthPart] = item.month.split("-");
        return (
          <div
            key={item.month}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="w-full flex flex-col-reverse" style={{ height: "100px" }}>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-sakura/70 to-sakura/40 transition-all duration-300 hover:from-sakura hover:to-sakura/60"
                style={{ height: `${heightPct}%` }}
                title={`${item.month}: ${item.count}篇, ${item.words}字`}
              />
            </div>
            <span className="text-[10px] text-ink-light/60">
              {parseInt(monthPart, 10)}月
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TagCloud({ tags }: { tags: StatsData["topTags"] }) {
  if (tags.length === 0) {
    return (
      <div className="flex justify-center py-6 text-sm text-ink-light/60">
        暂无标签
      </div>
    );
  }

  const maxCount = tags[0]?.count ?? 1;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((item) => {
        const ratio = item.count / maxCount;
        const sizeClass =
          ratio > 0.7
            ? "text-sm px-3 py-1.5"
            : ratio > 0.3
              ? "text-xs px-2.5 py-1"
              : "text-xs px-2 py-0.5";
        const bgClass =
          ratio > 0.6
            ? "bg-sakura/15 text-sakura-dark border-sakura/30"
            : "bg-sakura/8 text-sakura border-sakura/20";

        return (
          <span
            key={item.tag}
            className={`rounded-full border font-medium transition-colors hover:bg-sakura/20 ${sizeClass} ${bgClass}`}
          >
            {item.tag.startsWith("#") ? item.tag : `#${item.tag}`}
          </span>
        );
      })}
    </div>
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (json.ok) {
        setStats(json.data);
      } else {
        setError(json.error || "加载失败");
      }
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Loading state ─────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in">
        <SkeletonBlock className="h-5 w-20" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-16" />
      </div>
    );
  }

  // ─── Error state ───────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-ink-light text-sm">{error}</span>
          <button
            onClick={fetchStats}
            className="btn-ghost flex items-center gap-1 text-sm text-sakura hover:text-sakura-dark"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // ─── Empty state (no entries) ──────────────────
  if (stats.totalDays === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sakura/10">
          <Sparkles className="h-7 w-7 text-sakura" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">还没有日记数据</p>
          <p className="text-xs text-ink-light mt-1">
            开始写日记后，这里会展示你的写作统计
          </p>
        </div>
      </div>
    );
  }

  // ─── Data state ────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <h2 className="text-base font-semibold text-ink flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-sakura" strokeWidth={1.5} />
        数据概览
      </h2>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard
          icon={<FileText className="h-5 w-5" strokeWidth={1.5} />}
          label="总字数"
          value={stats.totalWords.toLocaleString()}
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" strokeWidth={1.5} />}
          label="写作天数"
          value={stats.totalDays.toLocaleString()}
        />
        <StatsCard
          icon={<Flame className="h-5 w-5" strokeWidth={1.5} />}
          label="连续天数"
          value={stats.currentStreak}
        />
        <StatsCard
          icon={<Image className="h-5 w-5" strokeWidth={1.5} />}
          label="图片数"
          value={stats.totalImages.toLocaleString()}
        />
      </div>

      {/* Monthly chart */}
      <div className="rounded-xl border border-surface-border bg-surface/50 p-4">
        <h3 className="text-sm font-medium text-ink mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sakura" strokeWidth={1.5} />
          写作趋势
        </h3>
        <BarChart data={stats.monthlyData} />
      </div>

      {/* Tag cloud */}
      <div className="rounded-xl border border-surface-border bg-surface/50 p-4">
        <h3 className="text-sm font-medium text-ink mb-3 flex items-center gap-2">
          <Tags className="h-4 w-4 text-sakura" strokeWidth={1.5} />
          常用标签
        </h3>
        <TagCloud tags={stats.topTags} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ImageIcon, Tag, Lock } from "lucide-react";
import type { DiarySummary } from "@/types";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatDate(dateStr: string): {
  day: string;
  weekday: string;
  full: string;
} {
  const d = new Date(dateStr);
  const day = String(d.getDate());
  const weekday = WEEKDAYS[d.getDay()];
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return { day, weekday, full: `${year}年${month}月${day}日 星期${weekday}` };
}

function extractTitleFromPreview(preview: string | null): string | null {
  if (!preview) return null;
  const lines = preview.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return null;
  const firstLine = lines[0].replace(/^#+\s*/, "").trim();
  if (firstLine.length === 0) return null;
  return firstLine.length > 30 ? firstLine.slice(0, 30) + "..." : firstLine;
}

interface DiaryCardProps {
  entry: DiarySummary;
}

export function DiaryCard({ entry }: DiaryCardProps) {
  const { day, weekday, full } = formatDate(entry.date);
  const title = extractTitleFromPreview(entry.preview);
  const previewText = entry.preview
    ? entry.preview.length > 150
      ? entry.preview.slice(0, 150) + "..."
      : entry.preview
    : null;

  return (
    <Link
      href={`/diary/${entry.id}`}
      className="block group"
    >
      <article className="flex gap-4 p-4 rounded-2xl bg-surface border border-surface-border hover:border-sakura/30 hover:shadow-soft transition-all duration-200">
        {/* Date block */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-sakura/10 border border-sakura/20">
          <span className="text-xl font-bold text-sakura leading-none">
            {day}
          </span>
          <span className="text-2xs text-sakura/70 mt-0.5">周{weekday}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <p className="text-sm text-ink-light truncate">{full}</p>
              {title && (
                <h3 className="text-base font-medium text-ink mt-0.5 truncate group-hover:text-sakura transition-colors">
                  {title}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.wordCount > 0 && (
                <span className="text-2xs text-ink-light tabular-nums">
                  {entry.wordCount}字
                </span>
              )}
              {entry.hasImages && (
                <span
                  className="inline-flex items-center gap-0.5 text-xs text-sakura/80"
                  title="含图片"
                >
                  <ImageIcon className="w-3 h-3" strokeWidth={2} />
                </span>
              )}
            </div>
          </div>

          {previewText ? (
            <p className="text-sm text-ink-light leading-relaxed line-clamp-3 mt-1">
              {previewText}
            </p>
          ) : entry.preview === null ? (
            <p className="text-sm text-ink-light/50 leading-relaxed mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              已加密日记
            </p>
          ) : null}

          {entry.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Tag className="w-3 h-3 text-ink-light/50 flex-shrink-0" />
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-2xs text-sakura/70 bg-sakura/5 px-1.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

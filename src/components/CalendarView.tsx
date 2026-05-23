"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import type { CalendarEntry } from "@/types";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface CalendarViewProps {
  entries: CalendarEntry[];
  year: number;
  month: number;
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (entryId: string) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((day) => (
        <div
          key={day}
          className="aspect-square flex items-center justify-center"
        >
          <span className="text-xs font-medium text-ink-light/50">{day}</span>
        </div>
      ))}
      {Array.from({ length: 42 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-sakura/5 animate-pulse"
        />
      ))}
    </div>
  );
}

export function CalendarView({
  entries,
  year,
  month,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: CalendarViewProps) {
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const entryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      map.set(entry.date, entry.id);
    }
    return map;
  }, [entries]);

  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    while (cells.length < totalCells) {
      cells.push(null);
    }

    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [year, month]);

  const canGoPrev = useMemo(() => {
    const now = new Date();
    const target = new Date(year, month - 1, 1);
    return target < now;
  }, [year, month]);

  const canGoNext = useMemo(() => {
    const now = new Date();
    const target = new Date(year, month, 1);
    return target <= now;
  }, [year, month]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-sakura/10 rounded w-24 animate-pulse" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-sakura/5 animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-sakura/5 animate-pulse" />
          </div>
        </div>
        <CalendarSkeleton />
      </div>
    );
  }

  const isEmpty = entries.length === 0;

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">
          {year}年{month}月
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={!canGoPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-light hover:bg-sakura/10 hover:text-sakura transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="上个月"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={!canGoNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-light hover:bg-sakura/10 hover:text-sakura transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="下个月"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="aspect-square flex items-center justify-center"
          >
            <span className="text-xs font-medium text-ink-light/60">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.flat().map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const entryId = entryMap.get(dateStr);
          const hasEntry = entryId !== undefined;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => hasEntry && onDayClick(entryId)}
              disabled={!hasEntry}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                isToday
                  ? "bg-sakura/20 text-sakura font-bold"
                  : hasEntry
                    ? "hover:bg-sakura/10 text-ink cursor-pointer"
                    : "text-ink-light/40 cursor-default"
              }`}
            >
              <span className="text-sm">{day}</span>
              {hasEntry && !isToday && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sakura" />
              )}
              {hasEntry && isToday && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-warm-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-sakura/10 flex items-center justify-center mb-3">
            <PackageOpen className="w-8 h-8 text-sakura/50" strokeWidth={1.5} />
          </div>
          <p className="text-ink-light text-sm leading-relaxed">
            这个月还没有日记哦～🌸
          </p>
        </div>
      )}
    </div>
  );
}

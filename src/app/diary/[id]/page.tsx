"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  CalendarDays,
  Hash,
  Type,
  ImageIcon,
  Pencil,
  Save,
  X,
} from "lucide-react";
import MarkdownViewer from "@/components/MarkdownViewer";
import type { DiarySummary, ApiResponse } from "@/types";

interface EntryDetail {
  markdown: string;
  metadata: DiarySummary;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${year}年${month}月${day}日 星期${weekday}`;
}

export default function DiaryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const entryId = params.id;

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editSaveStatus, setEditSaveStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/entries/${entryId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("日记不存在");
          }
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "加载失败");
        }

        const json: ApiResponse<EntryDetail> = await res.json();
        if (!json.ok || !json.data) {
          throw new Error(json.error ?? "加载失败");
        }

        if (!cancelled) {
          setEntry(json.data);
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

    if (entryId) load();

    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "删除失败");
      }
      router.replace("/timeline");
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [entryId, router]);

  const handleStartEdit = useCallback(() => {
    setEditContent(entry?.markdown ?? "");
    setIsEditing(true);
    setEditSaveStatus("idle");
  }, [entry]);

  const handleEditSave = useCallback(async () => {
    if (!editContent.trim() || !entry) return;
    setEditSaveStatus("saving");

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: editContent }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "保存失败");
      }

      const json: ApiResponse<unknown> = await res.json();
      if (!json.ok) throw new Error(json.error ?? "保存失败");

      setEntry((prev) =>
        prev ? { ...prev, markdown: editContent } : prev
      );
      setIsEditing(false);
      setEditSaveStatus("idle");
    } catch {
      setEditSaveStatus("error");
    }
  }, [editContent, entry, entryId]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent("");
    setEditSaveStatus("idle");
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-sakura animate-spin" />
        <p className="text-sm text-ink-light">加载日记中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 flex flex-col items-center text-center">
        <p className="text-red-400 font-medium mb-2">加载失败</p>
        <p className="text-sm text-ink-light mb-4">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/timeline")}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          返回时间线
        </button>
      </div>
    );
  }

  if (!entry) return null;

  const { metadata, markdown } = entry;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.push("/timeline")}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="btn-ghost text-sm flex items-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              编辑
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost text-sm text-red-400 hover:text-red-500 hover:bg-red-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>

      {/* Date + metadata bar */}
      <div className="mb-6">
        <p className="text-sm text-ink-light flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {formatFullDate(metadata.date)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-ink-light">
        {metadata.wordCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Type className="w-3 h-3" />
            {metadata.wordCount} 字
          </span>
        )}
        {metadata.hasImages && (
          <span className="inline-flex items-center gap-1 text-sakura/80">
            <ImageIcon className="w-3 h-3" />
            含图片
          </span>
        )}
        {metadata.tags.length > 0 && (
          <span className="inline-flex items-center gap-1 flex-wrap">
            <Hash className="w-3 h-3" />
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="bg-sakura/5 text-sakura/70 px-1.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="card min-h-[50vh]">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className="input-field resize-none font-mono text-sm w-full"
            />
            {editSaveStatus === "error" && (
              <p className="text-sm text-red-400 text-center">保存失败，请重试</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleEditCancel}
                disabled={editSaveStatus === "saving"}
                className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaveStatus === "saving" || !editContent.trim()}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5"
              >
                {editSaveStatus === "saving" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        ) : markdown ? (
          <MarkdownViewer markdown={markdown} />
        ) : (
          <p className="text-ink-light text-sm text-center py-12">暂无内容</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-ink-light/50">
          创建于{" "}
          {new Date(metadata.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) setShowDeleteConfirm(false);
            }}
            aria-label="取消"
          />

          {/* Dialog */}
          <div className="relative bg-warm-white rounded-2xl border border-surface-border shadow-lg p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in">
            <h3 className="text-lg font-medium text-ink mb-2">确认删除</h3>
            <p className="text-sm text-ink-light mb-6 leading-relaxed">
              确定要删除 {formatFullDate(metadata.date)} 的日记吗？
              <br />
              此操作不可撤销。
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="btn-secondary flex-1 text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-400 text-white font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-red-500 active:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, StopCircle, Eye, EyeOff, Save, RefreshCw, ArrowLeft } from "lucide-react";
import { useStreamGenerate } from "@/hooks/useStreamGenerate";
import TypewriterText from "@/components/TypewriterText";
import PhotoUploader from "@/components/PhotoUploader";
import type { ApiProvider, MediaFile } from "@/types";

type EditorState = "input" | "generating" | "editing";

interface DiaryEditorProps {
  date: string;
  provider: ApiProvider;
  apiKey: string;
}

function formatDate(dateStr: string): string {
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = days[d.getDay()];
  return `${year}年${month}月${day}日 星期${weekday}`;
}

export default function DiaryEditor({ date, provider, apiKey }: DiaryEditorProps) {
  const router = useRouter();
  const [editorState, setEditorState] = useState<EditorState>("input");
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<MediaFile[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const { text: streamedText, isStreaming, error: streamError, generate, stop, reset } =
    useStreamGenerate({
      text: inputText,
      images,
      date,
      provider,
      apiKey,
    });

  useEffect(() => {
    if (!isStreaming && editorState === "generating" && streamedText) {
      setMarkdown(streamedText);
      setEditorState("editing");
    }
  }, [isStreaming, editorState, streamedText]);

  const handleGenerate = useCallback(() => {
    if (!inputText.trim() && images.length === 0) return;
    setEditorState("generating");
    generate();
  }, [inputText, images, generate]);

  const handleStop = useCallback(() => {
    stop();
    if (streamedText) {
      setMarkdown(streamedText);
      setEditorState("editing");
    } else {
      setEditorState("input");
    }
  }, [stop, streamedText]);

  const handleReset = useCallback(() => {
    reset();
    setEditorState("input");
    setInputText("");
    setMarkdown("");
  }, [reset]);

  const handleSave = useCallback(async () => {
    if (!markdown.trim()) return;
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          markdown,
          tone: "warm",
          imagePaths: images.map((img) => img.path),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }

      const { data: entry } = await res.json();
      setSaveStatus("saved");
      router.push(`/diary/${entry.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setSaveError(msg);
      setSaveStatus("error");
    }
  }, [markdown, date, images, router]);

  const handleRegenerate = useCallback(() => {
    reset();
    setEditorState("generating");
    generate();
  }, [reset, generate]);

  if (streamError && editorState === "generating") {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={handleReset}
          className="btn-ghost mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="card text-center py-12 space-y-4">
          <p className="text-red-400 font-medium">生成失败</p>
          <p className="text-sm text-ink-light">{streamError}</p>
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={handleRegenerate} className="btn-secondary text-sm">
              重试
            </button>
            <button type="button" onClick={handleReset} className="btn-ghost text-sm">
              修改输入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <p className="text-sm text-ink-light">{formatDate(date)}</p>
      </div>

      {editorState === "input" && (
        <div className="space-y-6">
          <div className="card space-y-3">
            <p className="text-sm text-ink-light">今天有什么想记录的？</p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="写点什么吧..."
              rows={6}
              className="input-field resize-none"
            />
            <p className="text-xs text-ink-light/50 text-right">
              {inputText.length} 字
            </p>
          </div>

          <div className="card">
            <PhotoUploader images={images} onImagesChange={setImages} />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!inputText.trim() && images.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
          >
            <Sparkles className="w-5 h-5" />
            让铃英帮你写日记
          </button>
        </div>
      )}

      {editorState === "generating" && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4 text-sakura">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">铃英正在帮你写...</span>
            </div>
            <TypewriterText text={streamedText} isStreaming={isStreaming} />
          </div>
          <button
            type="button"
            onClick={handleStop}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            停止生成
          </button>
        </div>
      )}

      {editorState === "editing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn-ghost text-sm flex items-center gap-1.5"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  编辑
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  预览
                </>
              )}
            </button>
          </div>

          <div className="card">
            {showPreview ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-normal leading-relaxed text-ink">
                {markdown}
              </div>
            ) : (
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={20}
                className="input-field resize-none font-mono text-sm"
              />
            )}
          </div>

          {saveStatus === "error" && (
            <p className="text-sm text-red-400 text-center">{saveError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRegenerate}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重新生成
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saveStatus === "saving" ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

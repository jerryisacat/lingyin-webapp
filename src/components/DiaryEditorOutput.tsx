"use client"

import { useState } from "react"
import { Sparkles, StopCircle, Eye, EyeOff, Save, RefreshCw } from "lucide-react"
import { TypewriterText } from "@/components/TypewriterText"

interface DiaryEditorOutputProps {
  editorState: "generating" | "editing"
  streamedText: string
  isStreaming: boolean
  markdown: string
  onMarkdownChange: (md: string) => void
  saveStatus: "idle" | "saving" | "saved" | "error"
  saveError: string | null
  onStop: () => void
  onSave: () => void
  onRegenerate: () => void
}

export function DiaryEditorOutput({
  editorState,
  streamedText,
  isStreaming,
  markdown,
  onMarkdownChange,
  saveStatus,
  saveError,
  onStop,
  onSave,
  onRegenerate,
}: DiaryEditorOutputProps) {
  const [showPreview, setShowPreview] = useState(false)

  if (editorState === "generating") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4 text-sakura">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">铃英正在帮你写...</span>
          </div>
          <TypewriterText text={streamedText} isStreaming={isStreaming} />
        </div>
        <button
          type="button"
          onClick={onStop}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <StopCircle className="w-4 h-4" />
          停止生成
        </button>
      </div>
    )
  }

  return (
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

      <div className="rounded-xl border border-surface-border bg-white p-6 shadow-soft">
        {showPreview ? (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap font-normal leading-relaxed text-ink">
            {markdown}
          </div>
        ) : (
          <textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            rows={20}
            className="w-full resize-none rounded-xl border border-surface-border bg-warm-white px-4 py-3 font-mono text-sm text-ink focus:border-sakura focus:ring-2 focus:ring-sakura/15 focus:outline-none transition-colors"
          />
        )}
      </div>

      {saveStatus === "error" && (
        <p className="text-sm text-red-400 text-center">{saveError}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRegenerate}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重新生成
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === "saving" || saveStatus === "saved"}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saveStatus === "saving" ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  )
}

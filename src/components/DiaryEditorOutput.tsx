"use client"

import { useState, FormEvent } from "react"
import { Sparkles, StopCircle, Eye, EyeOff, Save, RefreshCw, Wand2, Replace, Plus, X } from "lucide-react"
import { TypewriterText } from "@/components/TypewriterText"

interface DiaryEditorOutputProps {
  editorState: "generating" | "editing" | "rewriting"
  streamedText: string
  isStreaming: boolean
  markdown: string
  onMarkdownChange: (md: string) => void
  saveStatus: "idle" | "saving" | "saved" | "error"
  saveError: string | null
  pendingRewriteResult: string
  onStop: () => void
  onSave: () => void
  onRegenerate: () => void
  onRewrite: (instruction: string) => void
  onRewriteReplace: () => void
  onRewriteAppend: () => void
  onRewriteCancel: () => void
}

export function DiaryEditorOutput({
  editorState,
  streamedText,
  isStreaming,
  markdown,
  onMarkdownChange,
  saveStatus,
  saveError,
  pendingRewriteResult,
  onStop,
  onSave,
  onRegenerate,
  onRewrite,
  onRewriteReplace,
  onRewriteAppend,
  onRewriteCancel,
}: DiaryEditorOutputProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showRewriteInput, setShowRewriteInput] = useState(false)
  const [rewriteInstruction, setRewriteInstruction] = useState("")

  const handleRewriteSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!rewriteInstruction.trim()) return
    onRewrite(rewriteInstruction.trim())
  }

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

  if (editorState === "rewriting") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sakura">
              <Sparkles className={`w-4 h-4 ${isStreaming ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium">
                {isStreaming ? "铃英正在修改..." : "修改完成"}
              </span>
            </div>
            <button
              type="button"
              onClick={onRewriteCancel}
              className="btn-ghost text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              取消
            </button>
          </div>
          <TypewriterText text={streamedText} isStreaming={isStreaming} />
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            停止修改
          </button>
        ) : pendingRewriteResult ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRewriteReplace}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Replace className="w-4 h-4" />
              替换原文
            </button>
            <button
              type="button"
              onClick={onRewriteAppend}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              追加到末尾
            </button>
          </div>
        ) : null}
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

      {showRewriteInput && (
        <form onSubmit={handleRewriteSubmit} className="space-y-3">
          <div className="rounded-xl border border-sakura/30 bg-sakura/5 p-4">
            <label className="block text-sm font-medium text-ink mb-2">
              告诉铃英你想怎么改
            </label>
            <input
              type="text"
              value={rewriteInstruction}
              onChange={(e) => setRewriteInstruction(e.target.value)}
              placeholder="例如：添加一段关于天气的描写、把语气改得更轻松..."
              className="w-full rounded-lg border border-surface-border bg-warm-white px-3 py-2 text-sm text-ink placeholder:text-ink-light/60 focus:border-sakura focus:ring-2 focus:ring-sakura/15 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!rewriteInstruction.trim()}
              className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              开始修改
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRewriteInput(false)
                setRewriteInstruction("")
              }}
              className="btn-ghost text-sm"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {saveStatus === "error" && (
        <p className="text-sm text-red-400 text-center">{saveError}</p>
      )}

      <div className="flex items-center gap-3">
        {!showRewriteInput && (
          <button
            type="button"
            onClick={() => setShowRewriteInput(true)}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            铃英继续修改
          </button>
        )}
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

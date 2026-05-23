"use client"

import { Sparkles } from "lucide-react"
import { PhotoUploader } from "@/components/PhotoUploader"
import type { MediaFile, WritingStyle } from "@/types"
import { PERSONAS } from "@/config/personas"

interface DiaryEditorInputProps {
  inputText: string
  onInputTextChange: (text: string) => void
  images: MediaFile[]
  onImagesChange: (images: MediaFile[]) => void
  writingStyle: WritingStyle
  onWritingStyleChange: (style: WritingStyle) => void
  onGenerate: () => void
}

export function DiaryEditorInput({
  inputText,
  onInputTextChange,
  images,
  onImagesChange,
  writingStyle,
  onWritingStyleChange,
  onGenerate,
}: DiaryEditorInputProps) {
  const canGenerate = !!inputText.trim() || images.length > 0

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <textarea
          value={inputText}
          onChange={(e) => onInputTextChange(e.target.value)}
          placeholder="今天有什么想记录的？写点什么吧..."
          rows={6}
          className="w-full resize-none rounded-xl border border-surface-border bg-warm-white px-4 py-3 text-sm text-ink placeholder:text-ink-light/40 focus:border-sakura focus:ring-2 focus:ring-sakura/15 focus:outline-none transition-colors"
        />
        <p className="text-xs text-ink-light/50 text-right">{inputText.length} 字</p>
      </div>

      <PhotoUploader images={images} onImagesChange={onImagesChange} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-light/60 mr-1">风格：</span>
        {Object.values(PERSONAS).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onWritingStyleChange({ ...writingStyle, persona: p.id })}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              writingStyle.persona === p.id
                ? "bg-sakura text-white"
                : "border border-sakura/30 text-ink-light hover:border-sakura/60"
            }`}
            title={p.description}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
      >
        <Sparkles className="w-5 h-5" />
        让玲英帮你写日记
      </button>
    </div>
  )
}

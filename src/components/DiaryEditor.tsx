"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useStreamGenerate } from "@/hooks/useStreamGenerate"
import { useUserConfig } from "@/contexts/UserConfigContext"
import { DiaryEditorToolbar } from "@/components/DiaryEditorToolbar"
import { DiaryEditorInput } from "@/components/DiaryEditorInput"
import { DiaryEditorOutput } from "@/components/DiaryEditorOutput"
import type { ApiProvider, MediaFile, WritingStyle } from "@/types"

type EditorState = "input" | "generating" | "editing"

interface DiaryEditorProps {
  date: string
  provider: ApiProvider
}

export function DiaryEditor({ date, provider }: DiaryEditorProps) {
  const router = useRouter()
  const { writingStyle: savedStyle } = useUserConfig()
  const [editorState, setEditorState] = useState<EditorState>("input")
  const [inputText, setInputText] = useState("")
  const [images, setImages] = useState<MediaFile[]>([])
  const [markdown, setMarkdown] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [writingStyle, setWritingStyle] = useState<WritingStyle>(savedStyle)

  useEffect(() => {
    setWritingStyle(savedStyle)
  }, [savedStyle])

  const { text: streamedText, isStreaming, error: streamError, generate, stop, reset } =
    useStreamGenerate({
      text: inputText,
      images,
      date,
      provider,
      writingStyle,
    })

  useEffect(() => {
    if (!isStreaming && editorState === "generating" && streamedText) {
      setMarkdown(streamedText)
      setEditorState("editing")
    }
  }, [isStreaming, editorState, streamedText])

  const handleGenerate = useCallback(() => {
    if (!inputText.trim() && images.length === 0) return
    setEditorState("generating")
    generate()
  }, [inputText, images, generate])

  const handleStop = useCallback(() => {
    stop()
    if (streamedText) {
      setMarkdown(streamedText)
      setEditorState("editing")
    } else {
      setEditorState("input")
    }
  }, [stop, streamedText])

  const handleReset = useCallback(() => {
    reset()
    setEditorState("input")
    setInputText("")
    setMarkdown("")
  }, [reset])

  const handleSave = useCallback(async () => {
    if (!markdown.trim()) return
    setSaveStatus("saving")
    setSaveError(null)

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          markdown,
          writingStyle,
          imagePaths: images.map((img) => img.path),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Save failed")
      }

      const { data: entry } = await res.json()
      setSaveStatus("saved")
      router.push(`/diary/${entry.id}`)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed")
      setSaveStatus("error")
    }
  }, [markdown, date, images, writingStyle, router])

  const handleRegenerate = useCallback(() => {
    reset()
    setEditorState("generating")
    generate()
  }, [reset, generate])

  if (streamError && editorState === "generating") {
    return (
      <div className="w-full max-w-xl mx-auto">
        <button
          type="button"
          onClick={handleReset}
          className="btn-ghost mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="rounded-xl border border-surface-border bg-white p-8 shadow-soft text-center space-y-4">
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
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      <DiaryEditorToolbar date={date} writingStyle={writingStyle} />

      {editorState === "input" && (
        <DiaryEditorInput
          inputText={inputText}
          onInputTextChange={setInputText}
          images={images}
          onImagesChange={setImages}
          writingStyle={writingStyle}
          onWritingStyleChange={setWritingStyle}
          onGenerate={handleGenerate}
        />
      )}

      {(editorState === "generating" || editorState === "editing") && (
        <DiaryEditorOutput
          editorState={editorState}
          streamedText={streamedText}
          isStreaming={isStreaming}
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          saveStatus={saveStatus}
          saveError={saveError}
          onStop={handleStop}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  )
}

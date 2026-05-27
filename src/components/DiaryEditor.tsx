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

type EditorState = "input" | "generating" | "editing" | "rewriting"

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
  const [pendingRewriteResult, setPendingRewriteResult] = useState("")

  useEffect(() => {
    setWritingStyle(savedStyle)
  }, [savedStyle])

  const { text: streamedText, isStreaming, error: streamError, generate, rewrite, stop, reset } =
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
    if (!isStreaming && editorState === "rewriting" && streamedText) {
      setPendingRewriteResult(streamedText)
    }
  }, [isStreaming, editorState, streamedText])

  const handleGenerate = useCallback(() => {
    if (!inputText.trim() && images.length === 0) return
    setEditorState("generating")
    generate()
  }, [inputText, images, generate])

  const handleStop = useCallback(() => {
    stop()
    if (editorState === "rewriting") {
      if (streamedText) {
        setPendingRewriteResult(streamedText)
      } else {
        setEditorState("editing")
      }
    } else if (streamedText) {
      setMarkdown(streamedText)
      setEditorState("editing")
    } else {
      setEditorState("input")
    }
  }, [stop, streamedText, editorState])

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

  const handleRewrite = useCallback(
    (instruction: string) => {
      reset()
      setPendingRewriteResult("")
      setEditorState("rewriting")
      rewrite(instruction, markdown)
    },
    [reset, rewrite, markdown]
  )

  const handleRewriteReplace = useCallback(() => {
    if (pendingRewriteResult) {
      setMarkdown(pendingRewriteResult)
    }
    setPendingRewriteResult("")
    setEditorState("editing")
  }, [pendingRewriteResult])

  const handleRewriteAppend = useCallback(() => {
    if (pendingRewriteResult) {
      setMarkdown((prev) => prev + "\n\n" + pendingRewriteResult)
    }
    setPendingRewriteResult("")
    setEditorState("editing")
  }, [pendingRewriteResult])

  const handleRewriteCancel = useCallback(() => {
    setPendingRewriteResult("")
    setEditorState("editing")
  }, [])

  if (streamError && (editorState === "generating" || editorState === "rewriting")) {
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
          <p className="text-red-400 font-medium">
            {editorState === "rewriting" ? "修改失败" : "生成失败"}
          </p>
          <p className="text-sm text-ink-light">{streamError}</p>
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={handleRegenerate} className="btn-secondary text-sm">
              重试
            </button>
            <button
              type="button"
              onClick={editorState === "rewriting" ? () => setEditorState("editing") : handleReset}
              className="btn-ghost text-sm"
            >
              {editorState === "rewriting" ? "返回编辑" : "修改输入"}
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

      {(editorState === "generating" || editorState === "editing" || editorState === "rewriting") && (
        <DiaryEditorOutput
          editorState={editorState}
          streamedText={streamedText}
          isStreaming={isStreaming}
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          saveStatus={saveStatus}
          saveError={saveError}
          pendingRewriteResult={pendingRewriteResult}
          onStop={handleStop}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          onRewrite={handleRewrite}
          onRewriteReplace={handleRewriteReplace}
          onRewriteAppend={handleRewriteAppend}
          onRewriteCancel={handleRewriteCancel}
        />
      )}
    </div>
  )
}

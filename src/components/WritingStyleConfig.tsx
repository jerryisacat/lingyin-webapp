"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Sparkles, Eye, UserRound } from "lucide-react"
import { useUserConfig } from "@/contexts/UserConfigContext"
import { PERSONAS, PERSPECTIVE_LABELS, DEFAULT_WRITING_STYLE } from "@/config/personas"
import type { WritingStyle, Persona, Perspective } from "@/types"

interface WritingStyleConfigProps {
  step?: number
  onComplete?: (style: WritingStyle) => void
  embedded?: boolean
}

export function WritingStyleConfig({
  step: initialStep = 1,
  onComplete,
  embedded = false,
}: WritingStyleConfigProps) {
  const { writingStyle: savedStyle, setWritingStyle: saveStyle, isLoading } = useUserConfig()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saved, setSaved] = useState(false)
  const [step, setStep] = useState(initialStep)
  const [perspective, setPerspective] = useState<Perspective>(
    embedded ? savedStyle.perspective : DEFAULT_WRITING_STYLE.perspective
  )
  const [persona, setPersona] = useState<Persona>(
    embedded ? savedStyle.persona : DEFAULT_WRITING_STYLE.persona
  )

  useEffect(() => {
    if (embedded) {
      setPerspective(savedStyle.perspective)
      setPersona(savedStyle.persona)
    }
  }, [embedded, savedStyle])

  const handleSave = async (style: WritingStyle) => {
    setSaving(true)
    setSaveError("")
    setSaved(false)

    try {
      await saveStyle(style)
      setSaved(true)
      onComplete?.(style)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = () => {
    handleSave({ perspective, persona })
  }

  const handleSkip = () => {
    handleSave(DEFAULT_WRITING_STYLE)
  }

  if (embedded && isLoading) {
    return (
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">日记风格</h2>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (embedded) {
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">日记风格</h2>
        </div>

        <p className="text-sm text-ink-light leading-relaxed">
          选择 AI 写日记时的叙事视角和人格风格，让日记更贴近你想要的感觉。
        </p>

        {/* Perspective */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Eye className="h-4 w-4 text-sakura" strokeWidth={1.5} />
            叙事视角
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PERSPECTIVE_LABELS).map(([key, { label, description }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPerspective(key as Perspective)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  perspective === key
                    ? "border-sakura bg-sakura/5"
                    : "border-surface-border hover:border-surface-border/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 shrink-0 ${
                      perspective === key ? "border-sakura bg-sakura" : "border-surface-border"
                    }`}
                  >
                    {perspective === key && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
                <p className="mt-1 ml-6 text-xs text-ink-light/70 leading-relaxed">
                  {description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <UserRound className="h-4 w-4 text-sakura" strokeWidth={1.5} />
            人格风格
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(PERSONAS).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id)}
                className={`rounded-lg border px-2.5 py-3 text-center transition-colors ${
                  persona === p.id
                    ? "border-sakura bg-sakura/5"
                    : "border-surface-border hover:border-surface-border/80"
                }`}
              >
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="text-xs font-medium text-ink">{p.name}</div>
                <div className="text-[10px] text-ink-light/60 mt-0.5 leading-tight">
                  {p.description.slice(0, 12)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? "保存中..." : saved ? "已保存" : "保存风格设置"}
        </button>

        {saveError && (
          <p className="text-sm text-red-400 text-center">{saveError}</p>
        )}

        {saved && (
          <p className="text-sm text-green-600 text-center flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4" />
            风格设置已保存
          </p>
        )}
      </div>
    )
  }

  // ─── Onboarding wizard mode ───
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            step >= 1 ? "bg-sakura text-white" : "bg-surface-border text-ink-light"
          }`}
        >
          1
        </span>
        <div
          className={`h-0.5 w-8 transition-colors ${step >= 2 ? "bg-sakura" : "bg-surface-border"}`}
        />
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            step >= 2 ? "bg-sakura text-white" : "bg-surface-border text-ink-light"
          }`}
        >
          2
        </span>
      </div>

      {step === 1 && (
        <>
          {/* Step 1: Perspective */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-sakura" strokeWidth={1.5} />
              <h2 className="text-lg font-medium text-ink">选择叙事视角</h2>
            </div>
            <p className="text-sm text-ink-light leading-relaxed">
              你希望日记用什么口吻来写？这决定了 AI 会用「我」还是「你」来讲述你的故事。
            </p>

            <div className="space-y-3">
              {Object.entries(PERSPECTIVE_LABELS).map(([key, { label, description }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPerspective(key as Perspective)}
                  className={`w-full rounded-lg border px-4 py-4 text-left transition-colors ${
                    perspective === key
                      ? "border-sakura bg-sakura/5"
                      : "border-surface-border hover:border-surface-border/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                        perspective === key ? "border-sakura bg-sakura" : "border-surface-border"
                      }`}
                    >
                      {perspective === key && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-ink">{label}</span>
                      <p className="mt-1 text-xs text-ink-light/70 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={handleSkip} className="btn-ghost text-sm">
                跳过，使用默认
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                下一步
              </button>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {/* Step 2: Persona */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-sakura" strokeWidth={1.5} />
              <h2 className="text-lg font-medium text-ink">选择人格风格</h2>
            </div>
            <p className="text-sm text-ink-light leading-relaxed">
              选择一个 AI 的人格底色。人格决定了日记的语气和风格——元气少女活泼，猫系慵懒。选对了基调，剩下的交给玲音。
            </p>

            <div className="grid grid-cols-2 gap-3">
              {Object.values(PERSONAS).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`rounded-lg border px-3 py-4 text-center transition-colors ${
                    persona === p.id
                      ? "border-sakura bg-sakura/5"
                      : "border-surface-border hover:border-surface-border/80"
                  }`}
                >
                  <div className="text-3xl mb-1.5">{p.emoji}</div>
                  <div className="text-sm font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-ink-light/60 mt-1 leading-relaxed px-1">
                    {p.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost text-sm">
                上一步
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {saving ? (
                  "保存中..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    完成设置
                  </>
                )}
              </button>
            </div>

            {saveError && (
              <p className="text-sm text-red-400 text-center">{saveError}</p>
            )}
          </div>

          <button type="button" onClick={handleSkip} className="btn-ghost text-sm w-full">
            跳过，使用默认
          </button>
        </>
      )}
    </div>
  )
}

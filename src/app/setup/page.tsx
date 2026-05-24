"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"
import { WritingStyleConfig } from "@/components/WritingStyleConfig"
import { useUserConfig } from "@/contexts/UserConfigContext"

export default function SetupPage() {
  const router = useRouter()
  const { writingStyle, isLoading, hasCompletedSetup } = useUserConfig()
  const [hasExistingStyle, setHasExistingStyle] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoading) {
      const isDefault =
        writingStyle.perspective === "first_person" && writingStyle.persona === "yuanshao"
      setHasExistingStyle(hasCompletedSetup || !isDefault)
    }
  }, [isLoading, writingStyle, hasCompletedSetup])

  const handleComplete = useCallback(() => {
    router.push("/diary")
  }, [router])

  if (hasExistingStyle === null) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-lg space-y-8">
        {hasExistingStyle ? (
          <div className="text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sakura/10 mx-auto">
              <BookOpen className="h-8 w-8 text-sakura" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">日记风格配置</h1>
              <p className="mt-2 text-sm text-ink-light leading-relaxed">
                随时调整 AI 的写作风格，让日记更贴合你的心意。
              </p>
            </div>
            <WritingStyleConfig embedded onComplete={handleComplete} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sakura/10 mx-auto">
                <BookOpen className="h-8 w-8 text-sakura" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">欢迎来到玲音日记</h1>
              <p className="text-sm text-ink-light leading-relaxed max-w-sm mx-auto">
                在开始记录之前，花 30 秒设置你的日记风格。AI 会用你喜欢的口吻帮你写日记。
              </p>
            </div>
            <WritingStyleConfig step={1} onComplete={handleComplete} />
          </div>
        )}
      </div>
    </div>
  )
}

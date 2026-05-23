"use client"

import { useRouter } from "next/navigation"
import { Shield, ArrowLeft } from "lucide-react"

export default function ForgotEncryptionPasswordPage() {
  const router = useRouter()

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="card space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-500" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-ink">忘记加密密码？</h1>
        </div>

        <p className="text-sm text-ink-light leading-relaxed">
          很遗憾，由于端到端加密的设计，我们无法帮你恢复加密密码。
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800">如果确定忘记了密码：</p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>可以选择「重置加密」，但所有已有加密日记将永久无法恢复</li>
            <li>重置前我们会要求你验证邮箱</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement reset flow in a future issue
            }}
            className="btn-ghost flex-1 text-sm text-red-500 hover:bg-red-50"
          >
            我明白风险，继续重置
          </button>
        </div>
      </div>
    </div>
  )
}

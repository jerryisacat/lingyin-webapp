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
          <p className="text-sm font-medium text-amber-800">为什么无法恢复密码？</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            玲音日记采用端到端加密设计，加密密钥仅由你的密码在本地生成，服务器从未接触到密码或密钥。因此我们无法解密你的日记，也无法帮你重置密码。
          </p>
          <p className="text-sm font-medium text-amber-800 mt-2">重要提醒：</p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>所有已加密的日记在忘记密码后将永久无法恢复</li>
            <li>建议将密码保存在安全的密码管理器中</li>
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
            onClick={() => router.push("/settings")}
            className="btn-primary flex-1 text-sm"
          >
            前往设置
          </button>
        </div>
      </div>
    </div>
  )
}

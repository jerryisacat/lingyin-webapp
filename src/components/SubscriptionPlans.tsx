"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Sparkles } from "lucide-react"
import type { PricingData, PriceInfo } from "@/types"

export function SubscriptionPlans({ data }: { data: PricingData }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleSelectPlan = async (plan: PriceInfo) => {
    if (plan.plan === "free" || plan.isCurrent) return

    setLoading(plan.plan)
    setError("")

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.plan }),
      })

      const json = await res.json()
      if (!json.ok) {
        setError(json.error || "创建支付会话失败")
        return
      }

      const url = json.data.url
      if (!url) {
        setError("未能获取支付页面")
        return
      }

      window.location.href = url
    } catch {
      setError("网络错误，请稍后再试")
    } finally {
      setLoading(null)
    }
  }

  const tiers: { plan: string; particles: string }[] = [
    { plan: "free", particles: "·" },
    { plan: "basic", particles: "◦ ◦ ◦" },
    { plan: "advanced", particles: "✦ ✦ ✦ ✦ ✦" },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {data.plans.map((plan, i) => {
          const tier = tiers.find((t) => t.plan === plan.plan)
          const isFree = plan.plan === "free"
          const isCurrent = plan.isCurrent
          const isOther = !isCurrent && !isFree

          return (
            <div
              key={plan.plan}
              className={`card relative flex flex-col ${
                isCurrent
                  ? "ring-2 ring-sakura shadow-glow"
                  : isOther
                    ? "hover:border-sakura/30 transition-colors"
                    : ""
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sakura px-3 py-0.5 text-xs font-medium text-white">
                  当前方案
                </div>
              )}

              <div className="mb-1 text-xs tracking-widest text-ink-light/60 uppercase">
                {tier?.particles}
              </div>

              <h3 className="text-lg font-semibold text-ink">{plan.label}</h3>

              <div className="mt-3 mb-5">
                <span className="text-3xl font-bold text-ink">
                  ¥{plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-ink-light">
                    /{plan.interval}
                  </span>
                )}
              </div>

              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-light">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sakura" strokeWidth={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isFree ? (
                <p className="text-center text-xs text-ink-light/60 mt-auto pt-4 border-t border-surface-border">
                  已包含在你的账户中
                </p>
              ) : isCurrent ? (
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="btn-primary w-full flex items-center justify-center gap-2 opacity-60 cursor-default"
                  disabled
                >
                  当前方案
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loading === plan.plan || !data.stripeConfigured}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading === plan.plan ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      跳转支付...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      升级到{plan.label}
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!data.stripeConfigured && (
        <p className="text-center text-xs text-ink-light/60">
          支付服务暂未配置，请等待管理员完成设置后再进行升级
        </p>
      )}
    </div>
  )
}

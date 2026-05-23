"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, TrendingUp, Sparkles, Crown, ExternalLink, Receipt } from "lucide-react"
import { SubscriptionPlans } from "@/components/SubscriptionPlans"
import type { PricingData, SubscriptionData } from "@/types"

interface InvoiceRecord {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  createdAt: string
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState("")

  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")
  const topUpSuccess = searchParams.get("topup") === "success"
  const topUpCanceled = searchParams.get("topup") === "canceled"

  const fetchData = useCallback(async () => {
    try {
      const [pricingRes, statusRes, invoicesRes] = await Promise.all([
        fetch("/api/pricing"),
        fetch("/api/subscription/status"),
        fetch("/api/invoices"),
      ])

      const pricingJson = await pricingRes.json()
      const statusJson = await statusRes.json()
      const invoicesJson = await invoicesRes.json()

      if (pricingJson.ok) setPricing(pricingJson.data)
      if (statusJson.ok) setSubscription(statusJson.data.subscription)
      if (invoicesJson.ok) setInvoices(invoicesJson.data)
    } catch {
      setError("加载失败，请刷新页面试试")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" })
      const json = await res.json()
      if (json.ok && json.data.url) {
        window.location.href = json.data.url
      } else {
        setError(json.error || "打开管理页面失败")
      }
    } catch {
      setError("网络错误")
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="btn-ghost p-1.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              选择方案
            </h1>
            <p className="mt-1 text-sm text-ink-light">
              选择适合你的订阅方案，让玲音为你买单
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          支付成功！你的订阅已激活，现在可以享受全部功能了。
        </div>
      )}

      {canceled && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          支付已取消。你可以随时再试，或者继续使用免费版。
        </div>
      )}

      {topUpSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          加购成功！你的加购额度已到账，可前往用量页面查看。
        </div>
      )}

      {topUpCanceled && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          加购已取消。你可以随时再试。
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {subscription && subscription.plan !== "free" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            {subscription.plan === "advanced" ? (
              <Crown className="h-5 w-5 text-amber-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-sakura" />
            )}
            <h2 className="text-lg font-medium text-ink">当前订阅</h2>
          </div>

          <p className="text-sm text-ink-light leading-relaxed">
            你当前订阅的{subscription.plan === "basic" ? "基础版" : "高级版"}
            {subscription.currentPeriodEnd
              ? `，有效期至 ${new Date(subscription.currentPeriodEnd).toLocaleDateString("zh-CN")}`
              : ""}
            。
          </p>

          <button
            type="button"
            onClick={handleOpenPortal}
            disabled={portalLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {portalLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                跳转中...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                管理订阅
              </>
            )}
          </button>
        </div>
      )}

      {pricing && <SubscriptionPlans data={pricing} />}

      {invoices.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-ink-light/40" />
            <h2 className="text-lg font-medium text-ink">账单记录</h2>
          </div>
          <div className="divide-y divide-sakura/5">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-ink">
                    {(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                  </p>
                  <p className="text-xs text-ink-light/50">
                    {new Date(inv.createdAt).toLocaleDateString("zh-CN")}
                    {inv.paidAt && ` · 已支付`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  inv.status === "paid"
                    ? "bg-green-50 text-green-600"
                    : "bg-amber-50 text-amber-600"
                }`}>
                  {inv.status === "paid" ? "已付" : inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-ink-light/60 leading-relaxed max-w-md mx-auto">
          所有价格以人民币结算。支付由 Stripe 安全处理。取消订阅后仍可查看已有日记。
          如有疑问，请联系我们。
        </p>
      </div>
    </div>
  )
}

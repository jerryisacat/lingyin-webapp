"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, FileText, CreditCard, Coins, BarChart3 } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalEntries: number;
  activeSubscriptions: number;
  tokenUsage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
  topUp: {
    totalRevenueCny: number;
    totalAmountUsd: number;
    count: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setData(json.data);
        else setError(json.error || "加载失败");
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button type="button" onClick={() => router.push("/")} className="btn-ghost p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { icon: Users, label: "注册用户", value: data.totalUsers, color: "text-blue-500" },
    { icon: FileText, label: "日记总数", value: data.totalEntries, color: "text-purple-500" },
    { icon: CreditCard, label: "活跃订阅", value: data.activeSubscriptions, color: "text-green-500" },
    { icon: Coins, label: "总 Token 成本", value: `$${data.tokenUsage.totalCostUsd.toFixed(2)}`, color: "text-amber-500" },
    { icon: BarChart3, label: "加购收入", value: `¥${data.topUp.totalRevenueCny}`, color: "text-sakura" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push("/settings")} className="btn-ghost p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-ink">管理面板</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card flex flex-col items-center gap-2 py-6">
            <card.icon className={`h-6 w-6 ${card.color}`} strokeWidth={1.5} />
            <span className="text-2xl font-bold text-ink tabular-nums">{card.value}</span>
            <span className="text-xs text-ink-light/60">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h2 className="text-lg font-medium text-ink">Token 用量汇总</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-light/60">总输入 Token</span>
              <span className="text-ink tabular-nums">{data.tokenUsage.totalInputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light/60">总输出 Token</span>
              <span className="text-ink tabular-nums">{data.tokenUsage.totalOutputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light/60">总成本</span>
              <span className="text-ink tabular-nums">${data.tokenUsage.totalCostUsd.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-medium text-ink">加购汇总</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-light/60">加购次数</span>
              <span className="text-ink tabular-nums">{data.topUp.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light/60">总加购额度</span>
              <span className="text-ink tabular-nums">${data.topUp.totalAmountUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light/60">总收入 (CNY)</span>
              <span className="text-ink tabular-nums">¥{data.topUp.totalRevenueCny}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

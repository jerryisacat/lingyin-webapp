"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, HardDrive, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import type { QuotaStatusData } from "@/types";

interface TopUpBundle {
  price: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function ProgressBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label?: string;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = pct > 80 && pct < 100;
  const isDanger = pct >= 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-ink-light/60">{label}</span>
          <span
            className={`text-xs font-medium tabular-nums ${isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-ink-light/60"}`}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-sakura/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger
              ? "bg-red-400"
              : isWarning
                ? "bg-amber-400"
                : "bg-sakura/60"
          }`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export function QuotaUsage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<QuotaStatusData | null>(null);
  const [bundles, setBundles] = useState<TopUpBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/quota/status").then((res) => res.json()),
      fetch("/api/topup/bundles").then((res) => res.json()),
    ])
      .then(([quotaJson, bundlesJson]) => {
        if (quotaJson.ok) {
          setData(quotaJson.data);
        }
        if (bundlesJson.ok && bundlesJson.data?.bundles) {
          setBundles(bundlesJson.data.bundles);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const handleTopUp = async (amountCny: number) => {
    setToppingUp(true);
    try {
      const res = await fetch("/api/topup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCny }),
      });
      const json = await res.json();
      if (json.ok && json.data?.url) {
        window.location.href = json.data.url;
      }
    } catch {
      setToppingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="animate-pulse bg-sakura/5 rounded-xl p-5 h-32" />
      </div>
    );
  }

  if (!data) return null;

  const tokenPct =
    data.tokenBudget.limit > 0
      ? (data.tokenBudget.used / data.tokenBudget.limit) * 100
      : 0;
  const storagePct =
    data.storage.limit > 0
      ? (data.storage.used / data.storage.limit) * 100
      : 0;
  const remainingPct =
    data.tokenBudget.limit > 0
      ? (data.tokenBudget.remaining / data.tokenBudget.limit) * 100
      : 0;
  const rolloverPct =
    data.tokenBudget.limit > 0 && data.tokenBudget.rollover
      ? (data.tokenBudget.rollover / data.tokenBudget.limit) * 100
      : 0;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="rounded-xl bg-white/60 border border-sakura/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-sakura/60" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-ink">
              {data.planLabel}
            </span>
          </div>
          {tokenPct >= 100 && (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">额度已用完</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Token Budget */}
          <div>
            <ProgressBar
              used={data.tokenBudget.used}
              limit={data.tokenBudget.limit}
              label="Token 预算"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-ink-light/50">
                本月已用 {tokenPct.toFixed(0)}%
              </span>
              <span className="text-xs text-ink-light/50">
                剩余 {remainingPct.toFixed(0)}%
              </span>
            </div>
            {data.tokenBudget.rollover && data.tokenBudget.rollover > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <RefreshCw className="h-3 w-3 text-green-500" strokeWidth={1.5} />
                <span className="text-xs text-green-600">
                  上月结转 +{rolloverPct.toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Storage */}
          <div>
            <ProgressBar
              used={data.storage.used}
              limit={data.storage.limit}
              label="存储空间"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-ink-light/50">
                已用 {formatBytes(data.storage.used)}
              </span>
              <span className="text-xs text-ink-light/50">
                剩余 {formatBytes(data.storage.remaining)} /{" "}
                {formatBytes(data.storage.limit)}
              </span>
            </div>
          </div>
        </div>

        {tokenPct >= 100 && (
          <div className="mt-4 pt-3 border-t border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-500">
                Token 预算已用尽，请加购或升级
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {bundles.map((bundle) => (
                <button
                  key={bundle.price}
                  type="button"
                  onClick={() => handleTopUp(bundle.price)}
                  disabled={toppingUp}
                  className="flex flex-col items-center gap-1 rounded-lg border border-sakura/20 bg-sakura/5 px-3 py-2.5 text-center transition-all hover:bg-sakura/10 hover:border-sakura/40 disabled:opacity-50"
                >
                  <span className="text-sm font-semibold text-sakura-dark">
                    ¥{bundle.price}
                  </span>
                  <Plus className="h-3 w-3 text-sakura/50" strokeWidth={2} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push("/subscription")}
              className="mt-2 w-full rounded-lg bg-sakura/10 border border-sakura/20 px-3 py-2 text-xs font-medium text-sakura-dark transition-all hover:bg-sakura/15"
            >
              或升级套餐获得更多额度
            </button>
          </div>
        )}

        {!Array.isArray(data.modelRestriction.allowedModels) && (
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-sakura/10">
            <HardDrive className="h-3 w-3 text-sakura/40" strokeWidth={1.5} />
            <span className="text-xs text-ink-light/40">
              支持所有 AI 模型
            </span>
          </div>
        )}
        {Array.isArray(data.modelRestriction.allowedModels) &&
          data.modelRestriction.allowedModels.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-sakura/10">
              <HardDrive className="h-3 w-3 text-sakura/40" strokeWidth={1.5} />
              <span className="text-xs text-ink-light/40">
                可用模型:{" "}
                {data.modelRestriction.allowedModels
                  .map((m) => m.split("/").pop())
                  .join(", ")}
              </span>
            </div>
          )}

      </div>
    </div>
  );
}

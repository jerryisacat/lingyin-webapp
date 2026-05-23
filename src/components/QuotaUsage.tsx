"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Zap, HardDrive, AlertTriangle } from "lucide-react";
import type { QuotaStatusData } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatUsd(usd: number): string {
  if (usd < 0.01) return "$0.00";
  return `$${usd.toFixed(2)}`;
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

export default function QuotaUsage() {
  const { data: session } = useSession();
  const [data, setData] = useState<QuotaStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    fetch("/api/quota/status")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setData(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

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
                本月已用 {formatUsd(data.tokenBudget.used)}
              </span>
              <span className="text-xs text-ink-light/50">
                剩余 {formatUsd(data.tokenBudget.remaining)} /{" "}
                {formatUsd(data.tokenBudget.limit)}
              </span>
            </div>
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

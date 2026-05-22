"use client"

import { useState, useEffect, useCallback } from "react"
import type { ApiProvider } from "@/types"

interface ApiKeyInfo {
  id: string
  provider: string
  label: string | null
  createdAt: string
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/user/api-keys")
      const data = await res.json()
      if (data.ok) {
        setKeys(data.data)
      } else {
        setError(data.error || "无法加载 API 密钥")
      }
    } catch {
      setError("网络错误，请稍后再试")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const saveKey = useCallback(
    async (provider: ApiProvider, apiKey: string, label?: string) => {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, label }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      await fetchKeys()
    },
    [fetchKeys]
  )

  const deleteKey = useCallback(
    async (provider: ApiProvider) => {
      const res = await fetch(`/api/user/api-keys?provider=${provider}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      await fetchKeys()
    },
    [fetchKeys]
  )

  const hasKey = useCallback(
    (provider: ApiProvider) => keys.some((k) => k.provider === provider),
    [keys]
  )

  return {
    keys,
    loading,
    error,
    saveKey,
    deleteKey,
    hasKey,
    refresh: fetchKeys,
  }
}

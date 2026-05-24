"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { WritingStyle } from "@/types"
import { DEFAULT_WRITING_STYLE } from "@/config/personas"

interface UserConfigContextValue {
  writingStyle: WritingStyle
  setWritingStyle: (style: WritingStyle) => void
  isLoading: boolean
  error: string | null
  hasCompletedSetup: boolean
}

const UserConfigContext = createContext<UserConfigContextValue | null>(null)

interface UserConfigProviderProps {
  children: ReactNode
}

export function UserConfigProvider({ children }: UserConfigProviderProps) {
  const [writingStyle, setWritingStyleState] = useState<WritingStyle>(DEFAULT_WRITING_STYLE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false)

  const fetchStyle = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch("/api/user/style")
      const json = await res.json()
      if (json.ok && json.data?.writingStyle) {
        setWritingStyleState(json.data.writingStyle)
      }
      if (json.ok && json.data) {
        setHasCompletedSetup(json.data.hasCompletedSetup ?? false)
      }
    } catch {
      setError("Failed to load writing style")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStyle()
  }, [fetchStyle])

  const setWritingStyle = useCallback(
    async (style: WritingStyle) => {
      setWritingStyleState(style)
      try {
        const res = await fetch("/api/user/style", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(style),
        })
        const json = await res.json()
        if (!json.ok) {
          setWritingStyleState(writingStyle)
          setError(json.error ?? "Failed to save writing style")
        } else {
          setHasCompletedSetup(true)
        }
      } catch {
        setError("Network error saving style")
      }
    },
    [writingStyle]
  )

  return (
    <UserConfigContext.Provider value={{ writingStyle, setWritingStyle, isLoading, error, hasCompletedSetup }}>
      {children}
    </UserConfigContext.Provider>
  )
}

export function useUserConfig(): UserConfigContextValue {
  const ctx = useContext(UserConfigContext)
  if (!ctx) {
    throw new Error("useUserConfig must be used within UserConfigProvider")
  }
  return ctx
}

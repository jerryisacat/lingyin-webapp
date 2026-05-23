"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface EncryptionSession {
  password: string | null
  salt: string | null
  unlockedAt: number | null
}

interface EncryptionContextValue {
  session: EncryptionSession
  unlock: (password: string, salt: string) => void
  lock: () => void
  isUnlocked: boolean
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null)

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<EncryptionSession>({
    password: null,
    salt: null,
    unlockedAt: null,
  })

  const unlock = useCallback((password: string, salt: string) => {
    setSession({ password, salt, unlockedAt: Date.now() })
  }, [])

  const lock = useCallback(() => {
    setSession({ password: null, salt: null, unlockedAt: null })
  }, [])

  return (
    <EncryptionContext.Provider
      value={{ session, unlock, lock, isUnlocked: session.password !== null }}
    >
      {children}
    </EncryptionContext.Provider>
  )
}

export function useEncryption(): EncryptionContextValue {
  const ctx = useContext(EncryptionContext)
  if (!ctx) {
    throw new Error("useEncryption must be used within EncryptionProvider")
  }
  return ctx
}

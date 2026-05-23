import { describe, it, expect } from "vitest"

// Mock env before import
process.env.API_KEY_ENCRYPTION_KEY = "a".repeat(64)

const { encryptApiKey, decryptApiKey } = await import("../crypto")

describe("crypto", () => {
  it("encrypt and decrypt round-trip", () => {
    const plaintext = "sk-or-v1-test-key-12345"
    const encrypted = encryptApiKey(plaintext)
    expect(encrypted).not.toBe(plaintext)
    const decrypted = decryptApiKey(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it("produces different ciphertexts for same plaintext", () => {
    const a = encryptApiKey("same-key")
    const b = encryptApiKey("same-key")
    expect(a).not.toBe(b)
  })

  it("throws on missing key", () => {
    delete process.env.API_KEY_ENCRYPTION_KEY
    expect(() => encryptApiKey("test")).toThrow()
  })
})

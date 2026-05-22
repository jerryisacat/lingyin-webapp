import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.API_KEY_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error("API_KEY_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)")
  }
  return Buffer.from(hex, "hex")
}

export function encryptApiKey(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

export function decryptApiKey(encoded: string): string {
  const key = getKey()
  const buffer = Buffer.from(encoded, "base64")

  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}
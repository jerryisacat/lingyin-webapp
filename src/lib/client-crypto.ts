"use client"

const PBKDF2_ITERATIONS = 100_000
const PBKDF2_HASH = "SHA-256"
const AES_KEY_LENGTH = 256
const IV_LENGTH = 12

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buf
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function deriveKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const saltBuffer = base64ToBuffer(saltBase64)

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptMarkdown(
  plaintext: string,
  password: string,
  saltBase64: string
): Promise<string> {
  const key = await deriveKey(password, saltBase64)
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  )

  const encryptedBytes = new Uint8Array(encrypted)
  const authTag = encryptedBytes.slice(encryptedBytes.length - 16)
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16)

  return `${bufferToBase64(iv.buffer)}:${bufferToBase64(authTag.buffer)}:${bufferToBase64(ciphertext.buffer)}`
}

export async function decryptMarkdown(
  encoded: string,
  password: string,
  saltBase64: string
): Promise<string> {
  const parts = encoded.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format")
  }

  const [ivB64, authTagB64, ciphertextB64] = parts
  const key = await deriveKey(password, saltBase64)
  const iv = new Uint8Array(base64ToBuffer(ivB64))
  const authTag = new Uint8Array(base64ToBuffer(authTagB64))
  const ciphertext = new Uint8Array(base64ToBuffer(ciphertextB64))

  const combined = new Uint8Array(ciphertext.length + authTag.length)
  combined.set(ciphertext, 0)
  combined.set(authTag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined
  )

  return new TextDecoder().decode(decrypted)
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  return bufferToBase64(salt.buffer)
}

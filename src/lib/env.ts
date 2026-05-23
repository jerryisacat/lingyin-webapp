function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value
}

export const env = {
  get AUTH_SECRET() { return getEnv("AUTH_SECRET") },
  get API_KEY_ENCRYPTION_KEY() { return getEnv("API_KEY_ENCRYPTION_KEY") },
  get RESEND_API_KEY() { return getEnv("RESEND_API_KEY") },
  get R2_ENDPOINT() { return getEnv("R2_ENDPOINT") },
  get R2_ACCESS_KEY_ID() { return getEnv("R2_ACCESS_KEY_ID") },
  get R2_SECRET_ACCESS_KEY() { return getEnv("R2_SECRET_ACCESS_KEY") },
  get R2_BUCKET() { return getEnv("R2_BUCKET") },
  get KV_REST_API_URL() { return getEnv("KV_REST_API_URL") },
  get KV_REST_API_TOKEN() { return getEnv("KV_REST_API_TOKEN") },
}

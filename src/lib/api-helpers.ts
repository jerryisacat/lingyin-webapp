import { getSessionUserId, jsonOk, jsonError } from "@/lib/auth-helpers"

export async function getUser() {
  return getSessionUserId()
}

export { jsonOk, jsonError }
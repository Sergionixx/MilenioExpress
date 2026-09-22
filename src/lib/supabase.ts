import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { projectId, publicAnonKey } from "../../utils/supabase/info"
import { requestJson } from "./http"

export { ApiError } from "./http"

declare global {
  interface Window {
    __milenioSupabaseClient?: SupabaseClient
  }
}

const supabaseUrl = `https://${projectId}.supabase.co`

// Keep exactly one client during Vite hot reloads and normal browser navigation.

export const supabase =
  window.__milenioSupabaseClient ??
  createClient(supabaseUrl, publicAnonKey, {
    auth: { storageKey: "milenio-express-session" },
  })

window.__milenioSupabaseClient = supabase

export const apiUrl = `${supabaseUrl}/functions/v1/make-server-845b49a4`

export async function apiFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return requestJson(`${apiUrl}${path}`, session?.access_token, init)
}

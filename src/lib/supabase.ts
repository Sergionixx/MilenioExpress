import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { requestJson } from "./http"

export { ApiError } from "./http"

declare global {
  interface Window {
    __milenioSupabaseClient?: SupabaseClient
  }
}

// Public client configuration for the team's Supabase project. Local overrides
// can target another project without changing the generated Figma Make file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "https://rltahgouyixqquspofsf.supabase.co"
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"

// Keep exactly one client during Vite hot reloads and normal browser navigation.

export const supabase =
  window.__milenioSupabaseClient ??
  createClient(supabaseUrl, anonKey, {
    auth: { storageKey: "milenio-express-session" },
  })

window.__milenioSupabaseClient = supabase

export const apiUrl = `${supabaseUrl}/functions/v1/make-server-845b49a4`

export async function apiFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return requestJson(`${apiUrl}${path}`, session?.access_token, init, fetch, anonKey)
}

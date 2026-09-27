import { createClient } from "@supabase/supabase-js"
import { ApiError, requestJson } from "../lib/http"

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || "https://rltahgouyixqquspofsf.supabase.co"
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
// A phone's anonymous identity never replaces the administrator's login.
const client = createClient(url, publicKey, { auth: { storageKey: "milenio-presentation-phone" } })
let entering: Promise<string> | undefined

export async function phoneToken(create = false): Promise<string | undefined> {
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  if (data.session) return data.session.access_token
  if (!create) return undefined
  if (!entering) entering = (async () => {
    const { data, error } = await client.auth.signInAnonymously()
    if (error) throw new Error("No se pudo preparar este teléfono. Intenta de nuevo en unos momentos.")
    if (!data.session) throw new Error("No se pudo guardar la sesión de este teléfono.")
    return data.session.access_token
  })().finally(() => { entering = undefined })
  return entering
}
export async function presentationFetch(path: string, init: RequestInit = {}, token?: string) {
  try {
    return await requestJson(`${url}/functions/v1/make-server-845b49a4/presentation${path}`, token, {
      ...init, signal: init.signal ?? AbortSignal.timeout(12_000),
    }, fetch, publicKey)
  } catch (error) {
    if (token && error instanceof ApiError && error.status === 401) {
      await client.auth.signOut({ scope: "local" }).catch(() => undefined)
      throw new Error("La sesión de este navegador dejó de estar disponible. Vuelve a intentar; puedes seguir rastreando tus paquetes anteriores con sus guías.")
    }
    throw error
  }
}

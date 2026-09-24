import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"

const projectUrl = (process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co").replace(/\/$/, "")
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
const functionUrl = `${projectUrl}/functions/v1/make-server-845b49a4`

async function request(path, { key, method = "GET" } = {}) {
  const response = await fetch(`${functionUrl}${path}`, {
    method,
    headers: { apikey: publicKey, ...(key ? { "X-Presentation-Key": key } : {}) },
    signal: AbortSignal.timeout(10_000),
  })
  return { status: response.status, body: await response.json() }
}

const deniedRun = await request("/presentation/runs", { method: "POST" })
assert.equal(deniedRun.status, 403)
assert.equal(deniedRun.body.code, "ORGANIZER_REQUIRED")
const deniedProjector = await request(`/presentation/runs/${randomUUID()}/shipments`)
assert.equal(deniedProjector.status, 401)
console.log("OK: sin enlace privado no se puede crear una presentación ni abrir el proyector")

const rest = await fetch(`${projectUrl}/rest/v1/presentation_shipments?select=id&limit=1`, {
  headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}` },
  signal: AbortSignal.timeout(10_000),
})
assert.notEqual(rest.status, 200, "La tabla de rutas ya no debe permitir lectura pública")
console.log("OK: lectura pública directa de rutas bloqueada")

if (process.env.MILENIO_ORGANIZER_KEY) {
  const invalid = await request("/presentation/runs/invalid/shipments", { key: process.env.MILENIO_ORGANIZER_KEY })
  assert.equal(invalid.status, 400)
  const absent = await request(`/presentation/runs/${randomUUID()}/shipments`, { key: process.env.MILENIO_ORGANIZER_KEY })
  assert.equal(absent.status, 404)
  console.log("OK: el enlace privado distingue IDs inválidos e inexistentes")
}

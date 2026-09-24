import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"

const projectUrl = (process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co").replace(/\/$/, "")
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
const functionUrl = `${projectUrl}/functions/v1/make-server-845b49a4`

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${functionUrl}${path}`, {
    method,
    headers: {
      apikey: publicKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  })
  return { status: response.status, body: await response.json() }
}

const invalid = await request("/presentation/runs/invalid/shipments")
assert.equal(invalid.status, 400)
assert.equal(invalid.body.code, "INVALID_PRESENTATION")
console.log("OK presentación inválida: HTTP 400")

const nonexistentId = randomUUID()
const absent = await request(`/presentation/runs/${nonexistentId}/shipments`)
assert.equal(absent.status, 404)
assert.equal(absent.body.code, "PRESENTATION_NOT_FOUND")
console.log("OK presentación inexistente: HTTP 404")

const denied = await request("/presentation/runs", { method: "POST" })
assert.equal(denied.status, 401)
assert.equal(denied.body.code, "UNAUTHENTICATED")
console.log("OK creación sin sesión: HTTP 401")

const rest = await fetch(`${projectUrl}/rest/v1/presentation_shipments?select=id&limit=1`, {
  headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}` },
  signal: AbortSignal.timeout(10_000),
})
assert.equal(rest.status, 200, `Lectura pública de datos ficticios: HTTP ${rest.status}`)
assert.ok(Array.isArray(await rest.json()))
console.log("OK lectura pública de la tabla ficticia: HTTP 200")

if (process.env.MILENIO_PRESENTATION_RUN_ID) {
  const list = await request(`/presentation/runs/${process.env.MILENIO_PRESENTATION_RUN_ID}/shipments`)
  assert.equal(list.status, 200)
  assert.ok(Array.isArray(list.body))
  console.log(`OK lectura pública de presentación real: ${list.body.length} envíos`)
}

console.log("La creación de rutas desde dos celulares se comprueba con pnpm test:live-guests.")

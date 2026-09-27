import assert from "node:assert/strict"
import { createClient } from "@supabase/supabase-js"

const projectUrl = (process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co").replace(/\/$/, "")
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
const functionUrl = `${projectUrl}/functions/v1/make-server-845b49a4`
const organizerKey = process.env.MILENIO_ORGANIZER_KEY
if (!organizerKey) throw new Error("Falta MILENIO_ORGANIZER_KEY para probar el enlace privado")

async function enter(name) {
  const client = createClient(projectUrl, publicKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.auth.signInAnonymously({ options: { data: { full_name: name } } })
  assert.ifError(error)
  assert.ok(data.user?.id && data.session?.access_token)
  return { id: data.user.id, token: data.session.access_token, client }
}

async function request(path, expectedStatus, { token, key, method = "GET", body } = {}) {
  const response = await fetch(`${functionUrl}${path}`, {
    method,
    headers: {
      apikey: publicKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(key ? { "X-Presentation-Key": key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  })
  const result = await response.json()
  assert.equal(response.status, expectedStatus, `${method} ${path}: HTTP ${response.status} ${result.code || result.error || ""}`)
  return result
}

await request("/presentation/runs", 403, { method: "POST" })
await request("/presentation/runs", 403, { method: "POST", key: "incorrect" })
const run = await request("/presentation/runs", 201, { method: "POST", key: organizerKey })
const a = await enter("Prueba Celular A")
const b = await enter("Prueba Celular B")
assert.notEqual(a.id, b.id)

const ownBefore = await request(`/presentation/runs/${run.id}/shipments`, 200, { token: a.token })
assert.deepEqual(ownBefore, [])
const orderA = { originCountry: "MX", destinationCountry: "HK", packageName: "Regalo A" }
const orderB = { originCountry: "CO", destinationCountry: "ES", packageName: "Regalo B" }
const routeA = await request(`/presentation/runs/${run.id}/shipments`, 201, { token: a.token, method: "POST", body: orderA })
const routeB = await request(`/presentation/runs/${run.id}/shipments`, 201, { token: b.token, method: "POST", body: orderB })
assert.equal(routeA.participantId, a.id)
assert.equal(routeB.participantId, b.id)
assert.match(routeA.trackingCode, /^[A-HJ-NP-Z2-9]{6}$/)
assert.match(routeB.trackingCode, /^[A-HJ-NP-Z2-9]{6}$/)
assert.notEqual(routeA.trackingCode, routeB.trackingCode)
assert.equal(routeB.packageName, "Regalo B")

const [ownA, ownB, projection] = await Promise.all([
  request(`/presentation/runs/${run.id}/shipments`, 200, { token: a.token }),
  request(`/presentation/runs/${run.id}/shipments`, 200, { token: b.token }),
  request(`/presentation/runs/${run.id}/shipments`, 200, { key: organizerKey }),
])
assert.deepEqual(ownA.map((item) => item.id), [routeA.id])
assert.deepEqual(ownB.map((item) => item.id), [routeB.id])
assert.deepEqual(projection.map((item) => item.id), [routeA.id, routeB.id])
await request(`/presentation/runs/${run.id}/shipments`, 401)
await request(`/presentation/runs/${run.id}/shipments`, 403, { key: "incorrect" })

const untrusted = await request(`/presentation/runs/${run.id}/shipments`, 400, {
  token: b.token, method: "POST", body: { ...orderB, trackingCode: routeA.trackingCode },
})
assert.equal(untrusted.code, "VALIDATION_ERROR")
const tracked = await request(`/presentation/runs/${run.id}/track/${routeB.trackingCode}`, 200)
assert.equal(tracked.packageName, orderB.packageName)
assert.equal("participantId" in tracked, false)
assert.equal("participantName" in tracked, false)
assert.equal("id" in tracked, false)
await request(`/presentation/runs/${run.id}/track/------`, 400)
await request(`/presentation/runs/${run.id}/track/ZZZZZZ`, 404)

const directA = await a.client.from("presentation_shipments").select("id").eq("run_id", run.id)
assert.ifError(directA.error)
assert.deepEqual(directA.data.map((item) => item.id), [routeA.id])
const directB = await b.client.from("presentation_shipments").select("id").eq("run_id", run.id)
assert.ifError(directB.error)
assert.deepEqual(directB.data.map((item) => item.id), [routeB.id])
const publicClient = createClient(projectUrl, publicKey, { auth: { autoRefreshToken: false, persistSession: false } })
const publicRows = await publicClient.from("presentation_shipments").select("id").eq("run_id", run.id)
assert.ok(publicRows.error, "La tabla de presentación no debe permitir lectura pública")

await request("/shipments", 403, { token: a.token, method: "POST", body: { ownerId: a.id, recipient: "Prueba", address: "Calle ficticia", city: "Madrid", description: "Simulación" } })
const unauthorizedWrite = await a.client.from("shipments").insert({ owner_id: a.id, recipient: "Prueba", address: "Calle ficticia", city: "Madrid", description: "Simulación" })
assert.ok(unauthorizedWrite.error, "La tabla administrativa no debe permitir creación por espectadores")

console.log(`OK: presentación ${run.id}; dos guías automáticas de seis caracteres.`)
console.log("OK: rastreo público, listas privadas por teléfono y proyector privado con ambos paquetes.")

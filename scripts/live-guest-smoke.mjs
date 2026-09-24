import assert from "node:assert/strict"
import { createClient } from "@supabase/supabase-js"

const projectUrl = (process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co").replace(/\/$/, "")
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
const functionUrl = `${projectUrl}/functions/v1/make-server-845b49a4`

async function enter(name) {
  const client = createClient(projectUrl, publicKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.auth.signInAnonymously({ options: { data: { full_name: name } } })
  assert.ifError(error)
  assert.ok(data.user?.id && data.session?.access_token)
  return { id: data.user.id, token: data.session.access_token }
}

async function request(path, expectedStatus, { token, method = "GET", body } = {}) {
  const response = await fetch(`${functionUrl}${path}`, {
    method,
    headers: {
      apikey: publicKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  })
  const result = await response.json()
  assert.equal(response.status, expectedStatus, `${method} ${path}: HTTP ${response.status} ${result.code || result.error || ""}`)
  return result
}

const a = await enter("Prueba Celular A")
const b = await enter("Prueba Celular B")
assert.notEqual(a.id, b.id)
const [profileA, profileB] = await Promise.all([
  request("/me", 200, { token: a.token }),
  request("/me", 200, { token: b.token }),
])
assert.equal(profileA.id, a.id)
assert.equal(profileB.id, b.id)
assert.equal(profileA.name, "Prueba Celular A")
assert.equal(profileB.name, "Prueba Celular B")

const run = await request("/presentation/runs", 201, { token: a.token, method: "POST" })
const routeA = await request(`/presentation/runs/${run.id}/shipments`, 201, {
  token: a.token, method: "POST", body: { originCountry: "MX", destinationCountry: "JP" },
})
const routeB = await request(`/presentation/runs/${run.id}/shipments`, 201, {
  token: b.token, method: "POST", body: { originCountry: "CO", destinationCountry: "ES" },
})
const projection = await request(`/presentation/runs/${run.id}/shipments`, 200)
assert.deepEqual(projection.map(({ participantId, participantName }) => ({ participantId, participantName })), [
  { participantId: a.id, participantName: "Prueba Celular A" },
  { participantId: b.id, participantName: "Prueba Celular B" },
])
assert.equal(routeA.participantId, a.id)
assert.equal(routeB.participantId, b.id)

const ownPackage = await request("/shipments", 201, {
  token: a.token,
  method: "POST",
  body: {
    ownerId: a.id,
    recipient: "Destinatario de prueba",
    address: "Calle de prueba 123",
    city: "Ciudad de prueba",
    description: "Paquete ficticio para verificar identidad por celular",
  },
})
assert.equal(ownPackage.ownerId, a.id)
assert.match(ownPackage.guide, /^ME-\d{4}-\d{8,}$/)
const otherPackages = await request("/shipments", 200, { token: b.token })
assert.ok(otherPackages.every((item) => item.ownerId === b.id))
const foreignPackage = await request(`/shipments/${ownPackage.guide}`, 403, { token: b.token })
assert.equal(foreignPackage.code, "FORBIDDEN")
const forbiddenWrite = await request("/shipments", 403, {
  token: b.token,
  method: "POST",
  body: {
    ownerId: a.id,
    recipient: "No autorizado",
    address: "Calle 123",
    city: "Ciudad",
    description: "Debe rechazarse",
  },
})
assert.equal(forbiddenWrite.code, "FORBIDDEN")

console.log(`OK: dos celulares distintos, nombres y rutas separados, proyector público. Presentación ${run.id}.`)
console.log(`OK: paquete ${ownPackage.guide} visible sólo para su celular; acceso ajeno rechazado.`)

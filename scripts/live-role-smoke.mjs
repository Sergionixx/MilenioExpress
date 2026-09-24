import assert from "node:assert/strict"

const projectUrl = (process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co").replace(/\/$/, "")
const publicKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8dC_SpYmjgaIhK2O6mviGA_jiSU9qGB"
const functionUrl = `${projectUrl}/functions/v1/make-server-845b49a4`
const guide = process.env.MILENIO_CLIENT_GUIDE
const foreignGuide = process.env.MILENIO_OPERATOR_GUIDE

for (const key of ["MILENIO_ADMIN_EMAIL", "MILENIO_ADMIN_PASSWORD", "MILENIO_USER_EMAIL", "MILENIO_USER_PASSWORD", "MILENIO_CLIENT_GUIDE", "MILENIO_OPERATOR_GUIDE"]) {
  if (!process.env[key]) throw new Error(`Falta ${key}`)
}

async function signIn(email, password) {
  const response = await fetch(`${projectUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json()
  assert.equal(response.status, 200, `Acceso ${email}: ${body.error_code || body.msg || response.status}`)
  assert.ok(body.access_token, `Acceso ${email}: sin token`)
  return body.access_token
}

async function request(token, path, expectedStatus, expectedCode, init = {}) {
  const response = await fetch(`${functionUrl}${path}`, {
    ...init,
    headers: { apikey: publicKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json()
  assert.equal(response.status, expectedStatus, `${path}: HTTP ${response.status}, ${body.code || "sin código"}`)
  if (expectedCode) assert.equal(body.code, expectedCode, `${path}: código de error`)
  console.log(`OK ${init.method || "GET"} ${path}: ${response.status}${expectedCode ? ` ${expectedCode}` : ""}`)
  return body
}

const adminToken = await signIn(process.env.MILENIO_ADMIN_EMAIL, process.env.MILENIO_ADMIN_PASSWORD)
const userToken = await signIn(process.env.MILENIO_USER_EMAIL, process.env.MILENIO_USER_PASSWORD)
const admin = await request(adminToken, "/me", 200)
const user = await request(userToken, "/me", 200)
assert.equal(admin.role, "ADMIN")
assert.equal(user.role, "USER")
const users = await request(adminToken, "/users", 200)
assert.ok(users.some((item) => item.id === user.id))
await request(userToken, "/users", 403, "FORBIDDEN")
const own = await request(userToken, `/shipments/${guide}`, 200)
assert.equal(own.ownerId, user.id)
await request(userToken, `/shipments/${foreignGuide}`, 403, "FORBIDDEN")
await request(userToken, "/shipments/not-a-guide", 400, "INVALID_GUIDE")
await request(userToken, "/shipments/ME-2026-99999999", 404, "SHIPMENT_NOT_FOUND")
await request(userToken, "/shipments", 200)
await request(userToken, "/shipments", 403, "FORBIDDEN", {
  method: "POST",
  body: JSON.stringify({ ownerId: admin.id, recipient: "Prueba", address: "Prueba 123", city: "Prueba", description: "No debe crearse" }),
})

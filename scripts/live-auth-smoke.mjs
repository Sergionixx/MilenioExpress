import assert from "node:assert/strict"

const projectUrl =
  process.env.VITE_SUPABASE_URL || "https://rltahgouyixqquspofsf.supabase.co"
const base = `${projectUrl.replace(/\/$/, "")}/functions/v1/make-server-845b49a4`

async function check(label, path, expectedStatus, expectedCode, init) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json()
  assert.equal(response.status, expectedStatus, `${label}: HTTP`)
  if (expectedCode) {
    assert.equal(body.code, expectedCode, `${label}: código de error`)
  } else {
    assert.equal(body.status, "ok", `${label}: salud`)
  }
  console.log(
    `OK ${label}: HTTP ${response.status}${
      expectedCode ? ` ${expectedCode}` : ""
    }`,
  )
}

await check("GET /health", "/health", 200)
for (const path of [
  "/me",
  "/users",
  "/shipments",
  "/shipments/ME-2026-00000001",
]) {
  await check(`GET ${path} sin sesión`, path, 401, "UNAUTHENTICATED")
}
await check(
  "POST /shipments sin sesión",
  "/shipments",
  401,
  "UNAUTHENTICATED",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  },
)
await check("GET /me con token inválido", "/me", 401, "INVALID_TOKEN", {
  headers: { Authorization: "Bearer invalid.jwt.token" },
})

import assert from "node:assert/strict"
import test from "node:test"

import { ApiError } from "../src/lib/http.ts"
import { withSessionInvalidation } from "../src/lib/session.ts"

test("a rejected session clears access without replacing the server error", async () => {
  let invalidations = 0
  const denied = new ApiError("La sesión expiró.", 401, "INVALID_TOKEN")
  await assert.rejects(
    withSessionInvalidation(async () => { throw denied }, () => { invalidations++ }),
    (error: unknown) => error === denied,
  )
  assert.equal(invalidations, 1)
})

test("permissions and temporary failures keep the current session", async () => {
  let invalidations = 0
  for (const error of [
    new ApiError("Sin permiso.", 403, "FORBIDDEN"),
    new ApiError("Sin conexión.", 0, "NETWORK_ERROR"),
  ]) {
    await assert.rejects(
      withSessionInvalidation(async () => { throw error }, () => { invalidations++ }),
      (cause: unknown) => cause === error,
    )
  }
  assert.equal(invalidations, 0)
  assert.equal(await withSessionInvalidation(async () => "ok", () => { invalidations++ }), "ok")
  assert.equal(invalidations, 0)
})

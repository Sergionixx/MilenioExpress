import test from "node:test"
import assert from "node:assert/strict"
import {
  validateRegistration,
  registrationErrorMessage,
} from "../src/lib/registration.ts"
const valid = {
  name: "Ana López",
  email: "ana@example.test",
  password: "Paquete-123!",
  confirmation: "Paquete-123!",
}

test("registration validates whitespace, field limits and matching passwords before sending", () => {
  assert.equal(validateRegistration(valid), "")
  assert.equal(
    validateRegistration({
      ...valid,
      name: " Ana López ",
      email: " ana@example.test ",
    }),
    "",
  )
  for (const name of [" ", "A", "a".repeat(121)])
    assert.match(validateRegistration({ ...valid, name }), /nombre completo/)
  for (const email of [
    "sin-correo",
    "a b@example.test",
    "a@b",
    `${"a".repeat(250)}@a.test`,
  ])
    assert.match(
      validateRegistration({ ...valid, email }),
      /correo electrónico válido/,
    )
  assert.match(
    validateRegistration({ ...valid, password: "1234567" }),
    /8 caracteres/,
  )
  assert.match(
    validateRegistration({ ...valid, confirmation: "otra contraseña" }),
    /no coinciden/,
  )
  // Password spaces are significant and must not be silently trimmed.
  assert.match(
    validateRegistration({ ...valid, password: `${valid.password} ` }),
    /no coinciden/,
  )
})

test("registration provides useful provider errors without exposing raw credentials or internals", () => {
  const expected = [
    ["user_already_exists", /inicia sesión/],
    ["email_exists", /inicia sesión/],
    ["weak_password", /más segura/],
    ["email_address_invalid", /correo electrónico/],
    ["over_email_send_rate_limit", /demasiados intentos/],
    ["over_request_rate_limit", /demasiados intentos/],
    ["signup_disabled", /no está disponible/],
    ["email_address_not_authorized", /servicio de correo/],
  ] as const
  for (const [code, message] of expected)
    assert.match(registrationErrorMessage({ code }), message)
  for (const error of [
    null,
    undefined,
    "secreto",
    { code: "unexpected", message: "secreto" },
  ]) {
    assert.match(registrationErrorMessage(error), /Comprueba tu conexión/)
    assert.doesNotMatch(registrationErrorMessage(error), /secreto/)
  }
})

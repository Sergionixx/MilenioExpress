import assert from "node:assert/strict";
import test from "node:test";
import { loginErrorMessage } from "../src/lib/authErrors.ts";

test("login explains invalid credentials, confirmation, throttling and connectivity", () => {
  assert.match(loginErrorMessage({ code: "invalid_credentials" }), /Correo o contraseña incorrectos/);
  assert.match(loginErrorMessage({ code: "email_not_confirmed" }), /Confirma el correo/);
  assert.match(loginErrorMessage({ code: "over_request_rate_limit" }), /demasiados intentos/);
  for (const code of ["network_error", "request_timeout"]) {
    assert.match(loginErrorMessage({ code }), /No se pudo conectar/);
  }
});

test("unrecognized auth failures never disclose provider error details", () => {
  for (const cause of [null, undefined, "secret", {}, { code: "unknown", message: "private provider detail" }]) {
    assert.equal(loginErrorMessage(cause), "No se pudo iniciar sesión. Intenta de nuevo.");
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, requestJson } from "../src/lib/http.ts";

test("sends the session token and returns the server-confirmed guide", async () => {
  let request: RequestInit | undefined;
  const transport: typeof fetch = async (_url, init) => {
    request = init;
    return Response.json({ guide: "ME-2026-00000001" }, { status: 201 });
  };
  const result = await requestJson("https://example.test/shipments", "trusted-token", {
    method: "POST",
    headers: { Authorization: "Bearer forged-token" },
    body: JSON.stringify({ recipient: "Ana" }),
  }, transport, "public-test-key");
  assert.deepEqual(result, { guide: "ME-2026-00000001" });
  assert.equal((request?.headers as Headers).get("Authorization"), "Bearer trusted-token");
  assert.equal((request?.headers as Headers).get("apikey"), "public-test-key");
  assert.equal((request?.headers as Headers).get("Content-Type"), "application/json");
});

test("distinguishes an absent session and a connection failure", async () => {
  const noToken: typeof fetch = async (_url, init) => {
    assert.equal((init?.headers as Headers).get("Authorization"), null);
    return Response.json({ status: "ok" });
  };
  assert.deepEqual(await requestJson("https://example.test/health", undefined, {
    headers: { Authorization: "Bearer forged-token" },
  }, noToken), { status: "ok" });
  const offline: typeof fetch = async () => { throw new Error("private network detail"); };
  await assert.rejects(requestJson("https://example.test/shipments", "token", {}, offline), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 0);
    assert.equal(error.code, "NETWORK_ERROR");
    assert.match(error.message, /No se pudo conectar/);
    assert.doesNotMatch(error.message, /private network detail/);
    return true;
  });
});

test("preserves safe HTTP errors and provides a fallback for malformed error bodies", async () => {
  for (const [status, code] of [[403, "FORBIDDEN"], [404, "SHIPMENT_NOT_FOUND"]] as const) {
    const denied: typeof fetch = async () => Response.json({ error: "No tienes permiso.", code }, { status });
    await assert.rejects(requestJson("https://example.test/shipments/x", "token", {}, denied), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      assert.equal(error.code, code);
      assert.equal(error.message, "No tienes permiso.");
      return true;
    });
  }
  const malformed: typeof fetch = async () => new Response("not-json", { status: 500 });
  await assert.rejects(requestJson("https://example.test/shipments", "token", {}, malformed), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 500);
    assert.equal(error.code, "REQUEST_FAILED");
    assert.equal(error.message, "No se pudo completar la solicitud.");
    return true;
  });
});

test("non-object and malformed error fields retain HTTP status without crashing", async () => {
  for (const body of [null, "failure", [], { error: { secret: true }, code: 503 }, { error: "", code: "" }]) {
    const transport: typeof fetch = async () => Response.json(body, { status: 503 });
    await assert.rejects(requestJson("https://example.test/shipments", "token", {}, transport), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      assert.equal(error.code, "REQUEST_FAILED");
      assert.equal(error.message, "No se pudo completar la solicitud.");
      return true;
    });
  }
});

test("a malformed success response is reported as an actionable API error", async () => {
  const transport: typeof fetch = async () => new Response("<html>proxy error</html>");
  await assert.rejects(requestJson("https://example.test/shipments", "token", {}, transport), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, "INVALID_RESPONSE");
    assert.match(error.message, /respuesta no válida/);
    assert.doesNotMatch(error.message, /proxy error/);
    return true;
  });
});

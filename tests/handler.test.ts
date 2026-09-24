import assert from "node:assert/strict";
import test from "node:test";
import { API_BASE, createShipmentHandler } from "../supabase/functions/server/handler.ts";
import { createShipmentService, type ShipmentRepository } from "../supabase/functions/server/service.ts";
import type { ProfileRow, ShipmentRow } from "../supabase/functions/server/domain.ts";

const ownerId = "11111111-1111-4111-8111-111111111111";
const adminId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const owner: ProfileRow = { id: ownerId, email: "owner@example.test", display_name: "Ana", role: "USER" };
const admin: ProfileRow = { id: adminId, email: "admin@example.test", display_name: "Max", role: "ADMIN" };
const input = { ownerId, recipient: "Ana", address: "Reforma 123", city: "CDMX", description: "Documentos" };
const row: ShipmentRow = {
  id: "shipment-1", guide: "ME-2026-00000001", owner_id: ownerId,
  recipient: input.recipient, address: input.address, city: input.city, description: input.description,
  status: "Registrado", created_at: "2026-09-24T12:00:00.000Z",
};

function repository(overrides: Partial<ShipmentRepository> = {}): ShipmentRepository {
  const tokens = new Map([["admin-token", admin], ["owner-token", owner]]);
  return {
    verifyToken: async (token) => tokens.get(token) ?? null,
    getProfile: async (id) => [owner, admin].find((profile) => profile.id === id) ?? null,
    listProfiles: async () => [owner, admin],
    listShipments: async () => [row],
    getShipment: async (guide) => guide === row.guide ? row : null,
    createShipment: async () => row,
    ...overrides,
  };
}

function request(path: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return new Request(`https://api.example.test${API_BASE}${path}`, { ...init, headers });
}

async function checkError(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(body.code, code);
  assert.equal(typeof body.error, "string");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
}

test("health and preflight require no database and carry safe response headers", async () => {
  const handler = createShipmentHandler(() => { throw new Error("must not access database"); });
  const health = await handler(request("/health"));
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.equal(health.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(health.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(health.headers.get("X-Frame-Options"), "DENY");
  assert.equal(health.headers.get("Referrer-Policy"), "no-referrer");
  const preflight = await handler(request("/shipments", undefined, { method: "OPTIONS" }));
  assert.equal(preflight.status, 204);
  assert.equal(await preflight.text(), "");
  assert.match(preflight.headers.get("Access-Control-Allow-Headers")!, /Authorization/);
});

test("an explicit CORS allowlist permits only configured browser origins", async () => {
  const handler = createShipmentHandler(() => createShipmentService(repository()), {
    allowedOrigins: ["https://app.example.test"],
  });
  const allowed = await handler(request("/me", "owner-token", { headers: { Origin: "https://app.example.test" } }));
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), "https://app.example.test");
  assert.equal(allowed.headers.get("Vary"), "Origin");
  const rejected = await handler(request("/me", "owner-token", { headers: { Origin: "https://evil.example.test" } }));
  assert.equal(rejected.headers.get("Access-Control-Allow-Origin"), null);
  await checkError(rejected, 403, "ORIGIN_NOT_ALLOWED");
  const nonBrowser = await handler(request("/me", "owner-token"));
  assert.equal(nonBrowser.status, 200);
  assert.equal(nonBrowser.headers.get("Access-Control-Allow-Origin"), null);
});

test("every protected HTTP operation rejects absent, malformed and invalid tokens", async () => {
  const handler = createShipmentHandler(() => createShipmentService(repository()));
  for (const [path, method] of [["/me", "GET"], ["/users", "GET"], ["/shipments", "GET"], ["/shipments", "POST"], [`/shipments/${row.guide}`, "GET"]]) {
    await checkError(await handler(request(path, undefined, { method })), 401, "UNAUTHENTICATED");
    await checkError(await handler(request(path, "invalid-or-expired", { method })), 401, "INVALID_TOKEN");
    for (const authorization of ["Basic owner-token", "Bearer token extra", "Bearer"]) {
      await checkError(await handler(request(path, undefined, { method, headers: { Authorization: authorization } })), 401, "UNAUTHENTICATED");
    }
  }
});

test("HTTP returns only the server profile and enforces ADMIN operations", async () => {
  const handler = createShipmentHandler(() => createShipmentService(repository()));
  const me = await handler(request("/me", "owner-token"));
  assert.deepEqual(await me.json(), { id: ownerId, email: owner.email, name: owner.display_name, role: "USER" });
  await checkError(await handler(request("/users", "owner-token")), 403, "FORBIDDEN");
  const post = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) };
  await checkError(await handler(request("/shipments", "owner-token", post)), 403, "FORBIDDEN");
  const created = await handler(request("/shipments", "admin-token", post));
  assert.equal(created.status, 201);
  assert.equal((await created.json()).guide, row.guide);
  const users = await handler(request("/users", "admin-token"));
  assert.equal((await users.json()).length, 2);
});

test("HTTP lists owner-scoped shipments and refuses another user's guide", async () => {
  const foreign = { ...row, guide: "ME-2026-00000002", owner_id: otherId };
  const handler = createShipmentHandler(() => createShipmentService(repository({
    listShipments: async () => [row, foreign],
    getShipment: async (guide) => [row, foreign].find((shipment) => shipment.guide === guide) ?? null,
  })));
  const list = await handler(request("/shipments", "owner-token"));
  assert.deepEqual((await list.json()).map((item: { guide: string }) => item.guide), [row.guide]);
  const own = await handler(request(`/shipments/${row.guide}`, "owner-token"));
  assert.equal((await own.json()).ownerId, ownerId);
  await checkError(await handler(request(`/shipments/${foreign.guide}`, "owner-token")), 403, "FORBIDDEN");
  await checkError(await handler(request("/shipments/ME-2026-99999999", "owner-token")), 404, "SHIPMENT_NOT_FOUND");
  await checkError(await handler(request("/shipments/invalid", "owner-token")), 400, "INVALID_GUIDE");
});

test("HTTP validates JSON media type, syntax and untrusted registration fields", async () => {
  const handler = createShipmentHandler(() => createShipmentService(repository()));
  for (const contentType of ["text/plain", "application/json-impostor", ""]) {
    await checkError(await handler(request("/shipments", "admin-token", {
      method: "POST", headers: { "Content-Type": contentType }, body: JSON.stringify(input),
    })), 400, "VALIDATION_ERROR");
  }
  for (const body of ["{invalid", "", "null", JSON.stringify({ ...input, role: "ADMIN" })]) {
    await checkError(await handler(request("/shipments", "admin-token", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
    })), 400, "VALIDATION_ERROR");
  }
  await checkError(await handler(request("/shipments", "admin-token", {
    method: "POST", headers: { "Content-Type": "application/json" },
  })), 400, "VALIDATION_ERROR");
  const charset = await handler(request("/shipments", "admin-token", {
    method: "POST", headers: { "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(input),
  }));
  assert.equal(charset.status, 201);
});

test("HTTP rejects oversized bodies with and without a declared byte count", async () => {
  let creations = 0;
  const handler = createShipmentHandler(() => createShipmentService(repository({
    createShipment: async () => { creations++; return row; },
  })));
  for (const headers of [
    { "Content-Type": "application/json", "Content-Length": "16385" },
    { "Content-Type": "application/json" },
  ]) {
    await checkError(await handler(request("/shipments", "admin-token", {
      method: "POST", headers, body: JSON.stringify({ ...input, description: "á".repeat(9000) }),
    })), 413, "PAYLOAD_TOO_LARGE");
  }
  assert.equal(creations, 0);
});

test("HTTP uses stable route/method errors and masks server infrastructure failures", async () => {
  const handler = createShipmentHandler(() => createShipmentService(repository()));
  await checkError(await handler(request("/missing")), 404, "NOT_FOUND");
  const method = await handler(request("/shipments", "admin-token", { method: "DELETE" }));
  assert.equal(method.headers.get("Allow"), "GET, POST, OPTIONS");
  await checkError(method, 405, "METHOD_NOT_ALLOWED");
  await checkError(await handler(request("/health", undefined, { method: "POST" })), 405, "METHOD_NOT_ALLOWED");
  const unavailable = createShipmentHandler(() => createShipmentService(repository({
    getProfile: async () => { throw new Error("private database detail"); },
  })));
  await checkError(await unavailable(request("/me", "owner-token")), 503, "SERVICE_UNAVAILABLE");
  let reported = 0;
  const broken = createShipmentHandler(() => { throw new Error("private service key"); }, {
    onUnexpectedError: () => { reported++; },
  });
  const response = await broken(request("/me", "owner-token"));
  assert.doesNotMatch(await response.clone().text(), /private service key/);
  await checkError(response, 500, "INTERNAL_ERROR");
  assert.equal(reported, 1);
  const withoutLogger = createShipmentHandler(() => { throw new Error("private details"); });
  await checkError(await withoutLogger(request("/me", "owner-token")), 500, "INTERNAL_ERROR");
});

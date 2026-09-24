import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";

// This test creates and removes fictitious accounts and packages. It is only
// allowed against a local Supabase stack, never the team's shared project.
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
function requireLocalUrl(value) {
  const url = new URL(value);
  assert.ok(loopbackHosts.has(url.hostname), "Integration requires a loopback Supabase URL.");
  assert.ok(["http:", "https:"].includes(url.protocol), "Unsupported local protocol.");
  assert.ok(!url.username && !url.password && !url.search && !url.hash, "The local URL must not contain credentials or query data.");
  return url;
}

function required(name, fallback) {
  const value = process.env[name] || (fallback && process.env[fallback]);
  assert.ok(value, `Missing environment variable: ${name}.`);
  return value;
}

const configuredUrl = requireLocalUrl(required("SUPABASE_URL"));
assert.equal(configuredUrl.pathname, "/", "SUPABASE_URL must identify the local API root.");
const projectUrl = configuredUrl.origin;
const anonKey = required("SUPABASE_ANON_KEY", "ANON_KEY");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY");
const jwtSecret = required("SUPABASE_JWT_SECRET", "JWT_SECRET");
const functionUrl = `${projectUrl}/functions/v1/make-server-845b49a4`;
const output = "reportes/integracion/resultados.json";
const runId = randomUUID();
const createdUsers = [];
const started = new Date();
const report = {
  schemaVersion: 1,
  runId,
  startedAt: started.toISOString(),
  revision: process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  target: projectUrl,
  environment: "Supabase local: Auth, PostgreSQL, RLS y Edge Function reales",
  syntheticData: true,
  status: "running",
  cases: [],
  cleanup: { status: "pending" },
};

async function localFetch(input, init = {}) {
  const target = input instanceof Request ? input.url : String(input);
  const url = requireLocalUrl(target);
  assert.equal(url.origin, projectUrl, "Integration requests must stay on the configured local origin.");
  const timeout = AbortSignal.timeout(30_000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  // Prevent a local endpoint from redirecting a test or credential to a remote URL.
  return fetch(input, { ...init, signal, redirect: "error" });
}

function client(key) {
  return createClient(projectUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { fetch: localFetch },
  });
}

const adminDb = client(serviceKey);
const ownerClient = client(anonKey);
const operatorClient = client(anonKey);

function checkResult(result, description) {
  assert.equal(result.error, null, description);
  return result.data;
}

async function scenario(id, label, operation) {
  const begin = Date.now();
  try {
    await operation();
    report.cases.push({ id, label, status: "passed", durationMs: Date.now() - begin });
    console.log(`PASS ${id}: ${label}`);
  } catch (error) {
    // Do not serialize assertion objects, SDK errors, session data or requests:
    // provider exceptions can contain passwords, Authorization headers or JWTs.
    report.cases.push({ id, label, status: "failed", durationMs: Date.now() - begin,
      failure: { kind: error?.name === "AssertionError" ? "assertion" : "runtime", detail: "La comprobación no cumplió su expectativa; revisar el escenario identificado." } });
    throw new Error(`Failed integration scenario ${id}.`);
  }
}

async function request(path, token, expectedStatus, expectedCode, init = {}) {
  const headers = new Headers({ apikey: anonKey, "Content-Type": "application/json", ...init.headers });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await localFetch(`${functionUrl}${path}`, { ...init, headers });
  assert.equal(response.status, expectedStatus, `${init.method || "GET"} ${path}: unexpected HTTP status.`);
  const body = await response.json();
  if (expectedCode) assert.equal(body.code, expectedCode, `${path}: unexpected error code.`);
  return body;
}

function signLocalJwt(claims) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${createHmac("sha256", jwtSecret).update(unsigned).digest("base64url")}`;
}

let owner;
let operator;
let ownerToken;
let operatorToken;
let ownShipment;
let foreignShipment;
const password = randomBytes(30).toString("base64url");
const input = {
  recipient: "Persona ficticia de integración", address: "Calle de prueba 123",
  city: "Ciudad de prueba", description: "Paquete de integración sin datos personales reales",
};

try {
  await scenario("INT-01", "Función local disponible", async () => {
    const health = await request("/health", undefined, 200);
    assert.equal(health.status, "ok");
  });

  await scenario("INT-02", "Cuentas ficticias y perfiles creados por el trigger; rol confiable", async () => {
    for (const [label, name] of [["owner", "Usuario de integración"], ["operator", "Operador de integración"]]) {
      const data = checkResult(await adminDb.auth.admin.createUser({
        email: `${label}.${runId}@example.test`, password, email_confirm: true,
        user_metadata: { full_name: name, role: "ADMIN" },
      }), "The local test account must be created.");
      createdUsers.push(data.user.id);
      const profile = checkResult(await adminDb.from("profiles").select("id,role").eq("id", data.user.id).single(), "The auth trigger must create the profile.");
      // Even explicitly submitted editable metadata must not grant ADMIN.
      assert.equal(profile.role, "USER");
      if (label === "owner") owner = data.user;
      else operator = data.user;
    }
    checkResult(await adminDb.from("profiles").update({ role: "ADMIN" }).eq("id", operator.id), "Only the trusted setup promotes the operator.");
  });

  await scenario("INT-03", "Login real y roles ADMIN/USER recuperados del servidor", async () => {
    const ownerSession = checkResult(await ownerClient.auth.signInWithPassword({ email: owner.email, password }), "Owner login must succeed.");
    const operatorSession = checkResult(await operatorClient.auth.signInWithPassword({ email: operator.email, password }), "Operator login must succeed.");
    ownerToken = ownerSession.session.access_token;
    operatorToken = operatorSession.session.access_token;
    assert.equal((await request("/me", ownerToken, 200)).role, "USER");
    assert.equal((await request("/me", operatorToken, 200)).role, "ADMIN");
    const users = await request("/users", operatorToken, 200);
    assert.ok(users.some((profile) => profile.id === owner.id));
  });

  await scenario("INT-04", "Ausencia de JWT y JWT inválido rechazados en rutas protegidas", async () => {
    for (const path of ["/me", "/users", "/shipments", "/shipments/ME-2026-00000001"]) {
      await request(path, undefined, 401, "UNAUTHENTICATED");
      await request(path, "invalid.jwt.token", 401, "INVALID_TOKEN");
    }
    await request("/shipments", undefined, 401, "UNAUTHENTICATED", { method: "POST", body: "{}" });
  });

  await scenario("INT-05", "JWT firmado válido aceptado y la misma identidad con JWT vencido rechazada", async () => {
    const claims = JSON.parse(Buffer.from(ownerToken.split(".")[1], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    const valid = signLocalJwt({ ...claims, iat: now - 1, nbf: now - 1, exp: now + 120 });
    assert.equal((await request("/me", valid, 200)).id, owner.id);
    const expired = signLocalJwt({ ...claims, iat: now - 7200, nbf: now - 7200, exp: now - 3600 });
    await request("/me", expired, 401, "INVALID_TOKEN");
  });

  await scenario("INT-06", "ADMIN crea dos paquetes y recibe guías persistidas distintas", async () => {
    ownShipment = await request("/shipments", operatorToken, 201, undefined, {
      method: "POST", body: JSON.stringify({ ...input, ownerId: owner.id }),
    });
    foreignShipment = await request("/shipments", operatorToken, 201, undefined, {
      method: "POST", body: JSON.stringify({ ...input, ownerId: operator.id }),
    });
    assert.match(ownShipment.guide, /^ME-\d{4}-\d{8,}$/);
    assert.match(foreignShipment.guide, /^ME-\d{4}-\d{8,}$/);
    assert.notEqual(ownShipment.guide, foreignShipment.guide);
    const stored = checkResult(await adminDb.from("shipments").select("guide,owner_id,status").eq("guide", ownShipment.guide).single(), "The created package must exist in PostgreSQL.");
    assert.equal(stored.owner_id, owner.id);
    assert.equal(stored.status, "Registrado");
  });

  await scenario("INT-07", "USER consulta datos propios y ADMIN consulta datos ajenos", async () => {
    const found = await request(`/shipments/${ownShipment.guide}`, ownerToken, 200);
    assert.equal(found.ownerId, owner.id);
    assert.equal(found.recipient, input.recipient);
    const rows = await request("/shipments", ownerToken, 200);
    assert.ok(rows.some((row) => row.guide === ownShipment.guide));
    assert.ok(rows.every((row) => row.ownerId === owner.id));
    const operatorRead = await request(`/shipments/${ownShipment.guide}`, operatorToken, 200);
    assert.equal(operatorRead.guide, ownShipment.guide);
  });

  await scenario("INT-08", "USER no crea, no lista propietarios y no consulta guías ajenas", async () => {
    await request("/users", ownerToken, 403, "FORBIDDEN");
    await request("/shipments", ownerToken, 403, "FORBIDDEN", {
      method: "POST", body: JSON.stringify({ ...input, ownerId: owner.id }),
    });
    await request(`/shipments/${foreignShipment.guide}`, ownerToken, 403, "FORBIDDEN");
  });

  await scenario("INT-09", "Guías inválidas/inexistentes y campos adulterados reciben errores claros", async () => {
    await request("/shipments/not-a-guide", ownerToken, 400, "INVALID_GUIDE");
    await request("/shipments/ME-1900-99999999999999", ownerToken, 404, "SHIPMENT_NOT_FOUND");
    await request("/shipments", operatorToken, 400, "VALIDATION_ERROR", {
      method: "POST", body: JSON.stringify({ ...input, ownerId: owner.id, role: "ADMIN" }),
    });
  });

  await scenario("INT-10", "RLS permite lectura propia y excluye filas ajenas en acceso directo", async () => {
    const own = checkResult(await ownerClient.from("shipments").select("guide,owner_id").eq("guide", ownShipment.guide), "Direct owner read must succeed.");
    assert.equal(own.length, 1);
    const foreign = checkResult(await ownerClient.from("shipments").select("guide").eq("guide", foreignShipment.guide), "RLS filters a foreign record without disclosing it.");
    assert.equal(foreign.length, 0);
    const profiles = checkResult(await ownerClient.from("profiles").select("id,role"), "Direct profile read must succeed.");
    assert.ok(profiles.length > 0 && profiles.every((profile) => profile.id === owner.id));
  });

  await scenario("INT-11", "RLS/permisos rechazan inserción USER y elevación de rol directa", async () => {
    const insert = await ownerClient.from("shipments").insert({
      owner_id: owner.id, recipient: input.recipient, address: input.address,
      city: input.city, description: input.description,
    });
    assert.equal(insert.error?.code, "42501", "Direct USER creation must be denied by the database.");
    const escalation = await ownerClient.from("profiles").update({ role: "ADMIN" }).eq("id", owner.id);
    assert.equal(escalation.error?.code, "42501", "Profile role updates must be denied by database privileges.");
    const profile = checkResult(await adminDb.from("profiles").select("role").eq("id", owner.id).single(), "The trusted profile must remain readable.");
    assert.equal(profile.role, "USER");
  });

  await scenario("INT-12", "Acceso anónimo directo no obtiene ni registra paquetes", async () => {
    const anonymous = client(anonKey);
    const read = await anonymous.from("shipments").select("guide");
    assert.equal(read.error?.code, "42501");
    const insert = await anonymous.from("shipments").insert({
      owner_id: owner.id, recipient: input.recipient, address: input.address,
      city: input.city, description: input.description,
    });
    assert.equal(insert.error?.code, "42501");
  });

  await scenario("INT-13", "La restricción UNIQUE rechaza colisión de guía sin sobrescribir", async () => {
    // INSERT's trigger replaces a caller's guide. A service-role UPDATE reaches
    // the unique constraint directly and demonstrates its 23505 protection.
    const duplicate = await adminDb.from("shipments").update({ guide: ownShipment.guide }).eq("guide", foreignShipment.guide);
    assert.equal(duplicate.error?.code, "23505");
    const unchanged = checkResult(await adminDb.from("shipments").select("guide,owner_id").eq("guide", foreignShipment.guide).single(), "The foreign package must survive the rejected collision.");
    assert.equal(unchanged.owner_id, operator.id);
    const original = checkResult(await adminDb.from("shipments").select("owner_id").eq("guide", ownShipment.guide).single(), "The original package must remain unchanged.");
    assert.equal(original.owner_id, owner.id);
  });

  await scenario("INT-14", "Logout local retira la sesión usada por el cliente", async () => {
    checkResult(await ownerClient.auth.signOut({ scope: "local" }), "Local logout must succeed.");
    const session = checkResult(await ownerClient.auth.getSession(), "Session storage must remain readable.");
    assert.equal(session.session, null);
    await request("/shipments", undefined, 401, "UNAUTHENTICATED");
  });
  report.status = "passed";
} catch {
  report.status = "failed";
  process.exitCode = 1;
} finally {
  try {
    if (createdUsers.length) {
      checkResult(await adminDb.from("shipments").delete().in("owner_id", createdUsers), "Synthetic shipments must be removed.");
      for (const id of createdUsers) checkResult(await adminDb.auth.admin.deleteUser(id), "Synthetic accounts must be removed.");
    }
    report.cleanup = { status: "passed", accountsRemoved: createdUsers.length };
  } catch {
    report.cleanup = { status: "failed", detail: "No se pudo completar la limpieza del entorno local aislado." };
    report.status = "failed";
    process.exitCode = 1;
  }
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - started.getTime();
  report.summary = {
    passed: report.cases.filter((entry) => entry.status === "passed").length,
    failed: report.cases.filter((entry) => entry.status === "failed").length,
    totalPlanned: 14,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Integration ${report.status}: ${report.summary.passed}/14 scenarios. Report: ${output}`);
}

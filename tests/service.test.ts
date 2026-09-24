import assert from "node:assert/strict";
import test from "node:test";

import { AppError, type Actor, type ProfileRow, type ShipmentRow } from "../supabase/functions/server/domain.ts";
import { createShipmentService, type ShipmentRepository } from "../supabase/functions/server/service.ts";

const ownerId = "11111111-1111-4111-8111-111111111111";
const adminId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const owner: ProfileRow = { id: ownerId, email: "owner@example.com", display_name: "Ana", role: "USER" };
const admin: ProfileRow = { id: adminId, email: "admin@example.com", display_name: "Sergionix", role: "ADMIN" };
const ownerActor: Actor = { id: ownerId, email: owner.email, name: owner.display_name, role: "USER" };
const adminActor: Actor = { id: adminId, email: admin.email, name: admin.display_name, role: "ADMIN" };
const input = {
  ownerId,
  recipient: "Ana López",
  address: "Reforma 123",
  city: "Ciudad de México",
  description: "Documentos",
};
const shipment: ShipmentRow = {
  id: "shipment-1",
  guide: "ME-2026-00000001",
  owner_id: ownerId,
  recipient: input.recipient,
  address: input.address,
  city: input.city,
  description: input.description,
  status: "Registrado",
  created_at: "2026-09-22T12:00:00.000Z",
};
const foreignShipment: ShipmentRow = {
  ...shipment,
  id: "shipment-2",
  guide: "ME-2026-00000002",
  owner_id: otherId,
};

function repository(overrides: Partial<ShipmentRepository> = {}): ShipmentRepository {
  return {
    verifyToken: async (token) => token === "valid-token" ? { id: ownerId, email: owner.email } : null,
    getProfile: async (id) => id === ownerId ? owner : id === adminId ? admin : null,
    listProfiles: async () => [owner, admin],
    listShipments: async () => [shipment, foreignShipment],
    getShipment: async (guide) => guide === shipment.guide ? shipment : guide === foreignShipment.guide ? foreignShipment : null,
    createShipment: async () => shipment,
    ...overrides,
  };
}

async function assertAppError(promise: Promise<unknown>, status: number, code: string) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

test("authentication requires a verified token and a trusted authorized profile", async () => {
  const service = createShipmentService(repository());
  await assertAppError(service.authenticate(undefined), 401, "UNAUTHENTICATED");
  await assertAppError(service.authenticate("bad-token"), 401, "INVALID_TOKEN");
  await assertAppError(createShipmentService(repository({ getProfile: async () => null })).authenticate("valid-token"), 403, "PROFILE_REQUIRED");
  await assertAppError(createShipmentService(repository({ getProfile: async () => ({ ...owner, role: "UNKNOWN" as ProfileRow["role"] }) })).authenticate("valid-token"), 403, "PROFILE_REQUIRED");

  assert.deepEqual(await service.authenticate("valid-token"), ownerActor);
  const privileged = createShipmentService(repository({
    verifyToken: async () => ({ id: adminId, email: admin.email }),
  }));
  assert.deepEqual(await privileged.authenticate("valid-token"), adminActor);
});

test("authentication masks identity/profile infrastructure errors", async () => {
  const failedAuth = createShipmentService(repository({ verifyToken: async () => { throw new Error("secret auth endpoint"); } }));
  await assertAppError(failedAuth.authenticate("valid-token"), 503, "SERVICE_UNAVAILABLE");
  const failedProfile = createShipmentService(repository({ getProfile: async () => { throw new Error("secret database DSN"); } }));
  await assertAppError(failedProfile.authenticate("valid-token"), 503, "SERVICE_UNAVAILABLE");
});

test("only ADMIN can list owners, and profiles expose no role or internal fields", async () => {
  let calls = 0;
  const service = createShipmentService(repository({ listProfiles: async () => { calls++; return [owner, admin]; } }));
  await assertAppError(service.listUsers(ownerActor), 403, "FORBIDDEN");
  assert.equal(calls, 0);
  assert.deepEqual(await service.listUsers(adminActor), [
    { id: ownerId, email: owner.email, name: "Ana" },
    { id: adminId, email: admin.email, name: "Sergionix" },
  ]);
  await assertAppError(createShipmentService(repository({ listProfiles: async () => { throw new Error("database down"); } })).listUsers(adminActor), 503, "SERVICE_UNAVAILABLE");
});

test("USER shipment list is owner scoped and filters any improperly returned rows", async () => {
  const requestedOwnerIds: Array<string | undefined> = [];
  const service = createShipmentService(repository({
    listShipments: async (ownerFilter) => {
      requestedOwnerIds.push(ownerFilter);
      return [shipment, foreignShipment];
    },
  }));
  const userRows = await service.listShipments(ownerActor);
  assert.deepEqual(requestedOwnerIds, [ownerId]);
  assert.deepEqual(userRows.map((row) => row.guide), [shipment.guide]);
  const adminRows = await service.listShipments(adminActor);
  assert.deepEqual(requestedOwnerIds, [ownerId, undefined]);
  assert.deepEqual(adminRows.map((row) => row.guide), [shipment.guide, foreignShipment.guide]);
  await assertAppError(createShipmentService(repository({ listShipments: async () => { throw new Error("database down"); } })).listShipments(ownerActor), 503, "SERVICE_UNAVAILABLE");
});

test("guide lookup distinguishes invalid, absent and unauthorized shipments", async () => {
  let queries = 0;
  const service = createShipmentService(repository({
    getShipment: async (guide) => {
      queries++;
      return guide === shipment.guide ? shipment : guide === foreignShipment.guide ? foreignShipment : null;
    },
  }));
  await assertAppError(service.getShipment(ownerActor, "invalid-guide"), 400, "INVALID_GUIDE");
  assert.equal(queries, 0);
  await assertAppError(service.getShipment(ownerActor, "ME-2026-99999999"), 404, "SHIPMENT_NOT_FOUND");
  await assertAppError(service.getShipment(ownerActor, foreignShipment.guide), 403, "FORBIDDEN");
  assert.equal((await service.getShipment(ownerActor, shipment.guide)).guide, shipment.guide);
  assert.equal((await service.getShipment(adminActor, foreignShipment.guide)).guide, foreignShipment.guide);
  await assertAppError(createShipmentService(repository({ getShipment: async () => { throw new Error("database down"); } })).getShipment(ownerActor, shipment.guide), 503, "SERVICE_UNAVAILABLE");
});

test("USER registers only for self; ADMIN may register for an existing owner", async () => {
  let profileQueries = 0;
  let creations = 0;
  const service = createShipmentService(repository({
    getProfile: async (id) => { profileQueries++; return id === ownerId ? owner : null; },
    createShipment: async (validated) => {
      creations++;
      assert.deepEqual(validated, input);
      return shipment;
    },
  }));
  await assertAppError(service.createShipment(ownerActor, { ...input, ownerId: otherId }), 403, "FORBIDDEN");
  assert.equal(profileQueries, 0);
  await assertAppError(service.createShipment(adminActor, { ...input, recipient: "" }), 400, "VALIDATION_ERROR");
  assert.equal(profileQueries, 0);
  await assertAppError(service.createShipment(adminActor, { ...input, ownerId: otherId }), 400, "OWNER_NOT_FOUND");
  assert.equal(creations, 0);
  const own = await service.createShipment(ownerActor, input);
  assert.equal(own.ownerId, ownerId);
  const created = await service.createShipment(adminActor, input);
  assert.equal(created.guide, shipment.guide);
  assert.equal(created.ownerId, ownerId);
  assert.equal(creations, 2);
});

test("registration preserves guide conflicts and reports storage outages", async () => {
  const conflict = createShipmentService(repository({ createShipment: async () => { throw new AppError(409, "GUIDE_CONFLICT", "Guía duplicada."); } }));
  await assertAppError(conflict.createShipment(adminActor, input), 409, "GUIDE_CONFLICT");
  const failedCreate = createShipmentService(repository({ createShipment: async () => { throw new Error("secret database DSN"); } }));
  await assertAppError(failedCreate.createShipment(adminActor, input), 503, "SERVICE_UNAVAILABLE");
  const failedOwner = createShipmentService(repository({ getProfile: async () => { throw new Error("database down"); } }));
  await assertAppError(failedOwner.createShipment(adminActor, input), 503, "SERVICE_UNAVAILABLE");
});

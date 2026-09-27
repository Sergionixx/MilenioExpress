import assert from "node:assert/strict";
import test from "node:test";

import { AppError, type Actor } from "../supabase/functions/server/domain.ts";
import { createPresentationService, generateTrackingCode, type PresentationRepository, type PresentationShipmentRow } from "../supabase/functions/server/presentation.ts";

const runId = "11111111-1111-4111-8111-111111111111";
const actor: Actor = { id: "55555555-5555-4555-8555-555555555555", email: "", name: "Ana", role: "USER" };
const organizerKey = "private-organizer-key";
const run = { id: runId, created_at: "2026-09-24T10:00:00.000Z" };
const row: PresentationShipmentRow = {
  id: "33333333-3333-4333-8333-333333333333",
  run_id: runId,
  origin_country: "MX",
  destination_country: "JP",
  participant_id: actor.id,
  participant_name: actor.name,
  package_name: "Regalo para Ana",
  tracking_code: "MX7K2P",
  created_at: "2026-09-24T10:01:00.000Z",
};

function repository(overrides: Partial<PresentationRepository> = {}): PresentationRepository {
  return {
    createRun: async () => run,
    getRun: async (id) => id === runId ? run : null,
    latestRun: async () => run,
    getShipment: async (_runId, guide) => guide === row.tracking_code ? row : null,
    listShipments: async () => [row],
    createShipment: async () => row,
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

test("only the private organizer link starts a presentation", async () => {
  let creations = 0;
  const service = createPresentationService(repository({ createRun: async () => { creations++; return run; } }), organizerKey);
  await assertAppError(service.createRun(undefined), 403, "ORGANIZER_REQUIRED");
  await assertAppError(service.createRun("wrong"), 403, "ORGANIZER_REQUIRED");
  assert.equal(creations, 0);
  assert.deepEqual(await service.createRun(organizerKey), { id: runId, createdAt: run.created_at });
  assert.equal(creations, 1);
});

test("participant reads only own orders while projector key reads all", async () => {
  const filters: Array<string | undefined> = [];
  const service = createPresentationService(repository({ listShipments: async (_id, participantId) => { filters.push(participantId); return [row]; } }), organizerKey);
  await assertAppError(service.listShipments("invalid", actor), 400, "INVALID_PRESENTATION");
  await assertAppError(service.listShipments(runId, null), 401, "UNAUTHENTICATED");
  await assertAppError(service.listShipments(runId, null, "wrong"), 403, "ORGANIZER_REQUIRED");
  await assertAppError(service.listShipments("44444444-4444-4444-8444-444444444444", actor), 404, "PRESENTATION_NOT_FOUND");
  const own = await service.listShipments(runId, actor);
  assert.equal(own[0].packageName, "Regalo para Ana");
  assert.equal(own[0].trackingCode, "MX7K2P");
  await service.listShipments(runId, null, organizerKey);
  assert.deepEqual(filters, [actor.id, undefined]);
});

test("a phone creates a package without supplying a guide or owner", async () => {
  let creations = 0;
  const service = createPresentationService(repository({
    createShipment: async (_id, input, participant) => {
      creations++;
      assert.deepEqual(input, { originCountry: "MX", destinationCountry: "JP", packageName: "Regalo para Ana" });
      assert.deepEqual(participant, { id: actor.id, name: actor.name });
      return row;
    },
  }), organizerKey);
  const input = { originCountry: "MX", destinationCountry: "JP", packageName: "Regalo para Ana" };
  await assertAppError(service.createShipment(actor, runId, { ...input, trackingCode: "MX7K2P" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, originCountry: "ZZ" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, participantId: "another-phone" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, packageName: " " }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, destinationCountry: "MX" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, guide: "not-allowed" }), 400, "VALIDATION_ERROR");
  assert.equal(creations, 0);
  const created = await service.createShipment(actor, runId, input);
  assert.equal(created.trackingCode, "MX7K2P");
  assert.equal(created.participantId, actor.id);
  assert.equal(creations, 1);
});

test("storage errors remain service errors", async () => {
  const service = createPresentationService(repository({ getRun: async () => { throw new Error("secret database endpoint"); } }), organizerKey);
  await assertAppError(service.listShipments(runId, actor), 503, "SERVICE_UNAVAILABLE");
  await assertAppError(service.createShipment(actor, runId, { originCountry: "MX", destinationCountry: "JP", packageName: "Caja" }), 503, "SERVICE_UNAVAILABLE");
});

test("public tracking needs no identity and strips phone and participant data", async () => {
  const service = createPresentationService(repository(), organizerKey);
  const tracked = await service.trackShipment(runId, " mx7k2p ");
  assert.equal(tracked.trackingCode, "MX7K2P");
  assert.equal("participantId" in tracked, false);
  assert.equal("participantName" in tracked, false);
  assert.equal("id" in tracked, false);
  await assertAppError(service.trackShipment(runId, "X"), 400, "INVALID_TRACKING_CODE");
  await assertAppError(service.trackShipment(runId, "ABC234"), 404, "SHIPMENT_NOT_FOUND");
  await assertAppError(service.trackShipment("bad-run", "MX7K2P"), 400, "INVALID_PRESENTATION");
  const legacy = createPresentationService(repository({ getShipment: async (_id, code) => code === "4826" ? { ...row, tracking_code: code } : null }), organizerKey);
  assert.equal((await legacy.trackShipment(runId, "4826")).trackingCode, "4826");
});

test("run metadata is public but does not include private control keys", async () => {
  const service = createPresentationService(repository(), organizerKey);
  assert.deepEqual(await service.latestRun(), { id: runId, createdAt: run.created_at });
  assert.deepEqual(await service.getRun(runId), { id: runId, createdAt: run.created_at });
  await assertAppError(service.getRun("bad"), 400, "INVALID_PRESENTATION");
  await assertAppError(service.getRun("44444444-4444-4444-8444-444444444444"), 404, "PRESENTATION_NOT_FOUND");
  await assertAppError(createPresentationService(repository({ latestRun: async () => null }), organizerKey).latestRun(), 404, "PRESENTATION_NOT_FOUND");
});

test("generated guides have six unambiguous characters", () => {
  for (let index = 0; index < 100; index++) assert.match(generateTrackingCode(), /^[A-HJ-NP-Z2-9]{6}$/);
});

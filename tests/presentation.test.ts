import assert from "node:assert/strict";
import test from "node:test";

import { AppError, type Actor } from "../supabase/functions/server/domain.ts";
import { createPresentationService, type PresentationRepository, type PresentationShipmentRow } from "../supabase/functions/server/presentation.ts";

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
  tracking_code: "4826",
  created_at: "2026-09-24T10:01:00.000Z",
};

function repository(overrides: Partial<PresentationRepository> = {}): PresentationRepository {
  return {
    createRun: async () => run,
    getRun: async (id) => id === runId ? run : null,
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
  assert.equal(own[0].trackingCode, "4826");
  await service.listShipments(runId, null, organizerKey);
  assert.deepEqual(filters, [actor.id, undefined]);
});

test("a guest creates a named package with exactly four digits", async () => {
  let creations = 0;
  const service = createPresentationService(repository({
    createShipment: async (_id, input, participant) => {
      creations++;
      assert.deepEqual(input, { originCountry: "MX", destinationCountry: "JP", packageName: "Regalo para Ana", trackingCode: "4826" });
      assert.deepEqual(participant, { id: actor.id, name: actor.name });
      return row;
    },
  }), organizerKey);
  const input = { originCountry: "MX", destinationCountry: "JP", packageName: "Regalo para Ana", trackingCode: "4826" };
  await assertAppError(service.createShipment(actor, runId, { ...input, trackingCode: "482" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, trackingCode: "48AB" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, packageName: " " }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, destinationCountry: "MX" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(actor, runId, { ...input, guide: "not-allowed" }), 400, "VALIDATION_ERROR");
  assert.equal(creations, 0);
  const created = await service.createShipment(actor, runId, input);
  assert.equal(created.trackingCode, "4826");
  assert.equal(created.participantId, actor.id);
  assert.equal(creations, 1);
});

test("storage errors remain service errors", async () => {
  const service = createPresentationService(repository({ getRun: async () => { throw new Error("secret database endpoint"); } }), organizerKey);
  await assertAppError(service.listShipments(runId, actor), 503, "SERVICE_UNAVAILABLE");
  await assertAppError(service.createShipment(actor, runId, { originCountry: "MX", destinationCountry: "JP", packageName: "Caja", trackingCode: "1234" }), 503, "SERVICE_UNAVAILABLE");
});

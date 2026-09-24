import assert from "node:assert/strict";
import test from "node:test";

import { AppError, type Actor } from "../supabase/functions/server/domain.ts";
import {
  createPresentationService,
  type PresentationRepository,
  type PresentationShipmentRow,
} from "../supabase/functions/server/presentation.ts";

const runId = "11111111-1111-4111-8111-111111111111";
const admin: Actor = { id: "22222222-2222-4222-8222-222222222222", email: "admin@example.com", name: "Operador", role: "ADMIN" };
const user: Actor = { ...admin, role: "USER" };
const run = { id: runId, created_at: "2026-09-24T10:00:00.000Z" };
const row: PresentationShipmentRow = {
  id: "33333333-3333-4333-8333-333333333333",
  run_id: runId,
  origin_country: "MX",
  destination_country: "JP",
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

test("only ADMIN starts presentation runs", async () => {
  let creations = 0;
  const service = createPresentationService(repository({ createRun: async () => { creations++; return run; } }));
  await assertAppError(service.createRun(user), 403, "FORBIDDEN");
  assert.equal(creations, 0);
  assert.deepEqual(await service.createRun(admin), { id: runId, createdAt: run.created_at });
  assert.equal(creations, 1);
});

test("the public projector reads only an existing run and receives clean fields", async () => {
  const service = createPresentationService(repository());
  await assertAppError(service.listShipments("invalid"), 400, "INVALID_PRESENTATION");
  await assertAppError(service.listShipments("44444444-4444-4444-8444-444444444444"), 404, "PRESENTATION_NOT_FOUND");
  assert.deepEqual(await service.listShipments(runId), [{
    id: row.id,
    runId,
    originCountry: "MX",
    destinationCountry: "JP",
    createdAt: row.created_at,
  }]);
});

test("a country pair is validated before an ADMIN creates a projected line", async () => {
  let creations = 0;
  const service = createPresentationService(repository({
    createShipment: async (_id, input) => {
      creations++;
      assert.deepEqual(input, { originCountry: "MX", destinationCountry: "JP" });
      return row;
    },
  }));
  await assertAppError(service.createShipment(user, runId, { originCountry: "MX", destinationCountry: "JP" }), 403, "FORBIDDEN");
  await assertAppError(service.createShipment(admin, runId, { originCountry: "MX", destinationCountry: "MX" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(admin, runId, { originCountry: "MEX", destinationCountry: "JP" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(admin, runId, { originCountry: "MX", destinationCountry: "JP", guide: "fake" }), 400, "VALIDATION_ERROR");
  await assertAppError(service.createShipment(admin, "44444444-4444-4444-8444-444444444444", { originCountry: "MX", destinationCountry: "JP" }), 404, "PRESENTATION_NOT_FOUND");
  assert.equal(creations, 0);
  assert.equal((await service.createShipment(admin, runId, { originCountry: " mx ", destinationCountry: "jp" })).id, row.id);
  assert.equal(creations, 1);
});

test("database failures remain service errors without leaking internals", async () => {
  const service = createPresentationService(repository({ getRun: async () => { throw new Error("secret database endpoint"); } }));
  await assertAppError(service.listShipments(runId), 503, "SERVICE_UNAVAILABLE");
  await assertAppError(service.createShipment(admin, runId, { originCountry: "MX", destinationCountry: "JP" }), 503, "SERVICE_UNAVAILABLE");
});

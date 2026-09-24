import assert from "node:assert/strict";
import test from "node:test";

import {
  AppError,
  canReadShipment,
  isValidGuide,
  toShipmentResponse,
  validateShipmentInput,
  type Actor,
  type ShipmentRow,
} from "../supabase/functions/server/domain.ts";

const ownerId = "11111111-1111-4111-8111-111111111111";
const anotherId = "22222222-2222-4222-8222-222222222222";
const validInput = {
  ownerId,
  recipient: " Ana López ",
  address: " Avenida Reforma 123 ",
  city: " Ciudad de México ",
  description: " Documentos ",
};
const shipment: ShipmentRow = {
  id: "shipment-1",
  guide: "ME-2026-00000001",
  owner_id: ownerId,
  recipient: "Ana López",
  address: "Avenida Reforma 123",
  city: "Ciudad de México",
  description: "Documentos",
  status: "Registrado",
  created_at: "2026-09-22T12:00:00.000Z",
};
const user: Actor = { id: ownerId, email: "ana@example.com", name: "Ana", role: "USER" };

function assertAppError(action: () => unknown, status: number, code: string) {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

test("normalizes the agreed shipment fields before registration", () => {
  assert.deepEqual(validateShipmentInput(validInput), {
    ownerId,
    recipient: "Ana López",
    address: "Avenida Reforma 123",
    city: "Ciudad de México",
    description: "Documentos",
  });
});

test("rejects malformed bodies, untrusted fields and invalid owner IDs", () => {
  for (const body of [null, [], "a shipment"]) {
    assertAppError(() => validateShipmentInput(body), 400, "VALIDATION_ERROR");
  }
  assertAppError(() => validateShipmentInput({ ...validInput, role: "ADMIN" }), 400, "VALIDATION_ERROR");
  assertAppError(() => validateShipmentInput({ ...validInput, ownerId: "not-a-uuid" }), 400, "VALIDATION_ERROR");
});

test("rejects missing, blank, nontext and overlong shipment details", () => {
  for (const field of ["recipient", "address", "city", "description"] as const) {
    for (const value of [undefined, "   ", 42]) {
      assertAppError(() => validateShipmentInput({ ...validInput, [field]: value }), 400, "VALIDATION_ERROR");
    }
  }
  assertAppError(() => validateShipmentInput({ ...validInput, recipient: "X".repeat(161) }), 400, "VALIDATION_ERROR");
  assertAppError(() => validateShipmentInput({ ...validInput, address: "X".repeat(241) }), 400, "VALIDATION_ERROR");
  assertAppError(() => validateShipmentInput({ ...validInput, city: "X".repeat(121) }), 400, "VALIDATION_ERROR");
  assertAppError(() => validateShipmentInput({ ...validInput, description: "X".repeat(2001) }), 400, "VALIDATION_ERROR");
});

test("accepts only guide syntax and authorizes a shipment's owner or ADMIN", () => {
  assert.equal(isValidGuide("ME-2026-00000001"), true);
  for (const guide of ["", "ME-2026-1", "ME-26-00000001", "ME-2026-00000001-extra", "xME-2026-00000001"]) {
    assert.equal(isValidGuide(guide), false, guide);
  }
  assert.equal(canReadShipment(user, shipment), true);
  assert.equal(canReadShipment({ ...user, id: anotherId }, shipment), false);
  assert.equal(canReadShipment({ ...user, id: anotherId, role: "ADMIN" }, shipment), true);
});

test("returns the guide, owner, status and deterministic event data for the UI", () => {
  const response = toShipmentResponse(shipment);
  assert.equal(response.id, shipment.guide);
  assert.equal(response.guide, shipment.guide);
  assert.equal(response.ownerId, ownerId);
  assert.equal(response.state, "Registrado");
  assert.equal(response.events[0].title, "Registrado");
  assert.ok(response.events[0].time.length > 0);
  assert.equal(response.createdAt, shipment.created_at);
});

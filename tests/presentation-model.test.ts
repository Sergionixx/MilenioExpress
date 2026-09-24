import assert from "node:assert/strict"
import test from "node:test"

import { checkpointAt, mergePresentationShipments, progressAt, type PresentationShipment } from "../src/presentation/model.ts"

const first: PresentationShipment = {
  id: "a", runId: "run", originCountry: "MX", destinationCountry: "JP",
  createdAt: "2026-09-24T10:00:00.000Z",
}

test("projector progress is deterministic after reloading", () => {
  const started = Date.parse(first.createdAt)
  assert.equal(progressAt(first.createdAt, started - 1000), 0)
  assert.equal(progressAt(first.createdAt, started + 45_000), 0.5)
  assert.equal(progressAt(first.createdAt, started + 120_000), 1)
  assert.equal(checkpointAt(0), "Salida")
  assert.equal(checkpointAt(0.5), "Tránsito")
  assert.equal(checkpointAt(1), "Destino")
})

test("snapshot and live inserts merge without duplicate lines", () => {
  const second: PresentationShipment = { ...first, id: "b", createdAt: "2026-09-24T10:01:00.000Z" }
  const merged = mergePresentationShipments([second], [first, second])
  assert.deepEqual(merged.map((item) => item.id), ["a", "b"])
})

import assert from "node:assert/strict"
import test from "node:test"

import { checkpointAt, countries, mergePresentationShipments, progressAt, projectorLayout, routeFor, stageAt, type PresentationShipment } from "../src/presentation/model.ts"

const first: PresentationShipment = {
  id: "a", runId: "run", originCountry: "MX", destinationCountry: "JP",
  createdAt: "2026-09-24T10:00:00.000Z",
}

test("projector progress is deterministic after reloading", () => {
  const started = Date.parse(first.createdAt)
  assert.equal(progressAt(first.createdAt, started - 1000), 0)
  assert.equal(progressAt(first.createdAt, started + 45_000), 0.5)
  assert.equal(progressAt(first.createdAt, started + 120_000), 1)
  assert.equal(checkpointAt(0, first), "Almacén Ciudad de México")
  assert.equal(checkpointAt(0.5, first), "Aeropuerto de Hong Kong")
  assert.equal(checkpointAt(1, first), "Almacén Tokio")
  assert.equal(progressAt("invalid", started), 0)
  assert.equal(progressAt(first.createdAt, started, 0), 0)
  assert.equal(stageAt(-1), 0)
})

test("snapshot and live inserts merge without duplicate lines", () => {
  const second: PresentationShipment = { ...first, id: "b", createdAt: "2026-09-24T10:01:00.000Z" }
  const merged = mergePresentationShipments([second], [first, second])
  assert.deepEqual(merged.map((item) => item.id), ["a", "b"])
})

test("routes use named facilities and avoid repeating origin or destination as the hub", () => {
  assert.equal(countries.length, 32)
  assert.equal(new Set(countries.map(({ code }) => code)).size, 32)
  for (const origin of countries) for (const destination of countries) {
    if (origin.code === destination.code) continue
    const route = routeFor({ ...first, originCountry: origin.code, destinationCountry: destination.code })
    assert.equal(route.length, 5)
    assert.equal(new Set(route).size, 5)
  }
  assert.equal(routeFor({ ...first, originCountry: "ZZ", destinationCountry: "QQ" })[0], "Almacén ZZ")
})

test("projector fits 20–30 packages in at most ten rows and pages beyond thirty", () => {
  assert.deepEqual(projectorLayout(0), { columns: 1, rows: 1 })
  assert.deepEqual(projectorLayout(8), { columns: 1, rows: 8 })
  assert.deepEqual(projectorLayout(20), { columns: 2, rows: 10 })
  assert.deepEqual(projectorLayout(30), { columns: 3, rows: 10 })
  assert.deepEqual(projectorLayout(80), { columns: 3, rows: 10 })
  assert.deepEqual(projectorLayout(30, 720), { columns: 4, rows: 8 })
  assert.deepEqual(projectorLayout(20, 768), { columns: 3, rows: 7 })
})

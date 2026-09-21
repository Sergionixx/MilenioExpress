import test from "node:test"
import assert from "node:assert/strict"
import {
  createShipment,
  transitionShipment,
  seedShipments,
  normalizeGuide,
  readShipments,
} from "../src/lib/demo.ts"

const input = {
  recipient: "  Ana López  ",
  address: "Calle Uno 123",
  place: "Monterrey, NL",
  description: "Libros",
}
test("registro: valida campos, normaliza y evita guías duplicadas", () => {
  const shipment = createShipment(input, "repartidor", [], "unique-id")
  assert.equal(shipment.recipient, "Ana López")
  assert.equal(shipment.state, "Registrado")
  assert.equal(shipment.events.length, 1)
  assert.throws(
    () => createShipment({ ...input, address: "  " }, "repartidor", []),
    /Completa/,
  )
  assert.throws(
    () => createShipment(input, "repartidor", [shipment], "unique-id"),
    /ya existe/,
  )
})
test("cliente y sesión ausente no pueden registrar ni modificar paquetes", () => {
  for (const role of ["cliente", null] as const) {
    assert.throws(() => createShipment(input, role, []), /repartidor/)
    assert.throws(
      () => transitionShipment(seedShipments()[1], "En reparto", role),
      /repartidor/,
    )
  }
})
test("los estados avanzan en orden y conservan la auditoría previa", () => {
  const shipment = createShipment(input, "repartidor", [])
  assert.throws(
    () => transitionShipment(shipment, "En reparto", "repartidor"),
    /un paso/,
  )
  assert.throws(
    () => transitionShipment(shipment, "Registrado", "repartidor"),
    /un paso/,
  )
  const updated = transitionShipment(shipment, "En tránsito", "repartidor")
  assert.equal(updated.events.length, 2)
  assert.equal(updated.events[1].actor, "Repartidor demo")
  assert.equal(shipment.events.length, 1)
})
test("entrega requiere evidencia, registra receptor y no se puede repetir", () => {
  const shipment = seedShipments()[0]
  assert.throws(
    () => transitionShipment(shipment, "Entregado", "repartidor"),
    /fotografía/,
  )
  assert.throws(
    () =>
      transitionShipment(shipment, "Entregado", "repartidor", {
        recipient: "Ana",
        photo: "data:image/jpeg;base64,",
        time: "",
      }),
    /fotografía/,
  )
  const updated = transitionShipment(shipment, "Entregado", "repartidor", {
    recipient: " Ana López ",
    photo: "data:image/png;base64,aGVsbG8=",
    time: "",
  })
  assert.equal(updated.evidence?.recipient, "Ana López")
  assert.ok(updated.evidence?.time)
  assert.equal(updated.state, "Entregado")
  assert.throws(
    () =>
      transitionShipment(updated, "Entregado", "repartidor", updated.evidence),
    /no puede repetirse/,
  )
})
test("rastreo tolera minúsculas y espacios exteriores", () => {
  assert.equal(normalizeGuide("  me-8472-1903  "), "ME-8472-1903")
})
test("persistencia conserva envíos y detecta datos dañados sin sobrescribirlos", () => {
  const seeded = seedShipments()
  assert.deepEqual(
    readShipments({ getItem: () => JSON.stringify(seeded) }),
    seeded,
  )
  assert.equal(readShipments({ getItem: () => null }).length, 2)
  assert.throws(
    () => readShipments({ getItem: () => "{" }),
    /no se pueden leer/,
  )
  assert.throws(
    () => readShipments({ getItem: () => '[{"id":"x"}]' }),
    /no se pueden leer/,
  )
})

export type Role = "cliente" | "repartidor"
export type Status = "Registrado" | "En tránsito" | "En reparto" | "Entregado"
export type ShipmentEvent = {
  title: Status
  desc: string
  time: string
  actor: string
}
export type Shipment = {
  id: string
  recipient: string
  address: string
  place: string
  description: string
  state: Status
  tone: string
  events: ShipmentEvent[]
  evidence?: {
    recipient: string
    photo: string
    time: string
  }
}
export const statuses: Status[] = [
  "Registrado",
  "En tránsito",
  "En reparto",
  "Entregado",
]
export const tones: Record<Status, string> = {
  Registrado: "violet",
  "En tránsito": "violet",
  "En reparto": "blue",
  Entregado: "green",
}
const KEY = "milenio-demo-v1"
const ROLE_KEY = "milenio-demo-role"
export function getRole(): Role | null {
  const role = sessionStorage.getItem(ROLE_KEY)
  return role === "cliente" || role === "repartidor" ? role : null
}
export function setRole(role: Role) {
  sessionStorage.setItem(ROLE_KEY, role)
}
export function logout() {
  sessionStorage.removeItem(ROLE_KEY)
}
export function normalizeGuide(value: string) {
  return value.trim().toUpperCase()
}
export function seedShipments(): Shipment[] {
  return [
    {
      id: "ME-8472-1903",
      recipient: "Mariana Cárdenas",
      address: "Av. Universidad 120",
      place: "Monterrey, NL",
      state: "En reparto" as Status,
    },
    {
      id: "ME-1294-8816",
      recipient: "Luis García",
      address: "Av. Juárez 84",
      place: "Guadalajara, JAL",
      state: "En tránsito" as Status,
    },
  ].map((s) => ({
    ...s,
    description: "Paquete de demostración",
    tone: tones[s.state],
    events: statuses
      .slice(0, statuses.indexOf(s.state) + 1)
      .map((title, i) => ({
        title,
        desc:
          i === 0
            ? "Paquete recibido en sucursal"
            : `Actualización en ${s.place}`,
        time: new Date(Date.UTC(2026, 8, 14, 14 + i)).toISOString(),
        actor: "Repartidor demo",
      })),
  }))
}
export function readShipments(
  storage: Pick<Storage, "getItem"> = localStorage,
): Shipment[] {
  const raw = storage.getItem(KEY)
  if (!raw) return seedShipments()
  try {
    const data = JSON.parse(raw)
    if (
      !Array.isArray(data) ||
      !data.every(
        (s) =>
          typeof s.id === "string" &&
          typeof s.recipient === "string" &&
          typeof s.address === "string" &&
          typeof s.place === "string" &&
          statuses.includes(s.state) &&
          Array.isArray(s.events) &&
          s.events.every(
            (e: ShipmentEvent) =>
              statuses.includes(e.title) &&
              typeof e.time === "string" &&
              typeof e.desc === "string",
          ),
      )
    )
      throw new Error()
    return data
  } catch {
    throw new Error(
      "Los datos locales no se pueden leer. Restablece la demostración desde Perfil.",
    )
  }
}
function save(items: Shipment[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    throw new Error(
      "No hay espacio para guardar. Prueba con una fotografía más pequeña o habilita el almacenamiento del navegador.",
    )
  }
}
export function resetDemo() {
  localStorage.removeItem(KEY)
}
function requireDriver(role: Role | null) {
  if (role !== "repartidor")
    throw new Error("Esta acción está disponible para el repartidor.")
}
export type NewShipment = Pick<Shipment, "recipient" | "address" | "place" | "description">
// getRandomValues also works when opening the demo over HTTP on a local network.
// randomUUID is restricted to secure contexts in mobile browsers.
function randomGuide() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
    b.toString(16).padStart(2, "0"),
  )
    .join("")
    .replace(/(.{4})(?=.)/g, "$1-")
}
export function createShipment(
  input: NewShipment,
  role: Role | null,
  existing: Shipment[],
  uuid = randomGuide(),
): Shipment {
  requireDriver(role)
  const values = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value.trim()]),
  ) as NewShipment
  if (
    [values.recipient, values.address, values.place, values.description].some(
      (x) => !x || x.length < 3 || x.length > 180,
    )
  )
    throw new Error("Completa todos los campos con entre 3 y 180 caracteres.")
  const id = `ME-${uuid.toUpperCase()}`
  if (existing.some((s) => s.id === id))
    throw new Error(
      "La guía ya existe. Intenta registrar el paquete nuevamente.",
    )
  return {
    ...values,
    id,
    state: "Registrado",
    tone: tones.Registrado,
    events: [
      {
        title: "Registrado",
        desc: `Registro en ${values.place}`,
        time: new Date().toISOString(),
        actor: "Repartidor demo",
      },
    ],
  }
}
export function transitionShipment(
  shipment: Shipment,
  next: Status,
  role: Role | null,
  evidence?: Shipment["evidence"],
): Shipment {
  requireDriver(role)
  if (statuses.indexOf(next) !== statuses.indexOf(shipment.state) + 1)
    throw new Error(
      "El estado debe avanzar un paso y una entrega no puede repetirse.",
    )
  if (
    next === "Entregado" &&
    (!evidence ||
      evidence.recipient.trim().length < 3 ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        evidence.photo,
      ) ||
      evidence.photo.length > 1_500_000)
  )
    throw new Error(
      "Indica quién recibe y adjunta una fotografía válida de hasta 1 MB.",
    )
  const time = new Date().toISOString()
  return {
    ...shipment,
    state: next,
    tone: tones[next],
    ...(next === "Entregado" && evidence
      ? {
          evidence: { ...evidence, recipient: evidence.recipient.trim(), time },
        }
      : {}),
    events: [
      ...shipment.events,
      {
        title: next,
        desc:
          next === "Entregado"
            ? `Recibió: ${evidence!.recipient.trim()}`
            : `Actualización en ${shipment.place}`,
        time,
        actor: "Repartidor demo",
      },
    ],
  }
}
export function apiFetch(path: "/shipments"): Promise<Shipment[]>
export function apiFetch(path: string, init?: RequestInit): Promise<Shipment>
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Shipment | Shipment[]> {
  if (!getRole())
    throw new Error("Elige un perfil para entrar a la demostración.")
  const items = readShipments()
  const method = init.method ?? "GET"
  if (path === "/shipments" && method === "GET") return items
  if (path === "/shipments" && method === "POST") {
    const shipment = createShipment(
      JSON.parse(String(init.body)),
      getRole(),
      items,
    )
    save([shipment, ...items])
    return shipment
  }
  const match = path.match(/^\/shipments\/([^/]+)(?:\/(status|deliver))?$/)
  const shipment =
    match &&
    items.find((s) => s.id === normalizeGuide(decodeURIComponent(match[1])))
  if (!shipment)
    throw new Error(
      "No encontramos esa guía. Revisa el número e intenta de nuevo.",
    )
  if (method === "GET" && !match![2]) return shipment
  if (method === "POST" && match![2]) {
    const body = JSON.parse(String(init.body))
    const updated = transitionShipment(
      shipment,
      match![2] === "deliver" ? "Entregado" : body.state,
      getRole(),
      body.evidence,
    )
    save(items.map((s) => (s.id === shipment.id ? updated : s)))
    return updated
  }
  throw new Error("Operación no disponible.")
}

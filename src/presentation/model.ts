import { countries } from "../../supabase/functions/server/presentation-countries.ts"
export { countries }

export type TrackedShipment = {
  runId: string
  originCountry: string
  destinationCountry: string
  packageName?: string | null
  trackingCode?: string | null
  createdAt: string
}
export type PresentationShipment = TrackedShipment & {
  id: string
  participantId?: string | null
  participantName?: string | null
}
export const journeyDurationMs = 90_000
export const stageLabels = ["Recibido", "Salida internacional", "Conexión internacional", "Llegada al destino", "Entregado"]
export function countryName(code: string): string {
  return countries.find((country) => country.code === code)?.name ?? code
}
export function cityName(code: string): string {
  return countries.find((country) => country.code === code)?.city ?? code
}
export function routeFor(shipment: TrackedShipment): string[] {
  const origin = countries.find(({ code }) => code === shipment.originCountry)
  const destination = countries.find(({ code }) => code === shipment.destinationCountry)
  const asianCodes = ["CN", "HK", "JP", "KR", "SG", "TH", "AU", "NZ"]
  // Fictional connections, named after real hubs. Never repeat an endpoint.
  const candidates = asianCodes.includes(shipment.originCountry) || asianCodes.includes(shipment.destinationCountry)
    ? ["HK", "SG", "AE"] : ["DE", "NL", "AE"]
  const hub = countries.find(({ code }) => code === candidates.find((code) => ![shipment.originCountry, shipment.destinationCountry].includes(code)))!
  return [`Almacén ${origin?.city ?? shipment.originCountry}`, origin?.airport ?? "Aeropuerto de origen",
    hub.airport, destination?.airport ?? "Aeropuerto de destino", `Almacén ${destination?.city ?? shipment.destinationCountry}`]
}
export function progressAt(createdAt: string, now: number, duration = journeyDurationMs): number {
  const started = Date.parse(createdAt)
  if (!Number.isFinite(started) || duration <= 0) return 0
  return Math.max(0, Math.min(1, (now - started) / duration))
}
export function stageAt(progress: number): number {
  return Math.max(0, Math.min(4, Math.floor(progress * 4)))
}
export function checkpointAt(progress: number, shipment: TrackedShipment): string {
  return routeFor(shipment)[stageAt(progress)]
}
export function mergePresentationShipments(current: PresentationShipment[], incoming: PresentationShipment[]): PresentationShipment[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) byId.set(item.id, item)
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}
export function projectorLayout(count: number, height = 1080) {
  const visible = Math.min(30, Math.max(1, count))
  const columns = visible > 20 ? (height < 900 ? 4 : 3) : visible > 14 && height < 900 ? 3 : visible > 8 ? 2 : 1
  return { columns, rows: Math.ceil(visible / columns) }
}

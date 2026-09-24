export type PresentationShipment = {
  id: string
  runId: string
  originCountry: string
  destinationCountry: string
  createdAt: string
}

export const countries = [
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "CA", name: "Canadá" },
  { code: "BR", name: "Brasil" },
  { code: "CO", name: "Colombia" },
  { code: "AR", name: "Argentina" },
  { code: "ES", name: "España" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Alemania" },
  { code: "JP", name: "Japón" },
  { code: "KR", name: "Corea del Sur" },
  { code: "AU", name: "Australia" },
] as const

export const checkpoints = ["Salida", "Clasificación", "Tránsito", "Aduana", "Destino"] as const
export const journeyDurationMs = 90_000

export function countryName(code: string): string {
  return countries.find((country) => country.code === code)?.name ?? code
}

export function progressAt(createdAt: string, now: number, duration = journeyDurationMs): number {
  const started = Date.parse(createdAt)
  if (!Number.isFinite(started) || duration <= 0) return 0
  return Math.max(0, Math.min(1, (now - started) / duration))
}

export function checkpointAt(progress: number): string {
  const index = Math.min(checkpoints.length - 1, Math.floor(progress * (checkpoints.length - 1)))
  return checkpoints[Math.max(0, index)]
}

export function mergePresentationShipments(
  current: PresentationShipment[],
  incoming: PresentationShipment[],
): PresentationShipment[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) byId.set(item.id, item)
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
}

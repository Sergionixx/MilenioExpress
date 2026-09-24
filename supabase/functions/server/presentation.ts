import { AppError } from "./domain.ts";
import type { Actor } from "./domain.ts";

export interface PresentationRunRow {
  id: string;
  created_at: string;
}

export interface PresentationShipmentRow {
  id: string;
  run_id: string;
  origin_country: string;
  destination_country: string;
  created_at: string;
}

export interface PresentationInput {
  originCountry: string;
  destinationCountry: string;
}

export interface PresentationRepository {
  createRun(): Promise<PresentationRunRow>;
  getRun(runId: string): Promise<PresentationRunRow | null>;
  listShipments(runId: string): Promise<PresentationShipmentRow[]>;
  createShipment(runId: string, input: PresentationInput): Promise<PresentationShipmentRow>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COUNTRY = /^[A-Z]{2}$/;

export function validateRunId(runId: string): string {
  if (!UUID.test(runId)) {
    throw new AppError(400, "INVALID_PRESENTATION", "La presentación no es válida.");
  }
  return runId;
}

export function validatePresentationInput(value: unknown): PresentationInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError(400, "VALIDATION_ERROR", "El cuerpo debe ser un objeto JSON.");
  }
  const body = value as Record<string, unknown>;
  const unexpected = Object.keys(body).filter((key) => !["originCountry", "destinationCountry"].includes(key));
  if (unexpected.length) {
    throw new AppError(400, "VALIDATION_ERROR", `Campos no permitidos: ${unexpected.join(", ")}.`);
  }
  const originCountry = typeof body.originCountry === "string" ? body.originCountry.trim().toUpperCase() : "";
  const destinationCountry = typeof body.destinationCountry === "string" ? body.destinationCountry.trim().toUpperCase() : "";
  if (!COUNTRY.test(originCountry) || !COUNTRY.test(destinationCountry)) {
    throw new AppError(400, "VALIDATION_ERROR", "Selecciona países de origen y destino válidos.");
  }
  if (originCountry === destinationCountry) {
    throw new AppError(400, "VALIDATION_ERROR", "El destino debe ser distinto del origen.");
  }
  return { originCountry, destinationCountry };
}

export function toPresentationShipment(row: PresentationShipmentRow) {
  return {
    id: row.id,
    runId: row.run_id,
    originCountry: row.origin_country,
    destinationCountry: row.destination_country,
    createdAt: row.created_at,
  };
}

async function fromRepository<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, "SERVICE_UNAVAILABLE", "La presentación no está disponible. Intenta de nuevo.");
  }
}

export function createPresentationService(repo: PresentationRepository) {
  return {
    async createRun(actor: Actor) {
      if (actor.role !== "ADMIN") {
        throw new AppError(403, "FORBIDDEN", "Sólo un operador puede iniciar la presentación.");
      }
      const row = await fromRepository(() => repo.createRun());
      return { id: row.id, createdAt: row.created_at };
    },

    async listShipments(runId: string) {
      const validId = validateRunId(runId);
      const run = await fromRepository(() => repo.getRun(validId));
      if (!run) {
        throw new AppError(404, "PRESENTATION_NOT_FOUND", "No se encontró esa presentación.");
      }
      const rows = await fromRepository(() => repo.listShipments(validId));
      return rows.map(toPresentationShipment);
    },

    async createShipment(actor: Actor, runId: string, value: unknown) {
      if (actor.role !== "ADMIN") {
        throw new AppError(403, "FORBIDDEN", "Sólo un operador puede añadir envíos.");
      }
      const validId = validateRunId(runId);
      const input = validatePresentationInput(value);
      const run = await fromRepository(() => repo.getRun(validId));
      if (!run) {
        throw new AppError(404, "PRESENTATION_NOT_FOUND", "No se encontró esa presentación.");
      }
      return toPresentationShipment(await fromRepository(() => repo.createShipment(validId, input)));
    },
  };
}

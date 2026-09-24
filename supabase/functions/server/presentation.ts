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
  participant_id: string | null;
  participant_name: string | null;
  package_name: string | null;
  tracking_code: string | null;
  created_at: string;
}

export interface PresentationInput {
  originCountry: string;
  destinationCountry: string;
  packageName: string;
  trackingCode: string;
}

export interface PresentationRepository {
  createRun(): Promise<PresentationRunRow>;
  getRun(runId: string): Promise<PresentationRunRow | null>;
  listShipments(runId: string, participantId?: string): Promise<PresentationShipmentRow[]>;
  createShipment(runId: string, input: PresentationInput, participant: { id: string; name: string }): Promise<PresentationShipmentRow>;
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
  const unexpected = Object.keys(body).filter((key) => !["originCountry", "destinationCountry", "packageName", "trackingCode"].includes(key));
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
  const packageName = typeof body.packageName === "string" ? body.packageName.replace(/\s+/g, " ").trim() : "";
  const trackingCode = typeof body.trackingCode === "string" ? body.trackingCode.trim() : "";
  if (!packageName || packageName.length > 40) {
    throw new AppError(400, "VALIDATION_ERROR", "Ponle un nombre al paquete de hasta 40 caracteres.");
  }
  if (!/^[0-9]{4}$/.test(trackingCode)) {
    throw new AppError(400, "VALIDATION_ERROR", "El código de rastreo debe tener exactamente cuatro dígitos.");
  }
  return { originCountry, destinationCountry, packageName, trackingCode };
}

export function toPresentationShipment(row: PresentationShipmentRow) {
  return {
    id: row.id,
    runId: row.run_id,
    originCountry: row.origin_country,
    destinationCountry: row.destination_country,
    participantId: row.participant_id,
    participantName: row.participant_name,
    packageName: row.package_name,
    trackingCode: row.tracking_code,
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

export function createPresentationService(repo: PresentationRepository, organizerKey: string) {
  function requireOrganizer(key: string | undefined) {
    if (!organizerKey || !key || key !== organizerKey) {
      throw new AppError(403, "ORGANIZER_REQUIRED", "Este enlace es sólo para el organizador.");
    }
  }
  return {
    async createRun(key: string | undefined) {
      requireOrganizer(key);
      const row = await fromRepository(() => repo.createRun());
      return { id: row.id, createdAt: row.created_at };
    },

    async listShipments(runId: string, actor: Actor | null, key?: string) {
      const validId = validateRunId(runId);
      if (key) requireOrganizer(key);
      if (!key && !actor) throw new AppError(401, "UNAUTHENTICATED", "Entra con tu nombre para continuar.");
      const run = await fromRepository(() => repo.getRun(validId));
      if (!run) {
        throw new AppError(404, "PRESENTATION_NOT_FOUND", "No se encontró esa presentación.");
      }
      const rows = await fromRepository(() => repo.listShipments(validId, key ? undefined : actor!.id));
      return rows.map(toPresentationShipment);
    },

    async createShipment(actor: Actor, runId: string, value: unknown) {
      const validId = validateRunId(runId);
      const input = validatePresentationInput(value);
      const run = await fromRepository(() => repo.getRun(validId));
      if (!run) {
        throw new AppError(404, "PRESENTATION_NOT_FOUND", "No se encontró esa presentación.");
      }
      const name = actor.name.replace(/\s+/g, " ").trim().slice(0, 40) || "Participante";
      return toPresentationShipment(await fromRepository(() => repo.createShipment(validId, input, { id: actor.id, name })));
    },
  };
}

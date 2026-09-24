export type Role = "ADMIN" | "USER";

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  role: Role;
}

export interface ShipmentRow {
  id: string;
  guide: string;
  owner_id: string;
  recipient: string;
  address: string;
  city: string;
  description: string;
  status: "Registrado";
  created_at: string;
}

export interface ShipmentInput {
  ownerId: string;
  recipient: string;
  address: string;
  city: string;
  description: string;
}

export interface Actor {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUIDE = /^ME-\d{4}-\d{8,}$/;

export function isValidGuide(value: string): boolean {
  return GUIDE.test(value);
}

export function canReadShipment(actor: Actor, row: ShipmentRow): boolean {
  return actor.role === "ADMIN" || row.owner_id === actor.id;
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", `${label} es obligatorio.`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `${label} debe tener entre 1 y ${maxLength} caracteres.`,
    );
  }
  return trimmed;
}

export function validateShipmentInput(value: unknown): ShipmentInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError(400, "VALIDATION_ERROR", "El cuerpo debe ser un objeto JSON.");
  }
  const body = value as Record<string, unknown>;
  const expected = ["ownerId", "recipient", "address", "city", "description"];
  const unknown = Object.keys(body).filter((key) => !expected.includes(key));
  if (unknown.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", `Campos no permitidos: ${unknown.join(", ")}.`);
  }
  const ownerId = requiredText(body.ownerId, "Propietario", 36);
  if (!UUID.test(ownerId)) {
    throw new AppError(400, "VALIDATION_ERROR", "El propietario debe ser un identificador válido.");
  }
  return {
    ownerId,
    recipient: requiredText(body.recipient, "Destinatario", 160),
    address: requiredText(body.address, "Dirección", 240),
    city: requiredText(body.city, "Ciudad", 120),
    description: requiredText(body.description, "Descripción", 2000),
  };
}

export function toShipmentResponse(row: ShipmentRow) {
  return {
    id: row.guide,
    guide: row.guide,
    ownerId: row.owner_id,
    recipient: row.recipient,
    address: row.address,
    city: row.city,
    place: row.city,
    description: row.description,
    state: row.status,
    tone: "violet",
    events: [{
      title: "Registrado",
      desc: "El paquete fue registrado.",
      time: new Date(row.created_at).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }),
    }],
    createdAt: row.created_at,
  };
}

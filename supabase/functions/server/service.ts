import {
  AppError,
  canReadShipment,
  isValidGuide,
  toShipmentResponse,
  validateShipmentInput,
} from "./domain.ts";
import type { Actor, ProfileRow, ShipmentInput, ShipmentRow } from "./domain.ts";

export interface ShipmentRepository {
  verifyToken(token: string): Promise<{ id: string; email: string } | null>;
  getProfile(id: string): Promise<ProfileRow | null>;
  listProfiles(): Promise<ProfileRow[]>;
  listShipments(ownerId?: string): Promise<ShipmentRow[]>;
  getShipment(guide: string): Promise<ShipmentRow | null>;
  createShipment(input: ShipmentInput): Promise<ShipmentRow>;
}

async function fromRepository<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, "SERVICE_UNAVAILABLE", "El servicio no está disponible. Intenta de nuevo.");
  }
}

export function createShipmentService(repo: ShipmentRepository) {
  return {
    async authenticate(token: string | undefined): Promise<Actor> {
      if (!token) {
        throw new AppError(401, "UNAUTHENTICATED", "Entra con tu nombre para continuar.");
      }
      const verified = await fromRepository(() => repo.verifyToken(token));
      if (!verified) {
        throw new AppError(401, "INVALID_TOKEN", "La sesión no es válida o expiró.");
      }
      const profile = await fromRepository(() => repo.getProfile(verified.id));
      if (!profile || (profile.role !== "ADMIN" && profile.role !== "USER")) {
        throw new AppError(403, "PROFILE_REQUIRED", "La cuenta no tiene un perfil autorizado.");
      }
      return {
        id: verified.id,
        email: verified.email,
        name: profile.display_name,
        role: profile.role,
      };
    },

    async listUsers(actor: Actor) {
      if (actor.role !== "ADMIN") {
        throw new AppError(403, "FORBIDDEN", "Sólo ADMIN puede consultar propietarios.");
      }
      const profiles = await fromRepository(() => repo.listProfiles());
      return profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.display_name,
      }));
    },

    async listShipments(actor: Actor) {
      const rows = await fromRepository(() => repo.listShipments(actor.role === "ADMIN" ? undefined : actor.id));
      return rows.filter((row) => canReadShipment(actor, row)).map(toShipmentResponse);
    },

    async getShipment(actor: Actor, guide: string) {
      if (!isValidGuide(guide)) {
        throw new AppError(400, "INVALID_GUIDE", "El formato de la guía no es válido.");
      }
      const row = await fromRepository(() => repo.getShipment(guide));
      if (!row) {
        throw new AppError(404, "SHIPMENT_NOT_FOUND", "No se encontró esa guía.");
      }
      if (!canReadShipment(actor, row)) {
        throw new AppError(403, "FORBIDDEN", "No tienes permiso para consultar este paquete.");
      }
      return toShipmentResponse(row);
    },

    async createShipment(actor: Actor, value: unknown) {
      const input = validateShipmentInput(value);
      if (actor.role !== "ADMIN" && input.ownerId !== actor.id) {
        throw new AppError(403, "FORBIDDEN", "Sólo puedes registrar paquetes para ti.");
      }
      const owner = await fromRepository(() => repo.getProfile(input.ownerId));
      if (!owner) {
        throw new AppError(400, "OWNER_NOT_FOUND", "El propietario no existe.");
      }
      return toShipmentResponse(await fromRepository(() => repo.createShipment(input)));
    },
  };
}

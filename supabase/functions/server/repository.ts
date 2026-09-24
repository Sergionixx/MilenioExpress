import type { SupabaseClient } from "jsr:@supabase/supabase-js@2.49.8";
import { AppError } from "./domain.ts";
import type { ProfileRow, ShipmentInput, ShipmentRow } from "./domain.ts";
import type { ShipmentRepository } from "./service.ts";

const shipmentColumns = "id,guide,owner_id,recipient,address,city,description,status,created_at";
const profileColumns = "id,email,display_name,role";
const pageSize = 500;

// The client remains server-only. Injecting it lets tests exercise the actual
// Supabase request contract without credentials or a live database.
export function createSupabaseRepository(db: SupabaseClient): ShipmentRepository {
  return {
    async verifyToken(token) {
      // getUser contacts Auth to validate the JWT; decoded claims and editable
      // user_metadata are never accepted as proof of identity or application role.
      const { data, error } = await db.auth.getUser(token);
      if (error) {
        if ([400, 401, 403].includes(error.status ?? 0)) return null;
        throw error;
      }
      return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
    },

    async getProfile(id) {
      const { data, error } = await db.from("profiles").select(profileColumns).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },

    async listProfiles() {
      const rows: ProfileRow[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await db.from("profiles").select(profileColumns)
          .order("display_name").order("id")
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as ProfileRow[];
        rows.push(...page);
        if (page.length < pageSize) return rows;
      }
    },

    async listShipments(ownerId) {
      const rows: ShipmentRow[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const query = db.from("shipments").select(shipmentColumns);
        const filtered = ownerId ? query.eq("owner_id", ownerId) : query;
        const { data, error } = await filtered
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as ShipmentRow[];
        rows.push(...page);
        if (page.length < pageSize) return rows;
      }
    },

    async getShipment(guide) {
      const { data, error } = await db.from("shipments").select(shipmentColumns).eq("guide", guide).maybeSingle();
      if (error) throw error;
      return data as ShipmentRow | null;
    },

    async createShipment(input: ShipmentInput) {
      const { data, error } = await db.from("shipments").insert({
        owner_id: input.ownerId,
        recipient: input.recipient,
        address: input.address,
        city: input.city,
        description: input.description,
      }).select(shipmentColumns).single();
      if (error?.code === "23505") {
        throw new AppError(409, "GUIDE_CONFLICT", "No se pudo asignar una guía única. Intenta de nuevo.");
      }
      if (error?.code === "23503") {
        throw new AppError(400, "OWNER_NOT_FOUND", "El propietario no existe.");
      }
      if (error) throw error;
      return data as ShipmentRow;
    },
  };
}

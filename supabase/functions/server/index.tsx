import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Hono, type Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { AppError } from "./domain.ts";
import type { ProfileRow, ShipmentInput, ShipmentRow } from "./domain.ts";
import { createShipmentService } from "./service.ts";
import type { ShipmentRepository } from "./service.ts";

const base = "/make-server-845b49a4";
const shipmentColumns = "id,guide,owner_id,recipient,address,city,description,status,created_at";
const profileColumns = "id,email,display_name,role";

function createRepository(): ShipmentRepository {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }
  const db = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    async verifyToken(token) {
      // getUser calls Supabase Auth, which verifies signature, expiry and user.
      // Reading JWT claims or user metadata alone would trust client input.
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
      const { data, error } = await db.from("profiles").select(profileColumns).order("display_name");
      if (error) throw error;
      return data as ProfileRow[];
    },

    async listShipments(ownerId) {
      const rows: ShipmentRow[] = [];
      const pageSize = 500;
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

let service: ReturnType<typeof createShipmentService> | undefined;
function shipmentService() {
  return service ??= createShipmentService(createRepository());
}

function bearerToken(c: Context): string | undefined {
  const authorization = c.req.header("Authorization")?.trim() ?? "";
  return /^Bearer\s+(\S+)$/i.exec(authorization)?.[1];
}

async function parseJson(c: Context): Promise<unknown> {
  if (!c.req.header("Content-Type")?.toLowerCase().includes("application/json")) {
    throw new AppError(400, "VALIDATION_ERROR", "Envía un cuerpo JSON.");
  }
  try {
    return await c.req.json();
  } catch {
    throw new AppError(400, "VALIDATION_ERROR", "El cuerpo JSON no es válido.");
  }
}

const app = new Hono();
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 600,
  }),
);

app.get(`${base}/health`, (c) => c.json({ status: "ok" }));

app.get(`${base}/me`, async (c) => {
  const actor = await shipmentService().authenticate(bearerToken(c));
  return c.json(actor);
});

app.get(`${base}/users`, async (c) => {
  const api = shipmentService();
  const actor = await api.authenticate(bearerToken(c));
  return c.json(await api.listUsers(actor));
});

app.get(`${base}/shipments`, async (c) => {
  const api = shipmentService();
  const actor = await api.authenticate(bearerToken(c));
  return c.json(await api.listShipments(actor));
});

app.post(`${base}/shipments`, async (c) => {
  const api = shipmentService();
  const actor = await api.authenticate(bearerToken(c));
  return c.json(await api.createShipment(actor, await parseJson(c)), 201);
});

app.get(`${base}/shipments/:guide`, async (c) => {
  const api = shipmentService();
  const actor = await api.authenticate(bearerToken(c));
  return c.json(await api.getShipment(actor, c.req.param("guide")));
});

app.notFound((c) => c.json({ error: "Ruta no encontrada.", code: "NOT_FOUND" }, 404));
app.onError((error, c) => {
  if (error instanceof AppError) {
    return c.json({ error: error.message, code: error.code }, error.status as 400);
  }
  console.error(error);
  return c.json({ error: "Ocurrió un error interno.", code: "INTERNAL_ERROR" }, 500);
});

Deno.serve(app.fetch);

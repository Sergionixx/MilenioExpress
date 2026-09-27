import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Hono, type Context } from "npm:hono@4.13.8";
import { cors } from "npm:hono@4.13.8/cors";
import { logger } from "npm:hono@4.13.8/logger";
import { AppError } from "./domain.ts";
import type { ProfileRow, ShipmentInput, ShipmentRow } from "./domain.ts";
import { createShipmentService } from "./service.ts";
import type { ShipmentRepository } from "./service.ts";
import { createPresentationService, generateTrackingCode } from "./presentation.ts";
import type { PresentationInput, PresentationRepository, PresentationRunRow, PresentationShipmentRow } from "./presentation.ts";

const base = "/make-server-845b49a4";
const shipmentColumns = "id,guide,owner_id,recipient,address,city,description,status,created_at";
const profileColumns = "id,email,display_name,role";
const presentationColumns = "id,run_id,origin_country,destination_country,participant_id,participant_name,package_name,tracking_code,created_at";
const presentationRunColumns = "id,created_at";

let database: ReturnType<typeof createClient> | undefined;
function databaseClient() {
  if (database) return database;
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }
  database = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return database;
}

function createRepository(): ShipmentRepository {
  const db = databaseClient();

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

function createPresentationRepository(): PresentationRepository {
  const db = databaseClient();
  return {
    async latestRun() {
      const { data, error } = await db.from("presentation_runs").select(presentationRunColumns)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as PresentationRunRow | null;
    },
    async getShipment(runId, trackingCode) {
      const { data, error } = await db.from("presentation_shipments").select(presentationColumns)
        .eq("run_id", runId).eq("tracking_code", trackingCode).maybeSingle();
      if (error) throw error;
      return data as PresentationShipmentRow | null;
    },
    async createRun() {
      const { data, error } = await db.from("presentation_runs").insert({ id: crypto.randomUUID() }).select(presentationRunColumns).single();
      if (error) throw error;
      return data as PresentationRunRow;
    },
    async getRun(runId) {
      const { data, error } = await db.from("presentation_runs").select(presentationRunColumns).eq("id", runId).maybeSingle();
      if (error) throw error;
      return data as PresentationRunRow | null;
    },
    async listShipments(runId, participantId) {
      const rows: PresentationShipmentRow[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const query = db.from("presentation_shipments")
          .select(presentationColumns)
          .eq("run_id", runId);
        const { data, error } = await (participantId ? query.eq("participant_id", participantId) : query)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as PresentationShipmentRow[];
        rows.push(...page);
        if (page.length < pageSize) return rows;
      }
    },
    async createShipment(runId, input: PresentationInput, participant) {
      for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await db.from("presentation_shipments").insert({
        run_id: runId,
        origin_country: input.originCountry,
        destination_country: input.destinationCountry,
        participant_id: participant.id,
        participant_name: participant.name,
        package_name: input.packageName,
        tracking_code: generateTrackingCode(),
      }).select(presentationColumns).single();
      if (error?.code === "23505") {
        continue;
      }
      if (error?.code === "23503") {
        throw new AppError(404, "PRESENTATION_NOT_FOUND", "No se encontró esa presentación.");
      }
      if (error) throw error;
      return data as PresentationShipmentRow;
      }
      throw new AppError(503, "GUIDE_CONFLICT", "No se pudo asignar una guía. Intenta de nuevo.");
    },
  };
}

let service: ReturnType<typeof createShipmentService> | undefined;
function shipmentService() {
  return service ??= createShipmentService(createRepository());
}

let presentation: ReturnType<typeof createPresentationService> | undefined;
function presentationService() {
  return presentation ??= createPresentationService(createPresentationRepository(), Deno.env.get("PRESENTATION_ORGANIZER_KEY") ?? "");
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
    allowHeaders: ["Content-Type", "Authorization", "apikey", "X-Presentation-Key"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 600,
  }),
);

app.get(`${base}/health`, (c) => c.json({ status: "ok" }));

app.get(`${base}/presentation/active`, async (c) => c.json(await presentationService().latestRun()));

app.get(`${base}/presentation/runs/:runId`, async (c) => c.json(await presentationService().getRun(c.req.param("runId"))));

app.get(`${base}/presentation/runs/:runId/track/:code`, async (c) => {
  return c.json(await presentationService().trackShipment(c.req.param("runId"), c.req.param("code")));
});

app.post(`${base}/presentation/runs`, async (c) => {
  return c.json(await presentationService().createRun(c.req.header("X-Presentation-Key")), 201);
});

app.get(`${base}/presentation/runs/:runId/shipments`, async (c) => {
  const organizerKey = c.req.header("X-Presentation-Key");
  const actor = organizerKey ? null : await shipmentService().authenticate(bearerToken(c));
  return c.json(await presentationService().listShipments(c.req.param("runId"), actor, organizerKey));
});

app.post(`${base}/presentation/runs/:runId/shipments`, async (c) => {
  const actor = await shipmentService().authenticate(bearerToken(c));
  return c.json(await presentationService().createShipment(actor, c.req.param("runId"), await parseJson(c)), 201);
});

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

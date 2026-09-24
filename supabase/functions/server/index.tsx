import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { createShipmentHandler } from "./handler.ts";
import { createSupabaseRepository } from "./repository.ts";
import { createShipmentService } from "./service.ts";

let service: ReturnType<typeof createShipmentService> | undefined;
function shipmentService() {
  if (service) return service;
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }
  const db = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  service = createShipmentService(createSupabaseRepository(db));
  return service;
}

Deno.serve(createShipmentHandler(shipmentService, {
  allowedOrigins: (Deno.env.get("ALLOWED_ORIGINS") || "*").split(",").map((origin) => origin.trim()).filter(Boolean),
  // Never record access tokens, request bodies or infrastructure exception text.
  onUnexpectedError: () => console.error("Unexpected shipment API error."),
}));

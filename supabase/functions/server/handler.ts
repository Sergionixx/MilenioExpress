import { AppError } from "./domain.ts";
import type { createShipmentService } from "./service.ts";

export const API_BASE = "/make-server-845b49a4";
const maximumBodyBytes = 16_384;
type ShipmentService = ReturnType<typeof createShipmentService>;

export interface HandlerOptions {
  // Existing frontend origins remain compatible by default. A deployment can
  // supply an exact allowlist without changing authentication or roles.
  allowedOrigins?: readonly string[];
  onUnexpectedError?: (error: unknown) => void;
}

function addCorsHeaders(request: Request, headers: Headers, allowedOrigins: readonly string[]) {
  const origin = request.headers.get("Origin");
  if (allowedOrigins.includes("*")) {
    headers.set("Access-Control-Allow-Origin", "*");
  } else if (origin) {
    if (!allowedOrigins.includes(origin)) {
      throw new AppError(403, "ORIGIN_NOT_ALLOWED", "El origen de la solicitud no está permitido.");
    }
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Max-Age", "600");
}

async function parseJson(request: Request): Promise<unknown> {
  const mediaType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new AppError(400, "VALIDATION_ERROR", "Envía un cuerpo JSON.");
  }
  if (Number(request.headers.get("Content-Length")) > maximumBodyBytes) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "El cuerpo de la solicitud es demasiado grande.");
  }
  // Content-Length is optional and caller-controlled; streamed bodies need the
  // same byte limit. This is comfortably above the accepted shipment fields.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maximumBodyBytes) {
          await reader.cancel();
          throw new AppError(413, "PAYLOAD_TOO_LARGE", "El cuerpo de la solicitud es demasiado grande.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new AppError(400, "VALIDATION_ERROR", "El cuerpo JSON no es válido.");
  }
}

// Standard Web APIs run in both Deno Edge Functions and Node integration tests.
export function createShipmentHandler(
  getService: () => ShipmentService,
  options: HandlerOptions = {},
): (request: Request) => Promise<Response> {
  const allowedOrigins = options.allowedOrigins ?? ["*"];
  return async (request) => {
    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Vary": "Origin",
    });
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
    try {
      addCorsHeaders(request, headers, allowedOrigins);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

      const path = new URL(request.url).pathname;
      const detail = new RegExp(`^${API_BASE}/shipments/([^/]+)$`).exec(path);
      const known = [`${API_BASE}/health`, `${API_BASE}/me`, `${API_BASE}/users`, `${API_BASE}/shipments`];
      if (!known.includes(path) && !detail) {
        throw new AppError(404, "NOT_FOUND", "Ruta no encontrada.");
      }
      const allowedMethods = path === `${API_BASE}/shipments` ? ["GET", "POST"] : ["GET"];
      if (!allowedMethods.includes(request.method)) {
        headers.set("Allow", [...allowedMethods, "OPTIONS"].join(", "));
        throw new AppError(405, "METHOD_NOT_ALLOWED", "Método no permitido.");
      }
      if (path === `${API_BASE}/health`) return json({ status: "ok" });

      const service = getService();
      const authorization = request.headers.get("Authorization")?.trim() ?? "";
      const token = /^Bearer\s+(\S+)$/i.exec(authorization)?.[1];
      const actor = await service.authenticate(token);
      if (path === `${API_BASE}/me`) return json(actor);
      if (path === `${API_BASE}/users`) return json(await service.listUsers(actor));
      if (path === `${API_BASE}/shipments`) {
        if (request.method === "POST") {
          return json(await service.createShipment(actor, await parseJson(request)), 201);
        }
        return json(await service.listShipments(actor));
      }
      return json(await service.getShipment(actor, detail![1]));
    } catch (error) {
      if (error instanceof AppError) return json({ error: error.message, code: error.code }, error.status);
      options.onUnexpectedError?.(error);
      return json({ error: "Ocurrió un error interno.", code: "INTERNAL_ERROR" }, 500);
    }
  };
}

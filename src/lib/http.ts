export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function requestJson(
  url: string,
  token: string | undefined,
  init: RequestInit = {},
  transport: typeof fetch = fetch,
  apiKey?: string,
) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  // Authentication comes only from the current Supabase session.
  headers.delete("Authorization");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (apiKey) headers.set("apikey", apiKey);

  let response: Response;
  try {
    response = await transport(url, { ...init, headers });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Comprueba tu conexión e intenta de nuevo.", 0, "NETWORK_ERROR");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = typeof body?.error === "string" && body.error ? body.error : "No se pudo completar la solicitud.";
    const code = typeof body?.code === "string" && body.code ? body.code : "REQUEST_FAILED";
    throw new ApiError(message, response.status, code);
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError("El servidor devolvió una respuesta no válida. Intenta de nuevo.", response.status, "INVALID_RESPONSE");
  }
}

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
    throw new ApiError(body.error || "No se pudo completar la solicitud.", response.status, body.code || "REQUEST_FAILED");
  }
  return response.json();
}

export function loginErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined

  if (code === "invalid_credentials") {
    return "Correo o contraseña incorrectos."
  }
  if (code === "email_not_confirmed") {
    return "Confirma el correo de esta cuenta antes de iniciar sesión."
  }
  if (code === "over_request_rate_limit") {
    return "Se realizaron demasiados intentos. Espera un momento e intenta de nuevo."
  }
  if (code === "network_error" || code === "request_timeout") {
    return "No se pudo conectar con el servidor. Comprueba tu conexión e intenta de nuevo."
  }
  return "No se pudo iniciar sesión. Intenta de nuevo."
}

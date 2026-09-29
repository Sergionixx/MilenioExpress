/** Public registration never accepts a role: the database assigns USER. */
export function validateRegistration(input: {
  name: string
  email: string
  password: string
  confirmation: string
}): string {
  if (input.name.trim().length < 2 || input.name.trim().length > 120)
    return "Escribe tu nombre completo (entre 2 y 120 caracteres)."
  const email = input.email.trim()
  const parts = email.split("@")
  if (email.length > 254 || parts.length !== 2 || !parts[0] || !parts[1].includes(".") || /\s/.test(email))
    return "Escribe un correo electrónico válido."
  if (input.password.length < 8)
    return "La contraseña debe tener al menos 8 caracteres."
  if (input.password !== input.confirmation)
    return "Las contraseñas no coinciden."
  return ""
}

export function registrationErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "No se pudo crear la cuenta con ese correo. Si ya tienes una cuenta, inicia sesión."
    case "weak_password":
      return "Elige una contraseña más segura, con mayúsculas, minúsculas, números y símbolos."
    case "email_address_invalid":
      return "Comprueba que el correo electrónico esté escrito correctamente."
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Se realizaron demasiados intentos. Espera unos minutos antes de volver a intentarlo."
    case "signup_disabled":
      return "El registro no está disponible en este momento. Contacta al administrador."
    case "email_address_not_authorized":
      return "El servicio de correo aún no permite enviar la confirmación a esta dirección. Contacta al administrador."
    default:
      return "No se pudo completar el registro. Comprueba tu conexión e inténtalo de nuevo."
  }
}

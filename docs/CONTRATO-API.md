# KAN-11 — contrato propuesto de integración

Responsable: Sergionix. Estado: en progreso, pendiente de validación conjunta con Juan y Humberto. Este documento define el intercambio previsto; no afirma que los endpoints estén implementados. Tipos compartidos: `src/contracts/api.ts`.

## Qué funciona hoy

El frontend es la demo local React/Vite; conserva datos en localStorage y simula perfiles. `src/lib/supabase.ts` es una integración heredada que la demo no usa. El backend de `supabase/functions/server/index.tsx` solo contiene `GET /make-server-845b49a4/health`, que devuelve `{"status":"ok"}`. Ese endpoint no comprueba JWT, base de datos ni disponibilidad de Auth.

## Contrato para implementar

Base de las operaciones de paquetes: `/make-server-845b49a4`. Identificadores de usuario: UUID del proveedor de autenticación. Las peticiones protegidas llevan `Authorization: Bearer <access_token>`; nunca incluyen el rol como autoridad de acceso.

| Operación | Entrada | Salida | Permiso |
| --- | --- | --- | --- |
| POST /packages | CreatePackageRequest | 201, PackageResponse | ADMIN |
| GET /packages/by-guide/{guide} | Guía codificada como segmento de URL | 200, PackageResponse | ADMIN o USER propietario |

ADMIN puede consultar cualquier paquete. USER solo puede consultar aquellos cuyo `ownerId` coincide con su identidad verificada. El servidor genera `id`, `guide` y `createdAt`; el cliente no decide esos valores. `createdAt` usa ISO 8601 UTC. La creación valida que `ownerId` corresponde a una cuenta existente; para la exposición bastan cuentas ficticias preconfiguradas. Crear no requiere una pantalla de administración de usuarios.

Ejemplo de creación (datos ficticios):

```json
{
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "recipient": "Persona de prueba",
  "address": "Dirección de demostración 123",
  "city": "Monterrey",
  "description": "Paquete de demostración"
}
```

Respuesta:

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000002",
    "guide": "ME-8472-1903",
    "ownerId": "00000000-0000-4000-8000-000000000001",
    "recipient": "Persona de prueba",
    "address": "Dirección de demostración 123",
    "city": "Monterrey",
    "description": "Paquete de demostración",
    "createdAt": "2026-09-21T18:00:00.000Z"
  }
}
```

Propuesta de validación: eliminar espacios exteriores; recipient 1–120 caracteres, address 1–240, city 1–120 y description 1–500. No aceptar valores vacíos. Guía normalizada a mayúsculas con formato `ME-0000-0000`; Juan deberá garantizar unicidad en persistencia y manejar colisiones. Estos límites son decisiones del contrato, no reglas verificadas en la demo actual.

| HTTP | Código | Uso |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Entrada inválida; errores por campo opcionales |
| 401 | UNAUTHENTICATED | Token ausente, inválido o vencido |
| 403 | FORBIDDEN | Usuario autenticado intenta crear sin ADMIN |
| 404 | NOT_FOUND | Guía inexistente o paquete que el usuario no puede consultar; misma respuesta para no revelar existencia |
| 409 | CONFLICT | Conflicto de persistencia que no puede resolverse internamente |
| 500 | INTERNAL_ERROR | Error interno con mensaje genérico, sin stack ni secretos |

```json
{"error":{"code":"VALIDATION_ERROR","message":"Revisa los campos indicados.","fields":{"city":"La ciudad es obligatoria."}}}
```

Los tipos TypeScript no validan JSON recibido ni conceden permisos. Sergionix implementa la verificación de sesión/rol y el formato compartido de errores en KAN-15/18/19; Juan valida los datos de paquetes, implementa ambas operaciones y aplica propiedad. La función compartida recibirá un `AuthenticatedUser` construido por el servidor. Los perfiles locales `cliente/repartidor` no se convierten automáticamente en ADMIN/USER.

## Arranque y verificación actuales

Frontend: Node 24+, pnpm 11; `pnpm install --frozen-lockfile`, después `pnpm dev` y abrir `http://localhost:8443`. Si ya hay servidor activo, usarlo. Comprobaciones: `pnpm test`, `pnpm typecheck`, `pnpm build`.

Backend heredado: requiere Deno y dependencias Hono/Supabase. Falta un comando versionado de arranque, dependencias bloqueadas y un smoke test local verificable; son pendientes de KAN-11. No desplegarlo como API completa ni añadir paquetes falsos que aparenten persistencia.

Configuración a acordar con Humberto (KAN-13): URL del proveedor, clave pública del cliente, URL base de API y secretos solo en backend/CI. La demo actual no lee variables de integración; no basta añadir un .env para conectarla. Documentar los nombres definitivos al implementar el arranque. Las claves privadas y de firma nunca usarán prefijo VITE ni aparecerán en ejemplos.

## Entrega entre responsables

1. Juan revisa campos, guía y regla de propiedad; implementa creación/consulta y sus pruebas usando estos tipos.
2. Sergionix implementa Auth/roles y adapta los errores de la integración heredada: hoy apiFetch espera otro formato de error.
3. Humberto acuerda comandos y variables que utilizará CI/CD; no se exige un proveedor de hosting específico.
4. Para cerrar KAN-11: validar el contrato con el equipo, completar arranque verificable de backend y entregar ejemplos de éxito/error. Este avance no acredita esos puntos todavía.

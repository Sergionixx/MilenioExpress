# Paquetes y acceso

La migración `migrations/20260922000000_shipments_and_roles.sql` crea `profiles` y `shipments` en PostgreSQL. La tabla `shipments` usa una secuencia y un trigger para asignar guías `ME-AAAA-########`; una restricción `UNIQUE` impide sobrescribir una guía existente. El paquete guarda propietario, destinatario, dirección, ciudad, descripción y fecha de registro. El estado inicial y único dentro del alcance actual es `Registrado`.

## Preparación del proyecto Supabase

1. Aplicar la migración en el proyecto Supabase vinculado a la aplicación, mediante el flujo de migraciones o el SQL Editor. Ejecutarla antes de desplegar `functions/server`.
2. Crear las cuentas ficticias necesarias desde **Authentication > Users**. El trigger crea su perfil con rol `USER`. Esta aplicación sólo muestra inicio de sesión; no necesita habilitar registro público. Se recomienda deshabilitarlo en **Authentication > Providers > Email > Allow new users to sign up**.
3. Promover explícitamente la cuenta operadora. Sustituir el correo por el de la cuenta creada:

   ```sql
   update public.profiles
   set role = 'ADMIN'
   where email = 'admin@example.com';
   ```

4. Desplegar la Edge Function `make-server-845b49a4` con `supabase functions deploy make-server-845b49a4 --project-ref <referencia>` desde la raíz del repositorio. Supabase proporciona `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` al servidor. El nombre publicado conserva la URL usada por Figma Make; `config.toml` apunta al código de `functions/server`. La clave de servicio queda exclusivamente en el servidor; jamás se envía al navegador. La ruta de salud es pública y cada ruta de datos verifica el token y el perfil en el servicio.

Por defecto, el cliente usa `https://rltahgouyixqquspofsf.supabase.co` y su clave publicable. Para usar otro proyecto de pruebas, crear un `.env.local` en la raíz con `VITE_SUPABASE_URL=https://<referencia>.supabase.co` y `VITE_SUPABASE_ANON_KEY=<clave_publica>`; ambos valores deben pertenecer al mismo proyecto. Reiniciar Vite después del cambio. No colocar la clave de servicio en variables `VITE_` ni en Git.

Los perfiles existentes en `auth.users` se incorporan al aplicar la migración. El rol no se lee de metadatos editables del usuario ni del cuerpo de la solicitud. La Edge Function valida el token con `auth.getUser`, busca el rol en `profiles` y exige `ADMIN` para registrar paquetes o consultar la lista de propietarios. Un `USER` sólo puede consultar sus propios paquetes. Las políticas RLS repiten esos permisos para consultas directas a PostgreSQL.

## Contrato de la API

Todas las rutas usan el prefijo `/make-server-845b49a4`. Salvo `/health` y la lectura pública de una presentación, requieren `Authorization: Bearer <access_token>`. El navegador envía además la clave pública del proyecto en `apikey`; la clave de servicio nunca se envía al cliente.

| Método | Ruta | Permiso | Respuesta |
| --- | --- | --- | --- |
| GET | `/health` | Público | `{ "status": "ok" }` |
| GET | `/me` | Sesión | `{ id, email, name, role }` |
| GET | `/users` | ADMIN | `[{ id, email, name }]` |
| GET | `/shipments` | ADMIN: todos; USER: propios | Arreglo de paquetes |
| POST | `/shipments` | ADMIN | Paquete creado, HTTP 201 |
| GET | `/shipments/:guide` | ADMIN o propietario | Paquete solicitado |

El cuerpo para registrar un paquete es `{ "ownerId": "<uuid>", "recipient": "...", "address": "...", "city": "...", "description": "..." }`. La guía no se acepta del cliente. Cada respuesta de paquete contiene `id` y `guide` con el valor de la guía, además de `ownerId`, `recipient`, `address`, `city`, `place`, `description`, `state`, `tone`, `events` y `createdAt`.

Ejemplo de consulta autenticada, después de registrar un paquete y recibir su guía:

```http
GET /make-server-845b49a4/shipments/ME-2026-00000001 HTTP/1.1
Authorization: Bearer <access_token>
apikey: <public_anon_key>
```

```json
{
  "id": "ME-2026-00000001",
  "guide": "ME-2026-00000001",
  "ownerId": "11111111-1111-4111-8111-111111111111",
  "recipient": "Ana López",
  "address": "Avenida Reforma 123",
  "city": "Ciudad de México",
  "place": "Ciudad de México",
  "description": "Documentos",
  "state": "Registrado",
  "tone": "violet",
  "events": [{ "title": "Registrado", "desc": "El paquete fue registrado.", "time": "22 sep 2026, 6:00 a.m." }],
  "createdAt": "2026-09-22T12:00:00.000Z"
}
```

Los errores tienen formato `{ "error": "Mensaje en español", "code": "CODIGO" }`. Ejemplos: guía mal formada `400 INVALID_GUIDE`, guía inexistente `404 SHIPMENT_NOT_FOUND`, guía de otro propietario `403 FORBIDDEN`, ausencia de sesión `401 UNAUTHENTICATED`, token inválido o vencido `401 INVALID_TOKEN`, validación del formulario `400 VALIDATION_ERROR`, guía duplicada `409 GUIDE_CONFLICT` y dependencia temporalmente indisponible `503 SERVICE_UNAVAILABLE`.

No se actualiza el estado ni se registra evidencia de entrega en esta etapa. Esa operación requiere datos y pruebas de una historia posterior.

## Simulación para la presentación

La migración `migrations/20260924051741_presentation_simulation.sql` agrega `presentation_runs` y `presentation_shipments`. Es independiente de `shipments`. Aplicarla **antes** de desplegar la versión de la función Edge de la rama `feature/presentacion-interactiva`. La migración activa RLS; sólo concede lectura pública de `presentation_shipments`, que guarda códigos de países y fechas ficticias. Las escrituras pasan por la función Edge y requieren un perfil `ADMIN` autenticado. La tabla se incorpora a la publicación `supabase_realtime` para mostrar inserciones nuevas en el proyector. Un identificador de presentación distinto separa cada demostración.

| Método | Ruta | Permiso | Respuesta |
| --- | --- | --- | --- |
| POST | `/presentation/runs` | ADMIN | `{ id, createdAt }`, HTTP 201 |
| GET | `/presentation/runs/:runId/shipments` | Público | `[{ id, runId, originCountry, destinationCountry, createdAt }]` |
| POST | `/presentation/runs/:runId/shipments` | ADMIN | Envío simulado creado, HTTP 201 |

El cuerpo de la última ruta es `{ "originCountry": "MX", "destinationCountry": "JP" }`; los países deben ser distintos y usan códigos de dos letras. El cliente ofrece una lista definida en `src/presentation/model.ts`. Los errores siguen el formato de la API existente: `400 INVALID_PRESENTATION` para un identificador mal formado, `404 PRESENTATION_NOT_FOUND` para una presentación inexistente, `403 FORBIDDEN` para una escritura con rol `USER` y `503 SERVICE_UNAVAILABLE` para fallos de almacenamiento.

La aplicación web abre `/presentacion/control` para el atendiente y `/presentacion/pantalla/:runId` para el proyector. El proyector acepta lectura sin sesión, pero el identificador en el enlace no es un secreto de acceso: los datos son intencionalmente ficticios y públicos. Antes de presentarlo en dos dispositivos se necesita publicar el cliente web con HTTPS y comprobar el flujo completo tras aplicar la migración y desplegar la función. Esta rama aún no aplica cambios al proyecto Supabase compartido.

# Supabase: paquetes y presentación

El cliente pide un nombre y llama a `signInAnonymously`. Supabase asigna un `auth.users.id` distinto a cada navegador y el trigger `handle_auth_user_insert` crea su perfil `USER` con el nombre proporcionado. No se pide correo ni contraseña en la aplicación. Los perfiles antiguos con correo siguen funcionando si conservan una sesión, pero no hay formulario para volver a entrar con credenciales.

La opción `[auth] enable_anonymous_sign_ins = true` en `config.toml` debe estar activada en el proyecto remoto. Las migraciones se aplican en orden: `20260922000000_shipments_and_roles.sql`, `20260924051741_presentation_simulation.sql` y `20260924061348_audience_name_entry.sql`. Después se despliega `make-server-845b49a4`. Antes de cambiar configuración remota, ejecuta `supabase config diff --project-ref <ref>` para revisar el alcance.

El navegador sólo recibe la URL y la clave publicable de Supabase. La función Edge conserva la clave de servicio y comprueba cada token mediante `auth.getUser`. El rol se consulta en `profiles`, nunca en metadatos editables. RLS permite a cada `USER` leer y crear paquetes únicamente a su nombre; el rol `ADMIN` antiguo puede consultar todos y asignar propietarios. La lectura de rutas ficticias de presentación es pública, porque el proyector no inicia sesión. Crear presentaciones y rutas requiere una identidad anónima o antigua válida. Las rutas muestran el nombre o apodo y un código breve derivado del identificador del participante.

## API

Todas las rutas tienen el prefijo `/make-server-845b49a4`.

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/health` | Público |
| GET | `/me` | Participante identificado |
| GET | `/users` | `ADMIN` antiguo |
| GET | `/shipments` | Propios; `ADMIN` ve todos |
| POST | `/shipments` | Propios; `ADMIN` puede asignar otro propietario |
| GET | `/shipments/:guide` | Propietario o `ADMIN` |
| POST | `/presentation/runs` | Cualquier participante identificado |
| GET | `/presentation/runs/:runId/shipments` | Público |
| POST | `/presentation/runs/:runId/shipments` | Cualquier participante identificado |

Para registrar un paquete se envía `{ "ownerId": "<uuid>", "recipient": "...", "address": "...", "city": "...", "description": "..." }`; la guía y el estado los asigna la base de datos. Para una ruta ficticia se envía `{ "originCountry": "MX", "destinationCountry": "JP" }`. La respuesta de presentación incluye `participantId` y `participantName`. Los errores usan `{ "error": "...", "code": "..." }`.

La publicación `supabase_realtime` transmite rutas nuevas al proyector, que también consulta el servidor periódicamente. La tabla de presentación está separada de `shipments` y no guarda dirección ni destinatario real. El estado académico actual de un paquete es `Registrado`.

# Supabase: paquetes académicos y presentación

El cliente pide un nombre y llama a `signInAnonymously`. Supabase asigna un `auth.users.id` distinto por navegador y el trigger `handle_auth_user_insert` crea el perfil. La opción `[auth] enable_anonymous_sign_ins = true` de `config.toml` debe estar activa en el proyecto remoto. El navegador sólo recibe la URL y la clave publicable; la clave de servicio nunca sale de la función Edge.

Las migraciones se aplican en orden: `20260922000000_shipments_and_roles.sql`, `20260924051741_presentation_simulation.sql`, `20260924061348_audience_name_entry.sql` y `20260924063626_presentation_guest_orders.sql`. La última agrega nombre y código de cuatro dígitos a cada paquete simulado, exige unicidad del código por presentación y limita con RLS la lectura directa a las filas propias. Antes de cambiar configuración remota, revisa `supabase config diff --project-ref <ref>`.

El proyecto remoto debe tener el secreto `PRESENTATION_ORGANIZER_KEY`, un valor largo y aleatorio que **no** se guarda en Git ni en variables `VITE_`. La función Edge lo compara con el encabezado `X-Presentation-Key` de los enlaces privados del organizador y del proyector. La clave está en el fragmento `#key=…` de esos enlaces, que no se envía en la solicitud de página; el cliente la transmite sólo a la función Edge en ese encabezado. El enlace del espectador no incluye la clave. Si se pierde, el responsable del proyecto debe fijar un nuevo secreto y generar los nuevos enlaces privados.

## API

Todas las rutas usan el prefijo `/make-server-845b49a4`.

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/health` | Público |
| GET | `/me` | Participante identificado |
| GET | `/users` | `ADMIN` antiguo |
| GET | `/shipments` | Propios; `ADMIN` ve todos |
| POST | `/shipments` | Propios; `ADMIN` puede asignar otro propietario |
| GET | `/shipments/:guide` | Propietario o `ADMIN` |
| POST | `/presentation/runs` | Sólo clave de organizador |
| GET | `/presentation/runs/:runId/shipments` | Con clave: todos; con identidad: sólo propios |
| POST | `/presentation/runs/:runId/shipments` | Participante identificado |

Para crear un paquete de la presentación se envía `{ "packageName": "Regalo", "originCountry": "MX", "destinationCountry": "JP", "trackingCode": "4826" }`. El código acepta exactamente cuatro dígitos, incluidos ceros iniciales. Si otra persona ya lo usó en esa presentación, la función responde `409 TRACKING_CODE_TAKEN`. El nombre del participante se toma del perfil verificado y el identificador de la sesión; no del cuerpo enviado por el navegador.

El proyector consulta la función cada dos segundos. La tabla no concede lectura pública y RLS permite a cada espectador ver sólo sus filas. La función usa la clave de servicio para construir la vista completa **únicamente** después de validar el secreto del organizador. Los paquetes académicos de `shipments` mantienen su propio contrato y guía `ME-…`.

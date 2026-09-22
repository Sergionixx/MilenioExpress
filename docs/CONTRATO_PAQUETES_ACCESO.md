# Contrato de paquetes y acceso para revisión con Sergionix

Este contrato concreta las dependencias de [KAN-11](https://milenioexpress-sergionix.atlassian.net/browse/KAN-11), [KAN-15](https://milenioexpress-sergionix.atlassian.net/browse/KAN-15) y [KAN-19](https://milenioexpress-sergionix.atlassian.net/browse/KAN-19). Las historias describen los campos y permisos, pero no registran un acuerdo final sobre tipos ni propiedad. Esta implementación usa las decisiones siguientes; Sergionix y Juan deben validarlas antes de integrar la rama.

| Dato | API | PostgreSQL | Regla |
| --- | --- | --- | --- |
| Guía | `guide` | `shipments.guide text unique` | La genera la base como `ME-AAAA-########` a partir de una secuencia; el cliente no la envía. El bloque numérico puede crecer después de ocho dígitos. |
| Propietario | `ownerId` | `shipments.owner_id uuid` | Referencia obligatoria a `profiles.id`, que referencia `auth.users.id`. |
| Destinatario | `recipient` | `text` | Texto no vacío, hasta 160 caracteres. |
| Dirección | `address` | `text` | Texto no vacío, hasta 240 caracteres. |
| Ciudad | `city` | `text` | Texto no vacío, hasta 120 caracteres. |
| Descripción | `description` | `text` | Texto no vacío, hasta 2000 caracteres. |
| Estado | `state` | `status text` | `Registrado` durante este alcance de creación y consulta. |

La cuenta inicia sesión mediante Supabase Auth. El servidor valida el token con Auth y obtiene `ADMIN` o `USER` desde `profiles.role`, nunca del cuerpo de la solicitud ni de metadatos editables. Una cuenta nueva recibe `USER`; un administrador de la base promueve de forma explícita las cuentas operadoras. `ADMIN` puede registrar paquetes para cualquier perfil y consultar todos. `USER` sólo consulta paquetes cuyo `owner_id` coincide con su identidad verificada. La interfaz oculta el formulario a `USER`, y la API y las políticas RLS repiten el control en el servidor.

La API responde errores con `{ "error": "mensaje", "code": "CODIGO" }`: `400` para datos o guía inválidos, `401` para ausencia o invalidez de sesión, `403` para falta de permiso, `404` para guía inexistente, `409` para conflicto de guía y `503` para dependencias no disponibles. El contrato completo de rutas y despliegue está en [supabase/README.md](../supabase/README.md).

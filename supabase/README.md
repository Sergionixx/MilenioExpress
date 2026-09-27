# Backend de administración y presentación

La función `make-server-845b49a4` verifica los tokens con Supabase Auth antes de acceder a perfiles o listas privadas. La clave de servicio permanece en sus secretos.

Administración usa correo/contraseña. Los espectadores usan una sesión anónima independiente, creada en segundo plano sólo al crear paquetes. La lectura pública por guía no requiere sesión. El proyecto debe permitir `enable_anonymous_sign_ins`.

Todas las rutas usan el prefijo `/make-server-845b49a4`:

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/health` | Público |
| GET | `/me` | Sesión verificada |
| GET | `/users` | ADMIN |
| GET | `/shipments` | Propietario o ADMIN |
| POST | `/shipments` | ADMIN, también protegido por RLS |
| GET | `/shipments/:guide` | Propietario o ADMIN |
| GET | `/presentation/active` | Público, sólo metadatos de la presentación más reciente |
| GET | `/presentation/runs/:runId` | Público, sólo metadatos |
| POST | `/presentation/runs` | Clave del organizador |
| GET | `/presentation/runs/:runId/track/:code` | Público, un paquete ficticio por guía |
| GET | `/presentation/runs/:runId/shipments` | Sesión: sólo propios; clave del organizador: todos |
| POST | `/presentation/runs/:runId/shipments` | Sesión anónima verificada |

Para crear: `{ "packageName": "Libros", "originCountry": "HK", "destinationCountry": "ES" }`.
El servidor asigna una guía de seis caracteres con aleatoriedad criptográfica. PostgreSQL exige unicidad por presentación; el repositorio reintenta hasta cinco veces una colisión. Campos como `trackingCode`, rol o propietario enviados por el cliente se rechazan. El catálogo compartido valida 32 países/regiones.

El rastreo público excluye `id`, `participantId` y `participantName`. No hay listado público. La tabla permite SELECT con RLS sólo al propietario; el organizador obtiene la vista completa mediante la función y su clave privada.

`PRESENTATION_ORGANIZER_KEY` permanece en secretos de Supabase. Los enlaces privados llevan `#key=…` y envían el valor sólo como encabezado `X-Presentation-Key` a la función. No incluirlo en variables públicas ni en enlaces/QR para espectadores.

Las migraciones se aplican en orden. `20260927022355_public_presentation_tracking.sql` admite las nuevas guías y conserva las antiguas; `20260927024324_separate_admin_and_public_packages.sql` restaura la creación exclusiva ADMIN en paquetes académicos. La dinámica crea en `presentation_shipments`, sin alterar las guías académicas `ME-…`.

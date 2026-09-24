# Milenio Express

`main` se reserva para cambios revisados por Sergionix mediante Pull Request. Esta versión está en `feature/presentacion-interactiva`.

## Ejecutar

Instala Node y pnpm según `.mise.toml`, ejecuta `pnpm install` y `pnpm dev`. Antes de entregar cambios, ejecuta `pnpm test:coverage`, `pnpm exec tsc --noEmit` y `pnpm build`.

La aplicación pide **sólo un nombre** a los participantes. Supabase crea una identidad anónima diferente en cada navegador, sin correo ni contraseña. Si se borran los datos del navegador, se pierde el acceso a los paquetes asociados a esa identidad. Las claves `VITE_` son públicas; jamás coloques una clave de servicio u organizador en el cliente o en Git.

## Presentación en vivo

Hay tres pantallas oscuras y separadas:

1. **Organizador, en computadora:** abre su enlace privado `/presentacion/control#key=…`, inicia una presentación y recibe dos enlaces. Sólo este enlace permite iniciar presentaciones.
2. **Espectador, en celular:** recibe únicamente `/presentacion/participar/:runId`. Escribe su nombre, ve un menú sencillo, nombra su paquete, elige dos países y pone un código de rastreo de **cuatro dígitos**. El código debe ser único en esa presentación. Después ve avanzar su propio paquete por Salida, Clasificación, Tránsito, Aduana y Destino. No tiene menú de organización ni acceso a los paquetes de otros espectadores.
3. **Proyector:** abre el otro enlace privado `/presentacion/pantalla/:runId#key=…`. Muestra todas las líneas, nombres de paquetes, participantes y códigos; los datos se actualizan automáticamente. El enlace y la clave no se comparten con los espectadores.

Esta dinámica usa paquetes ficticios separados del módulo académico: no contiene dirección, destinatario ni guía `ME-…`. El organizador puede iniciar una presentación nueva sin mezclar rutas previas. `/presentacion/pantalla/vista-previa` muestra datos de ejemplo sólo durante desarrollo.

`pnpm test:live-auth` verifica la función desplegada. `pnpm test:live-presentation` verifica que la pantalla completa no tenga lectura pública. `pnpm test:live-guests` necesita `MILENIO_ORGANIZER_KEY` en el entorno y crea una presentación y dos paquetes ficticios en el proyecto configurado para probar los permisos. La configuración y el contrato del servidor están en [supabase/README.md](supabase/README.md); la publicación web, en [docs/PRESENTACION_EN_LINEA.md](docs/PRESENTACION_EN_LINEA.md).

# Milenio Express

`main` se reserva para cambios revisados por Sergionix mediante Pull Request. Cada colaborador trabaja en su rama; esta versión se desarrolla en `feature/presentacion-interactiva`.

## Ejecutar

Instala las versiones de Node y pnpm de `.mise.toml`, ejecuta `pnpm install` y después `pnpm dev`. Antes de entregar cambios, ejecuta `pnpm test:coverage`, `pnpm exec tsc --noEmit` y `pnpm build`.

La aplicación pide **sólo un nombre** para entrar. Supabase crea una identidad anónima diferente en cada navegador, sin correo ni contraseña. La sesión se conserva en ese navegador; si se borran sus datos o se cambia de participante, se pierde el acceso a sus paquetes anteriores. El nombre o apodo puede mostrarse públicamente en el proyector. Las claves `VITE_` son públicas; nunca pongas una clave de servicio en el cliente.

## Presentación en vivo

1. Un organizador entra con su nombre, abre `/presentacion/control` e inicia una presentación.
2. Abre el enlace `/presentacion/pantalla/:runId` en la computadora conectada al proyector.
3. Comparte el enlace `/presentacion/participar/:runId` con los espectadores. Cada uno entra desde su celular, escribe su nombre la primera vez y elige los países de origen y destino.
4. Cada envío simulado crea una línea horizontal que avanza por Salida, Clasificación, Tránsito, Aduana y Destino. La pantalla muestra nombre y código breve del participante para distinguir celulares que usen el mismo nombre.

El proyector lee las rutas ficticias en tiempo real y vuelve a consultar si se interrumpe la conexión. Estas rutas no son paquetes académicos: no tienen guía ni dirección. Para una nueva demostración, inicia otra presentación. `/presentacion/pantalla/vista-previa` muestra una prueba local durante desarrollo.

`pnpm test:live-auth` verifica que la función publicada rechaza solicitudes sin identidad. `pnpm test:live-presentation` comprueba la lectura pública. `pnpm test:live-guests` crea dos identidades anónimas, dos rutas y un paquete ficticio para comprobar separación de datos; úsalo sólo cuando quieras escribir esos datos de prueba en el proyecto Supabase configurado.

La configuración y el contrato del servidor están en [supabase/README.md](supabase/README.md). La publicación del cliente está explicada en [docs/PRESENTACION_EN_LINEA.md](docs/PRESENTACION_EN_LINEA.md). [docs/SERGIO_VERIFICACION.md](docs/SERGIO_VERIFICACION.md) contiene evidencia histórica del módulo académico anterior al cambio de acceso.

# Presentación interactiva en línea

Fecha: 23 de septiembre de 2026. Rama: `feature/presentacion-interactiva`. `main` no se modificó.

## Estado comprobado

- La migración `20260924051741_presentation_simulation.sql` se aplicó al proyecto Supabase `rltahgouyixqquspofsf`. Una consulta confirmó las tablas nuevas.
- Se desplegó la función Edge `make-server-845b49a4`. `pnpm test:live-auth` y `pnpm test:live-presentation` comprobaron salud, rechazo de escrituras sin sesión, errores de presentación y lectura pública de los datos ficticios.
- Se creó una presentación de prueba con el identificador `b805f40c-0138-426c-ab03-dc95519622d3` y dos envíos ficticios. En la web publicada, el segundo apareció en el proyector sin recargar la página. Esta prueba verifica la sincronización; no verificó todavía el formulario `ADMIN` en un celular real.
- Se publicó el cliente en Vercel como despliegue **temporal**. Su URL y el enlace para reclamarlo se entregaron al responsable del proyecto; el despliegue anónimo vence 60 minutos después de crearse si no se reclama.

## Lo que se necesita para conservarlo y presentarlo

1. Reclamar el despliegue temporal desde el enlace de Vercel compartido en la conversación e iniciar sesión en una cuenta propia. Si vence, publicar de nuevo el contenido de esta rama en Vercel o Netlify. `vercel.json` y `public/_redirects` preparan las rutas de React para ambos servicios. El repositorio puede permanecer privado y `main` no necesita recibir esta rama para hacer una publicación manual.
2. Usar una cuenta del proyecto Supabase con rol `ADMIN` en el celular. Ya existe un perfil `ADMIN`; no se requiere crear otra cuenta para empezar. Abrir `https://<dominio>/presentacion/control`, pulsar **Iniciar nueva presentación** y copiar el enlace del proyector.
3. Abrir ese enlace en la computadora conectada al proyector. Desde el celular, elegir países diferentes y pulsar **Enviar al proyector** varias veces. Confirmar que cada envío crea una línea independiente y avanza por los cinco puntos de control.

La pantalla del proyector es pública sólo para datos ficticios; la escritura pasa por la función y exige `ADMIN`. Si cambia el dominio, basta abrir de nuevo el control desde la nueva URL: el enlace del proyector se construye con el dominio actual. No hacen falta datos ni código de Juan o Humberto para esta dinámica.

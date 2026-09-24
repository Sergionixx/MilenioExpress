# Presentación interactiva en línea

Rama: `feature/presentacion-interactiva`. `main` no se modificó.

## Estado comprobado

- Supabase `rltahgouyixqquspofsf` tiene activado el acceso anónimo y las tres migraciones del proyecto. La función Edge `make-server-845b49a4` está desplegada.
- `pnpm test:live-guests` confirmó que dos participantes reciben identificadores y nombres distintos, pueden enviar rutas a una misma presentación y que el proyector público muestra ambos. También confirmó que uno no puede consultar ni crear paquetes académicos a nombre del otro.
- En la interfaz local se comprobó la entrada con nombre, la creación de una presentación, el enlace para los celulares y el envío desde la página de participante.
- La versión actual está en un [despliegue temporal de Vercel](https://temporary-swift-indigo-eled1sk.vercel.app). Se comprobó que un invitado puede abrir directamente un enlace de participación, escribir su nombre y llegar a esa presentación. El despliegue caduca aproximadamente una hora después de crearse el 24 de septiembre de 2026. Para conservarlo, [reclámalo en Vercel](https://vercel.com/claim-deployment?code=93b0a8d4-01d6-40f6-a4c1-98708392dc0b) o publica la rama desde una cuenta propia. `vercel.json` y `public/_redirects` preparan las rutas directas para Vercel y Netlify.

## Uso durante la exposición

1. Publicar el cliente desde esta rama en Vercel o Netlify y abrir el dominio HTTPS en la computadora del proyector y los celulares.
2. Una persona escribe su nombre, entra a `/presentacion/control`, inicia una presentación y copia el enlace del proyector y el de los participantes. La página de control puede quedar abierta en su celular.
3. Abrir el enlace del proyector en la computadora. Compartir el otro enlace con los espectadores.
4. Cada espectador escribe su nombre o apodo la primera vez en su navegador, elige dos países diferentes y pulsa **Enviar al proyector**. Cada ruta aparece con el nombre y un código breve propio de ese navegador.

El enlace del proyector muestra únicamente rutas ficticias y los nombres o apodos que los participantes decidan escribir. No se muestran paquetes ni direcciones académicas. Si se borran los datos del navegador o se pulsa **Cambiar participante**, se pierde la identidad anónima de ese navegador y el acceso a sus paquetes anteriores. Para más de 30 participantes detrás de una misma IP en una hora, revisa el límite de altas anónimas de Supabase antes de la exposición.

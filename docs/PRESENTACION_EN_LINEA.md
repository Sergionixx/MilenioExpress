# Presentación interactiva en línea

Rama: `feature/presentacion-interactiva`. `main` no se modificó.

## Preparación

Supabase `rltahgouyixqquspofsf` tiene activado el acceso anónimo, las cuatro migraciones aplicadas y la función Edge desplegada. El secreto del organizador está en Supabase y en un archivo local fuera del repositorio, bajo el perfil del responsable del proyecto. Nunca compartas ese secreto ni el enlace del proyector con los espectadores.

El cliente web necesita un dominio HTTPS común para la computadora y los celulares. Las rutas directas están configuradas para Vercel (`vercel.json`) y Netlify (`public/_redirects`). Un despliegue temporal de Vercel caduca aproximadamente una hora después de publicarse; para una exposición real, publícalo o reclama el despliegue desde una cuenta de hosting propia. Al cambiar de dominio, conserva la misma parte `#key=…` en el enlace privado del organizador y abre ese enlace en el dominio nuevo.

## Orden durante la exposición

1. En la computadora, abre el enlace **privado del organizador** `/presentacion/control#key=…` e inicia una presentación.
2. Abre en el proyector el enlace **privado del proyector** que aparece en la primera tarjeta. Puedes poner el navegador en pantalla completa para ocultar su barra de direcciones.
3. Comparte **únicamente** el enlace de la segunda tarjeta con los espectadores. Ese enlace no contiene la clave privada.
4. Cada espectador escribe su nombre en su celular, nombra el paquete, elige país de salida y destino y pone un código de rastreo de cuatro dígitos. Ve la línea de tiempo de su propio paquete en la misma pantalla.
5. El proyector agrega las rutas nuevas automáticamente. Los espectadores no ven el control ni las rutas ajenas desde su enlace.

Los nombres y paquetes de esta dinámica son ficticios y visibles en el proyector. Los códigos de rastreo deben ser únicos sólo dentro de una presentación. Si dos personas eligen el mismo, la segunda debe poner otro. Borrar los datos del navegador hace que se pierda la identidad anónima y el acceso a sus paquetes anteriores. Para más de 30 espectadores detrás de la misma IP en una hora, revisa el límite de altas anónimas de Supabase antes de la exposición.

`pnpm test:live-guests` comprobó dos celulares simulados: cada uno ve sólo su paquete, el proyector ve ambos, un código repetido se rechaza y la tabla no permite lectura pública. También se probó en navegador el envío desde el menú oscuro del participante y su aparición en la pantalla del proyector.

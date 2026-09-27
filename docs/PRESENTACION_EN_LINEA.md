# Usar la presentación

## Preparar

1. En la computadora, abre el enlace privado del organizador. Conserva el fragmento `#key=…`; no lo compartas con los espectadores.
2. Pulsa **Iniciar presentación**. Esto crea una sesión vacía y separada de las anteriores.
3. Abre **Proyector**, pulsa **Pantalla completa** y proyecta esa pestaña.
4. Comparte el enlace para espectadores o muestra el QR del proyector. Ese QR sólo contiene el enlace público de la presentación, nunca el secreto del organizador.

## Dinámica

El teléfono tiene dos acciones: **Rastrear paquete** y **Crear paquete**. Para crear, basta un nombre de paquete y los países de origen/destino. Se genera una guía de seis caracteres y aparece en el teléfono y proyector. **Mis paquetes** contiene sólo los creados desde ese navegador, incluso después de recargar.

Cualquier espectador puede escribir una guía visible en el proyector para consultar su recorrido. No requiere registrarse ni crear una identidad. Rastrear un paquete ajeno no lo agrega a su lista personal.

Hay 32 países y regiones y cinco instalaciones con nombres concretos por ruta. Los envíos son ficticios; la simulación dura 90 segundos y no representa una conexión comercial real ni un envío físico.

El proyector adapta la cuadrícula al número de paquetes y a la altura de pantalla. Se verificaron 30 tarjetas sin scroll a 1280×720, 1366×768 y 1920×1080. Más de 30 usan páginas de 30 con rotación automática y botones anterior/siguiente.

## Accesos

- [Página pública](https://milenio-express-presentacion.lospollso123.chatgpt.site): abre la presentación más reciente.
- [Administración](https://milenio-express-presentacion.lospollso123.chatgpt.site/admin): login del equipo y panel existente, sólo ADMIN.
- Control y proyector: enlaces privados generados con la clave existente del organizador. La clave no está en Git ni en la web pública.

La configuración aplicada en Supabase conserva el acceso anónimo para crear paquetes. Se añadieron las migraciones `20260927022355` y `20260927024324`, con historial remoto registrado, y se desplegó la función Edge. El rastreo público devuelve sólo guía, nombre ficticio del paquete, países, presentación y fecha; no devuelve el identificador ni nombre del participante. Los listados y la tabla siguen protegidos.

El límite de altas anónimas se amplió de 30 a 100 para dar margen a los participantes desde una red compartida. Se aplicó sólo ese parámetro de Auth y se verificó con el diff remoto; las demás propiedades se conservaron.

Si se borran los datos del navegador se pierde su lista personal; las guías permiten seguir rastreando. Las identidades de creación están sujetas a los límites de altas anónimas de Supabase: conviene reutilizar el navegador durante la dinámica y revisar su límite antes de una exposición masiva desde una misma red.

## Evidencia

[Reporte de UI](evidencia/presentacion/resultados-ui.json), ocho capturas de teléfono/escritorio/proyector y las pruebas reproducibles de README. Se comprobaron guías únicas, separación de dos teléfonos, rastreo público desde un tercero, recarga, errores, actualización de progreso y login administrativo.

Los avisos de los asesores de Supabase sobre funciones existentes con SECURITY DEFINER y la configuración de contraseñas no constituyen una auditoría completa del proyecto. Las políticas de lectura propia para usuarios anónimos son intencionales; las pruebas verifican su aislamiento.

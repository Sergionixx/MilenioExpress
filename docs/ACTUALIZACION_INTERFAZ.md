# Interfaz renovada y creación de cuentas

Actualización de producto solicitada después de la entrega académica, en la rama **dev-maxi**. El objetivo es mejorar el uso diario de la aplicación y permitir que una persona cree su propia cuenta desde el inicio de sesión.

## Qué cambió y para qué

| Cambio | Para qué sirve | Dónde verlo |
|---|---|---|
| Diseño amplio con menú lateral en computadora; navegación inferior en celular | Aprovechar la pantalla y facilitar el acceso a cada sección | Inicio, Consultar, Paquetes, Registrar y Perfil |
| Tipografía del sistema, colores sobrios, botones y formularios consistentes | Mejorar la lectura sin depender de una descarga de fuentes externas | Toda la aplicación |
| Resumen de paquetes y ciudades | Mostrar información calculada con los paquetes disponibles para la cuenta, sin cifras de demostración | Inicio |
| Botón **Crear cuenta** y formulario | Registrar nombre, correo, contraseña y confirmación | Acceso → Crear cuenta (`/crear-cuenta`) |
| Validación y mensajes de registro | Explicar contraseñas diferentes, errores y límites de intentos | Formulario de cuenta |

Se mantienen login, roles ADMIN/USER, consulta y registro de paquetes, generación y copia de guías, detalle, perfil y cierre de sesión. El servidor conserva sus controles de acceso. No se fusionó la presentación de otra rama ni se modificó `main`.

## Cómo usar el registro

1. Ejecutar `pnpm install --frozen-lockfile` y `pnpm dev` desde el proyecto, con Node 24 y pnpm 10.34.3.
2. Abrir `http://localhost:8443` y pulsar **Crear cuenta**.
3. Introducir nombre, correo y una contraseña de al menos ocho caracteres; repetir la contraseña.
4. La cuenta entra directamente después del registro; no requiere abrir un enlace recibido por correo.
5. La cuenta nueva tiene rol **USER** y puede consultar sus propios paquetes. El listado está vacío hasta que un administrador le registre un paquete.

El nombre viaja como `full_name`; no se envía un rol. La migración existente crea el perfil con rol USER. No se utilizan claves privadas del servidor en el navegador.

## Configuración del acceso

El 24/09/2026 se desactivó **Confirm email** en el proyecto Supabase compartido. El proveedor **Email** y el registro de usuarios permanecen habilitados. La configuración local equivalente está en `supabase/config.toml`.

Para registrar una cuenta nueva no se necesita configurar SMTP ni una URL de redirección de confirmación. El inicio de sesión sigue usando correo y contraseña. Las cuentas nuevas reciben el rol USER.

Si Supabase devuelve un registro sin sesión, la aplicación muestra un error y permite volver a intentarlo o iniciar sesión; no indica que haya enviado un correo.

## Cómo comprobar esta actualización

- **Pruebas de código:** `pnpm test` y `pnpm test:coverage`; incluyen validaciones y mensajes del nuevo registro junto con las pruebas existentes. La cobertura declarada incorpora `src/lib/registration.ts` y no representa toda la interfaz.
- **Construcción:** `pnpm typecheck` y `pnpm build`.
- **Recorrido real en navegador:** el workflow existente ejecuta los escenarios anteriores y dos nuevos: registro público desde la interfaz y comprobación de perfil USER, reingreso y rechazo de acceso administrativo. La prueba consulta Auth y PostgreSQL para comprobar que realmente se creó el usuario y su perfil. Usa Supabase aislado y elimina las cuentas ficticias al terminar.
- **Resultados:** abrir [GitHub Actions de dev-maxi](https://github.com/Sergionixx/MilenioExpress/actions?query=branch%3Adev-maxi), elegir la ejecución del commit y consultar el job `integracion` y el artefacto `integracion-supabase-local`. El reporte es `reportes/integracion/ui-resultados.json`; las capturas están en `evidencias/ci-ui/` dentro del artefacto. Son 11 escenarios previstos: 10 recorridos de aplicación y una captura del tablero de calidad, en anchos de 320, 375, 430 y 1440 px.
- **Revisión visual local adicional:** las pantallas se revisan con datos ficticios y respuestas simuladas para estados de error o registro deshabilitado. Esa revisión no sustituye una integración real con el servidor.

Los artefactos de Actions se conservan durante 30 días. El informe académico y sus reportes originales mantienen su corte anterior; se conservan como evidencia histórica y no se reemplazan por resultados de esta actualización.

## Vistas de la interfaz

Estas capturas muestran las pantallas públicas del rediseño, sin cuentas reales ni contraseñas. Para evidencia del registro real, consultar el recorrido de Actions descrito arriba.

![Inicio de sesión en computadora](imagenes/interfaz/login-escritorio.png)

![Crear cuenta en celular](imagenes/interfaz/registro-celular.png)

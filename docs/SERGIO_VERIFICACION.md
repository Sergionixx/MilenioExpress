# Verificación de autenticación e integración — Sergio

Fecha: 23 de septiembre de 2026. Rama: `dev-sergionix`. Proyecto remoto: `rltahgouyixqquspofsf`.

## Alcance y contrato

El contrato de campos y errores está en [CONTRATO_PAQUETES_ACCESO.md](CONTRATO_PAQUETES_ACCESO.md). La función obtiene el rol de `profiles`, después de verificar el token con Supabase Auth; la interfaz no puede asignarse `ADMIN`. La matriz esperada es:

| Operación | Sin sesión | USER | ADMIN |
| --- | --- | --- | --- |
| Ver perfil propio | Rechazado | Permitido | Permitido |
| Ver propietarios | Rechazado | Rechazado | Permitido |
| Registrar paquete | Rechazado | Rechazado | Permitido |
| Consultar paquete propio | Rechazado | Permitido | Permitido |
| Consultar paquete ajeno | Rechazado | Rechazado | Permitido |

Los módulos de creación y consulta son responsabilidad de Juan; esta matriz y la verificación del token son la parte de Sergio que consumen esos módulos. El contrato aún requiere acuerdo de Juan y Sergio antes de integrar a `main`.

## Evidencia comprobada

- `pnpm test`: 15/15 pruebas aprobadas. Incluyen verificación de token sustituible, perfil y rol confiable, acciones ADMIN, propiedad de USER y errores de infraestructura.
- `pnpm exec tsc --noEmit`: sin errores.
- `pnpm build`: correcto. Vite advierte que el paquete JavaScript supera 500 kB; no bloquea el flujo académico.
- `pnpm test:live-auth`: `/health` devuelve 200; cuatro rutas GET y el registro POST sin sesión devuelven `401 UNAUTHENTICATED`; `/me` con token inválido devuelve `401 INVALID_TOKEN`. La prueba usa la función desplegada, no sustitutos.
- El panel del proyecto muestra la migración `shipments_and_roles` como última migración, y las tablas `profiles` y `shipments` existen. El 23 de septiembre se crearon dos cuentas ficticias confirmadas en Authentication. Sus perfiles se generaron con `USER`; después se asignó `ADMIN` exclusivamente a `operador.prueba@example.com`. Una actualización de la tabla confirmó `ADMIN` para la operadora y `USER` para `cliente.prueba@example.com`. Las contraseñas no están en el repositorio.
- La pantalla de login local se probó con credenciales ficticias incorrectas: ahora presenta «Correo o contraseña incorrectos» en español, sin conceder acceso. Los controles tienen etiquetas y el error está asociado a ambos campos.
- El 23 de septiembre se abrió el login en Edge con emulación móvil de 320, 375 y 430 px. En los tres tamaños, el ancho del documento coincidió con el de la pantalla (sin desbordamiento horizontal). Se inspeccionaron las tres capturas: texto, campos y botón son legibles y no aparecen cortados. Capturas: [320 px](evidencia/login-320.png), [375 px](evidencia/login-375.png) y [430 px](evidencia/login-430.png).
- En la interfaz local, la operadora inició sesión y registró `ME-2026-00000001` para la cuenta cliente. La consulta mostró destinatario, dirección, ciudad, descripción y estado; tras recargar la página, la sesión y los datos persistieron. Cerró sesión; la cuenta cliente ingresó, vio su paquete y fue redirigida a Inicio al abrir directamente `/registrar`.
- La operadora registró `ME-2026-00000002` como paquete propio. La cuenta cliente intentó abrir esa guía directamente y recibió «No tienes permiso para consultar este paquete.»
- En un registro adicional de prueba, la operadora generó `ME-2026-00000004`, pulsó «Copiar guía» y el portapapeles devolvió exactamente esa guía.
- `pnpm test:live-roles` comprobó contra Supabase y la función desplegada: `/me` devolvió `ADMIN` y `USER` según la cuenta; `/users` permitió ADMIN y rechazó USER con `403 FORBIDDEN`; la consulta de guía propia devolvió 200 y la ajena `403 FORBIDDEN`; guía mal formada `400 INVALID_GUIDE`; guía inexistente `404 SHIPMENT_NOT_FOUND`; listado propio 200; POST como USER `403 FORBIDDEN`. No registra paquetes nuevos. Requiere credenciales por variables de entorno.
- Con una página temporal local que enmarcó la aplicación a 320, 375 y 430 px, se inspeccionaron visualmente la consulta autenticada y el formulario de registro. No se observaron elementos cortados ni desbordamiento horizontal. A 320 px, ADMIN registró `ME-2026-00000003` para USER y abrió su detalle con datos correctos. La página temporal de prueba se retiró del proyecto después de la revisión. Las capturas de estas pantallas se observaron en la sesión; sólo las del login quedaron guardadas como archivos de evidencia.
- La tabulación en el formulario de registro avanzó por propietario → destinatario → dirección → ciudad → descripción → guardar. En el login avanzó por correo → contraseña → iniciar sesión. Ambos recorridos se probaron con teclado en la aplicación local; no se repitió la tabulación dentro de cada ancho móvil.

Estas comprobaciones prueban el recorrido mínimo de acceso, creación, consulta, persistencia y separación de roles con cuentas ficticias, más el registro funcional a 320 px y la inspección visual de registro y consulta a 320, 375 y 430 px. **No** dejan capturas autenticadas guardadas como archivos ni repiten el teclado en cada ancho.

## Pendiente para cerrar la verificación móvil

1. Repetir el recorrido de teclado en 320–430 px y guardar capturas de las pantallas autenticadas de la versión final en archivos de evidencia.
2. Entregar la evidencia de autenticación a Juan para KAN-29 y la del recorrido a Máximo para KAN-57. Registrar defectos que aparezcan en la revisión final.

El backend remoto ya mostró operaciones de datos y permisos por rol; `/health` por sí solo no se usa como prueba de cierre. KAN-53 sigue parcialmente verificada hasta completar el recorrido móvil autenticado.

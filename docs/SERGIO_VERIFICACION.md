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

- `pnpm test`: 17/17 pruebas aprobadas. Incluyen verificación de token sustituible, perfil y rol confiable, acciones ADMIN, propiedad de USER, errores de infraestructura y retirada de la sesión tras un `401` del servidor. `403` y errores de red conservan la sesión.
- `pnpm test:coverage`: 17/17; 100 % de líneas, ramas y funciones en los cuatro módulos declarados en [QA_COVERAGE.md](QA_COVERAGE.md), con umbral mínimo de 80 %.
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
- En Edge con emulación móvil a 320, 375 y 430 px se probaron el formulario de registro y el detalle de `ME-2026-00000003` con sesión ADMIN. En los seis casos, el ancho del documento coincidió con el viewport; se inspeccionaron las capturas finales y no hubo elementos cortados. Registro: [320 px](evidencia/sergio-registro-320.png), [375 px](evidencia/sergio-registro-375.png), [430 px](evidencia/sergio-registro-430.png). Consulta: [320 px](evidencia/sergio-consulta-320.png), [375 px](evidencia/sergio-consulta-375.png), [430 px](evidencia/sergio-consulta-430.png).
- La tabulación se repitió a 320, 375 y 430 px en el formulario: propietario → destinatario → dirección → ciudad → descripción → guardar. En el login se comprobó correo → contraseña → iniciar sesión. Se verificaron etiquetas, mensajes de error y lectura de las pantallas capturadas. Se añadió un contorno visible de 3 px para el foco de teclado y se comprobó visualmente en el correo del login. El selector de propietario abre con su nombre visible aunque el correo puede truncarse a 320 px.
- Un rechazo de sesión simulado mediante el evento de la interfaz redirigió al acceso y ocultó el detalle protegido. La prueba unitaria comprobó que un `401` de la API provoca esa invalidación; la prueba no esperó el vencimiento real del JWT. El cierre voluntario elimina la sesión local de este navegador.

Estas comprobaciones prueban el recorrido mínimo de acceso, creación, consulta, persistencia y separación de roles con cuentas ficticias, más la inspección visual de registro y consulta y la tabulación del formulario a 320, 375 y 430 px.

## Límites y entrega de evidencia

1. Para [KAN-18](https://milenioexpress-sergionix.atlassian.net/browse/KAN-18) falta una prueba aislada con un JWT auténtico ya vencido. Se comprobó contra el proyecto remoto el rechazo de sesión ausente y token inválido; en la prueba sustituible, un token que el proveedor rechaza recibe `401 INVALID_TOKEN`. No se presenta eso como prueba de expiración real.
2. Juan puede incorporar los resultados de autenticación y rol a KAN-29; Máximo puede incorporar las nueve capturas y este recorrido a KAN-57. El contrato de campos y errores aún requiere conformidad de Juan antes de integrar a `main`.

El backend remoto ya mostró operaciones de datos y permisos por rol; `/health` por sí solo no se usa como prueba de cierre. La revisión móvil se hizo en emulación de Edge, no en un dispositivo físico.

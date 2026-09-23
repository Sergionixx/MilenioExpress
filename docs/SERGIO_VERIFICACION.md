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
- El panel del proyecto muestra la migración `shipments_and_roles` como última migración, y las tablas `profiles` y `shipments` existen. `profiles` muestra 0 registros y Authentication muestra 0 usuarios en esta revisión.
- La pantalla de login local se probó con credenciales ficticias incorrectas: ahora presenta «Correo o contraseña incorrectos» en español, sin conceder acceso. Los controles tienen etiquetas y el error está asociado a ambos campos.
- El 23 de septiembre se abrió el login en Edge con emulación móvil de 320, 375 y 430 px. En los tres tamaños, el ancho del documento coincidió con el de la pantalla (sin desbordamiento horizontal). Se inspeccionó visualmente la captura de 320 px: texto, campos y botón son legibles y no aparecen cortados. Capturas: [320 px](evidencia/login-320.png), [375 px](evidencia/login-375.png) y [430 px](evidencia/login-430.png). Esto cubre sólo la pantalla pública; la creación y consulta móviles siguen pendientes de cuentas reales.

Estas comprobaciones **no** prueban un inicio de sesión válido, la autorización de ADMIN/USER con identidades reales, la persistencia de paquetes, el cierre de sesión tras recargar ni el recorrido móvil completo. No se marcarán esos resultados como aprobados hasta ejecutarlos.

## Recorrido pendiente con cuentas ficticias

1. Crear una cuenta operadora y una cuenta cliente desde Authentication > Users, con credenciales gestionadas fuera del repositorio. Confirmar que aparezcan en `profiles`; asignar `ADMIN` sólo a la operadora mediante la instrucción de [supabase/README.md](../supabase/README.md). La cuenta cliente permanece `USER`.
2. En la interfaz, iniciar sesión como ADMIN. Registrar un paquete para la cuenta USER, copiar la guía devuelta, recargar y consultarlo. Confirmar que la misma guía y sus datos persisten.
3. Cerrar sesión e iniciar como USER. Consultar la guía propia; verificar que la ruta de registro no permita crear y que una solicitud directa POST reciba `403 FORBIDDEN`.
4. Crear o identificar otro paquete con propietario distinto. Como USER, comprobar que la consulta directa de esa guía reciba `403 FORBIDDEN`; sin sesión, comprobar `401 UNAUTHENTICATED`. Probar una guía inexistente y una mal formada.
5. Repetir login, creación, consulta y logout en anchos de 320, 375 y 430 px; revisar desbordamiento horizontal, foco de teclado, etiquetas, mensajes y legibilidad. Guardar capturas de la versión final.
6. Anotar fecha, versión/commit, usuario ficticio usado sin contraseña, pasos, resultado esperado y obtenido, y defectos. Entregar la evidencia de autenticación a Juan para KAN-29 y la evidencia del recorrido a Máximo para KAN-57.

Sin esas cuentas, KAN-18/19/20/21 y KAN-52/53 sólo tienen verificación parcial. El backend remoto responde, pero `/health` por sí solo no demuestra operaciones de datos ni permisos por rol.

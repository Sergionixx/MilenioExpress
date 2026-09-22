# Avance de Juan Deluquez — MilenioExpress

- **Fecha:** 22 de septiembre de 2026
- **Rama de entrega:** `codex/juan-paquetes-qa`
- **Commits:** `04307a5` (registro, consulta y pruebas) y `ac000ce` (encabezado público de Supabase). `main` no se modificó.

Este archivo resume el trabajo de paquetes asignado a Juan, las dependencias con Sergionix y lo necesario para que Humberto y Maximo continúen el plan. **“Implementado” significa que el código está en esta rama; no significa que ya esté desplegado o validado contra Supabase real.**

Al revisar el tablero el 22 de septiembre, las ocho tareas de Juan de la tabla siguiente seguían asignadas a él, en estado **Pendiente** y con vencimiento el **25 de septiembre de 2026**. No se cambiaron sus estados en Jira.

## Qué se implementó para mis asignaciones

| Jira | Entrega en esta rama | Verificación que falta |
| --- | --- | --- |
| [KAN-14](https://milenioexpress-sergionix.atlassian.net/browse/KAN-14) | Migración PostgreSQL con `profiles`, `shipments`, propietario vinculado a Supabase Auth, restricciones y políticas RLS. | Aplicar la migración en un proyecto de pruebas y comprobar persistencia tras recargar. |
| [KAN-23](https://milenioexpress-sergionix.atlassian.net/browse/KAN-23) | Formulario móvil y API para que `ADMIN` registre propietario, destinatario, dirección, ciudad y descripción; validación en cliente y servidor. | Registrar con una cuenta ADMIN real; confirmar que USER, solicitudes sin token y datos inválidos no crean registros. |
| [KAN-24](https://milenioexpress-sergionix.atlassian.net/browse/KAN-24) | La base genera la guía `ME-AAAA-########` con secuencia y trigger; `UNIQUE` evita duplicados y el backend responde un conflicto sin sobrescribir. | Verificar generación y colisión contra PostgreSQL real. |
| [KAN-27](https://milenioexpress-sergionix.atlassian.net/browse/KAN-27) | Pantalla de confirmación con la guía devuelta por el servidor, botón para copiar y campo seleccionable si falla el portapapeles; enlace a consulta. | Probar copia y alternativa manual en celular. |
| [KAN-29](https://milenioexpress-sergionix.atlassian.net/browse/KAN-29) | 15 pruebas y reporte reproducible con umbral mínimo de 80 %, que incluye lógica de acceso, roles y permisos. | Incorporar resultados de integración de Sergionix y la evidencia de pruebas en entorno real. |
| [KAN-35](https://milenioexpress-sergionix.atlassian.net/browse/KAN-35) | Pruebas de guía inválida o inexistente, acceso denegado y fallas simuladas de red, identidad y base de datos. | Repetir los casos desde la interfaz conectada al proyecto de pruebas. |
| [KAN-38](https://milenioexpress-sergionix.atlassian.net/browse/KAN-38) | API protegida de consulta por guía; ADMIN ve todos los paquetes y USER sólo los propios, con errores `400`, `401`, `403`, `404` y `503`. | Confirmar JWT, propiedad y respuestas con cuentas reales. |
| [KAN-39](https://milenioexpress-sergionix.atlassian.net/browse/KAN-39) | Búsqueda y detalle autenticados, con estados de carga, resultado, guía inexistente, error y reintento. | Recorrer el flujo completo en celular con datos persistidos. |

Los archivos principales son [la migración](supabase/migrations/20260922000000_shipments_and_roles.sql), [la función Edge](supabase/functions/server/index.tsx), [las pantallas](src/App.tsx), [el contrato de paquetes y acceso](docs/CONTRATO_PAQUETES_ACCESO.md) y [la guía de configuración/API](supabase/README.md). La aplicación no ofrece alta pública; al preparar Supabase de pruebas se debe revisar su configuración de registro y crear cuentas ficticias de forma controlada.

## Evidencia disponible y límites

- `pnpm build` y el chequeo de TypeScript pasaron en esta rama.
- `pnpm test:coverage`: **15/15 pruebas aprobadas** y **100 % de líneas, ramas y funciones** en `src/lib/http.ts`, `supabase/functions/server/domain.ts` y `supabase/functions/server/service.ts`. El umbral automático exigido es 80 %. Véase [QA_COVERAGE.md](docs/QA_COVERAGE.md).
- Ese 100 % **no es cobertura de toda la aplicación**: no mide componentes React, rutas HTTP/Deno ni la migración SQL. Las pruebas de negocio usan repositorio y transporte HTTP sustituibles.
- La pantalla pública de acceso se revisó a 320 y 375 px sin desbordamiento horizontal ni errores de consola. La zona autenticada y el recorrido completo en celular siguen sin verificación real.
- JUnit no se incorporó porque este proyecto ejecuta React/TypeScript y una función Edge de Supabase, sin servicio Java. Las pruebas ejercitan los módulos TypeScript que usa la aplicación.

## Lo que falta antes de declarar terminado el flujo

1. **Juan + Sergionix:** revisar y aceptar por escrito [el contrato](docs/CONTRATO_PAQUETES_ACCESO.md): nombres y límites de campos, relación `ownerId` ↔ usuario autenticado, regla ADMIN/USER y formato de errores. Jira enumera los datos, pero no contiene ese acuerdo final. Si cambia el contrato, actualizar migración, API, pantallas y pruebas antes de integrar.
2. **Proyecto Supabase de pruebas:** quedó pendiente porque todavía no tenemos su referencia ni acceso. Allí se debe aplicar la migración, crear cuentas ficticias ADMIN y USER, desplegar la función y probar creación, recarga, guía única, consulta propia/ajena y errores. Antes de desplegar, comprobar que el nombre/ruta de la función publicada coincida con la URL usada por `src/lib/supabase.ts` (`make-server-845b49a4`); el código fuente está en `supabase/functions/server/`.
3. **Sergionix:** revisar la implementación de autenticación/roles de esta rama y completar sus pruebas de JWT, sesión y permisos; entregar esos resultados a Juan para KAN-29. La interfaz protegida depende de ese acceso real.
4. **Prueba conjunta en celular:** con la función y la base desplegadas, iniciar sesión como ADMIN y USER; registrar un paquete, copiar su guía, buscarlo, recargar la página y repetir los casos denegados en un teléfono o emulación móvil. Guardar capturas y resultados.
5. **Humberto:** fijar variables y comandos de ejecución, prueba y compilación; verificar los scripts con la versión de Node 22 declarada en `.mise.toml` (el reporte local se generó con Node 24). Después configurar CI para pruebas, compilación y despliegue. Cuando la aplicación esté integrada, ejecutar SonarQube y ZAP y coordinar correcciones.
6. **Maximo:** incorporar este avance, el contrato y [el reporte de cobertura](docs/QA_COVERAGE.md) a la lista de requisitos de la rúbrica; reunir capturas, resultados de Sergionix/Juan/Humberto y evidencia móvil. Cerrar el README general, el informe, las mejoras propuestas y el ZIP final sólo con resultados ya verificados.

## Orden recomendado de cierre

**Contrato acordado → proyecto de pruebas → migración y cuentas → función desplegada → pruebas ADMIN/USER y celular → evidencia y cobertura actualizada → CI → SonarQube/ZAP → informe y ZIP.**

La integración a `main` queda a cargo del usuario. Este documento no sustituye la revisión de los cambios de la rama ni las pruebas pendientes en el proyecto de pruebas.

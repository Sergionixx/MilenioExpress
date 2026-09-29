# Avance de Sergio — MilenioExpress

- **Fecha:** 23 de septiembre de 2026.
- **Rama de entrega:** `dev-sergionix`. `main` no se modificó.
- **Alcance:** tareas de acceso, backend compartido, integración y revisión móvil asignadas a Sergio en Jira. La revisión de otra persona sigue siendo necesaria antes de integrar a `main`.

## Entrega por tarea

| Jira | Trabajo realizado | Estado para revisión |
| --- | --- | --- |
| [KAN-11](https://milenioexpress-sergionix.atlassian.net/browse/KAN-11) | Base React/Vite conectada a la función y a Supabase; contrato de paquetes y acceso con campos, límites, ejemplo válido y errores; instrucciones de arranque. | Compila y tipa. Falta que Juan confirme por escrito el contrato antes de integrar. |
| [KAN-15](https://milenioexpress-sergionix.atlassian.net/browse/KAN-15) | Backend compartido con validación, respuestas y errores estables; el cliente sólo presenta una guía tras recibir la respuesta del servidor. | Pruebas unitarias y contra la función desplegada aprobadas; sujeto a revisión del contrato común. |
| [KAN-16](https://milenioexpress-sergionix.atlassian.net/browse/KAN-16) | Acceso real con correo/contraseña, mensajes en español, etiquetas y navegación móvil según la sesión. | Login revisado a 320, 375 y 430 px. |
| [KAN-18](https://milenioexpress-sergionix.atlassian.net/browse/KAN-18) | Validación del token en servidor mediante Auth, roles obtenidos de `profiles` y secretos de servicio sólo en el servidor. Pruebas remotas de sesión ausente, token inválido y sesión válida. | **Pendiente una prueba aislada con un JWT auténtico vencido**; no se declara cerrada esta condición. |
| [KAN-19](https://milenioexpress-sergionix.atlassian.net/browse/KAN-19) | Separación ADMIN/USER en interfaz, servicio y RLS: registro y lista de propietarios sólo ADMIN; USER consulta paquetes propios. | Matriz de permisos comprobada con dos cuentas ficticias. |
| [KAN-20](https://milenioexpress-sergionix.atlassian.net/browse/KAN-20) | Sesión conservada tras recarga, cierre local y retirada inmediata del acceso cuando la API responde `401`; un `403` o fallo de red no cierra la sesión. | Pruebas unitarias y verificación de redirección en navegador aprobadas. |
| [KAN-21](https://milenioexpress-sergionix.atlassian.net/browse/KAN-21) | Casos de autenticación, roles, propiedad, denegación, errores de red y sesión rechazada. | 17/17 pruebas y cobertura del alcance medido aprobadas. |
| [KAN-52](https://milenioexpress-sergionix.atlassian.net/browse/KAN-52) | Flujo ADMIN registra → obtiene guía del servidor → consulta; USER ve la guía propia y recibe denegación para una ajena; persistencia tras recarga. | Recorrido probado con función y base desplegadas. |
| [KAN-53](https://milenioexpress-sergionix.atlassian.net/browse/KAN-53) | Revisión de login, registro y consulta a 320, 375 y 430 px; ancho, lectura, etiquetas y orden de teclado. | Nueve capturas guardadas. Revisión hecha con emulación de Edge, no con teléfono físico. |

## Comprobaciones reproducibles

- `pnpm test`: **17/17**.
- `pnpm test:coverage`: **100 %** de líneas, ramas y funciones en `src/lib/http.ts`, `src/lib/session.ts`, `supabase/functions/server/domain.ts` y `supabase/functions/server/service.ts`; umbral mínimo **80 %**. No mide toda la aplicación.
- `pnpm exec tsc --noEmit` y `pnpm build`: correctos. Vite advierte que el archivo JavaScript supera 500 kB; la compilación termina bien.
- `pnpm test:live-auth`: salud 200, rutas protegidas sin sesión `401`, token inválido `401 INVALID_TOKEN`.
- `pnpm test:live-roles`: perfil ADMIN/USER correcto; USER recibe `403` al listar propietarios, registrar o consultar una guía ajena; guías inválidas e inexistentes reciben `400` y `404`.
- En navegador: sesión persistente tras recarga; registro, consulta y copia de guía; salida y redirección al acceso tras una sesión rechazada. Los archivos y detalles de las pruebas móviles están en [SERGIO_VERIFICACION.md](docs/SERGIO_VERIFICACION.md).

## Qué necesito de los demás para continuar

**Para mi código actual, no espero otra implementación de Juan, Humberto ni Máximo.** La función y base de pruebas ya están desplegadas, las cuentas ficticias funcionan y el flujo compartido está integrado en esta rama.

1. **Juan:** confirmar por escrito [el contrato de paquetes y acceso](docs/CONTRATO_PAQUETES_ACCESO.md) antes de integrar a `main`, y usar la evidencia de autenticación y permisos para cerrar su KAN-29. Si detecta un cambio de campos o reglas, debemos ajustar juntos API, pantalla y pruebas.
2. **Humberto:** revisar que la configuración de ejecución, CI y análisis de calidad apunte a esta versión integrada y a las variables públicas correctas; incorporar las pruebas y resultados que le corresponden. Esto afecta la entrega del equipo, no bloquea las tareas de código de Sergio ya probadas.
3. **Máximo:** incluir [las capturas y resultados](docs/SERGIO_VERIFICACION.md) en el informe y la evidencia de KAN-57, indicando que son de emulación móvil.
4. **Revisión final:** para cumplir literalmente KAN-18 aún hace falta probar el rechazo de un JWT auténtico después de su vencimiento. No hace falta cambiar las claves ni la configuración global del proyecto para las demás tareas.

El detalle de API y despliegue está en [supabase/README.md](supabase/README.md), y el reporte de cobertura actualizado está en [QA_COVERAGE.md](docs/QA_COVERAGE.md). La decisión de integrar a `main` queda para la revisión del equipo.

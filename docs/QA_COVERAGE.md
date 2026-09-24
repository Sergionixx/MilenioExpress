# Reporte de pruebas y cobertura

Fecha: 22 de septiembre de 2026. Rama de trabajo: `dev-juan`.

## Resultado reproducible

El proyecto usa TypeScript, React y una función Edge de Supabase. Las pruebas usan el ejecutor nativo de Node.js 24 sobre los módulos de negocio reales; no se agregó un servicio Java para ejecutar JUnit.

Desde la raíz del proyecto:

```powershell
node --experimental-strip-types --test tests/*.test.ts
node --experimental-strip-types --test --experimental-test-coverage --test-coverage-include=src/lib/http.ts --test-coverage-include=supabase/functions/server/domain.ts --test-coverage-include=supabase/functions/server/service.ts --test-coverage-lines=80 --test-coverage-branches=80 --test-coverage-functions=80 tests/*.test.ts
```

También están disponibles como scripts `test` y `test:coverage` en `package.json` cuando el gestor de paquetes del proyecto está instalado. La segunda orden falla si cualquier porcentaje global del alcance medido baja del 80 %.

| Alcance medido | Líneas | Ramas | Funciones |
| --- | ---: | ---: | ---: |
| `src/lib/http.ts` | 100 % | 100 % | 100 % |
| `supabase/functions/server/domain.ts` | 100 % | 100 % | 100 % |
| `supabase/functions/server/service.ts` | 100 % | 100 % | 100 % |
| Total de estos módulos | **100 %** | **100 %** | **100 %** |

Ejecución registrada: 15 pruebas aprobadas, 0 fallidas. La medición incluye la lógica de autenticación, roles y permisos de Sergionix, la validación y consulta de paquetes de Juan, y el cliente HTTP usado por las pantallas.

## Comportamientos comprobados

- Token ausente, inválido y válido; perfil obligatorio y rol obtenido del perfil verificado; fallas del proveedor de identidad y de perfiles convertidas en un error estable sin exponer detalles internos.
- Acciones reservadas a `ADMIN`: consulta de propietarios y registro. Un `USER` no puede ejecutarlas ni provocar una escritura.
- Listados acotados al propietario para `USER`, con un segundo filtro de autorización si el repositorio devolviera una fila ajena; acceso completo para `ADMIN`.
- Guía válida, inválida, inexistente y perteneciente a otra persona; consulta permitida para propietario y `ADMIN`.
- Campos obligatorios, límites de longitud, UUID de propietario, campos adicionales, propietario inexistente, creación correcta y conflicto por guía duplicada.
- Fallos simulados de conexión de base de datos en autenticación, listado, consulta y registro.
- Fallo de red del navegador, errores HTTP 403/404 y cuerpo de error mal formado; el mensaje mostrado no revela detalles internos de la conexión.

## Alcance de la medición

El 100 % corresponde **únicamente a `http.ts`, `domain.ts` y `service.ts`**. No es cobertura de todo el repositorio. Las pruebas usan un repositorio sustituible y un transporte HTTP sustituible para verificar resultados y fallas sin credenciales externas. El adaptador HTTP/Deno, la migración SQL, los componentes React y una base Supabase real requieren verificación de integración por separado.

La pantalla pública de acceso se revisó en navegador a 320 y 375 px: no hubo desplazamiento horizontal ni errores de consola. El flujo autenticado completo en celular aún requiere aplicar la migración, desplegar la función y disponer de cuentas de prueba en el proyecto Supabase.

## Actualización de integración — 23 de septiembre de 2026

La sección anterior conserva el resultado de la rama de Juan del 22 de septiembre. En `dev-sergionix` ya se aplicó la migración, se desplegó la función y se probó el flujo con cuentas ficticias ADMIN y USER; los resultados de integración y las capturas están en [SERGIO_VERIFICACION.md](SERGIO_VERIFICACION.md).

El comando `pnpm test:coverage` ahora incluye `src/lib/session.ts` junto a los tres módulos medidos antes. Resultado: **17 pruebas aprobadas** y **100 % de líneas, ramas y funciones en esos cuatro módulos**; el umbral sigue siendo 80 %. No representa cobertura de todos los componentes React, del adaptador Deno ni de PostgreSQL.

## Presentación interactiva — rama `feature/presentacion-interactiva`

Se añadieron pruebas del servicio de presentaciones y del cálculo de avance del proyector. `pnpm test:coverage` mide también `supabase/functions/server/presentation.ts` y `src/presentation/model.ts`: **23 pruebas aprobadas, 99,08 % de líneas, 95,56 % de ramas y 97,96 % de funciones** en los seis módulos incluidos. Se verificó además `pnpm exec tsc --noEmit`, `pnpm build` y `deno check --config supabase/functions/server/deno.json supabase/functions/server/index.tsx`. La vista de ejemplo del proyector se revisó en navegador: muestra varias líneas, sus puntos de control y el avance visual sin desplazamiento horizontal.

Estas pruebas no sustituyen la prueba de integración con dos dispositivos. La migración y la función nuevas todavía no se han aplicado al proyecto Supabase compartido, y el cliente web todavía no se ha publicado para esta ampliación.

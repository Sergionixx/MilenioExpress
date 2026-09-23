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

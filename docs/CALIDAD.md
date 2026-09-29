# Análisis global de calidad y revisión de hallazgos

## Herramienta equivalente y alcance

La consigna permite SonarQube Community Build **o una alternativa equivalente que genere un tablero de métricas del proyecto** (PDF, página 4). Esta entrega usa un análisis reproducible con ESLint y el complemento oficial SonarJS, información de tipos de TypeScript, detección de duplicación con jscpd y los reportes reales de cobertura del módulo. El resultado puede consultarse sin servidor en [el dashboard final](../reportes/sonar/final.html).

No se ejecutó SonarQube Server/Community Build. La equivalencia está en el análisis global, el tablero, las métricas disponibles, la interpretación y la corrección verificable. No se atribuyen al servidor valores producidos por otras herramientas. La evaluación académica de esta alternativa corresponde a la persona docente; se declara exactamente lo ejecutado.

Se analizan todos los archivos JavaScript/TypeScript de `src/`, `supabase/functions/server/` y `utils/`: interfaz, autenticación cliente, HTTP, dominio, servicio, persistencia y adaptador HTTP. Se excluyen librerías instaladas, bundles, pruebas y scripts de automatización. No se limita el análisis estático a los archivos cubiertos por las pruebas. Los manifiestos JSON conservan ruta y SHA-256 de cada fuente; el código inicial corresponde al commit `0469db39eef618e09c50c5af88bed250032e54d6`.

El análisis inicial se ejecutó sobre las fuentes exactas de ese commit, recuperadas de Git, con las mismas versiones de herramientas y tipos utilizadas para el corte final. **No se presenta como un escaneo realizado históricamente por el equipo.** En particular, los avisos de APIs obsoletas reflejan los tipos de React instalados durante este análisis.

## Reproducción

Instalar las dependencias del lockfile y usar la versión de Node indicada por el proyecto. Los scripts no modifican las fuentes analizadas.

```sh
npm ci
node scripts/quality-report.mjs --ref 0469db39eef618e09c50c5af88bed250032e54d6 --label baseline
npm run test:coverage
node scripts/quality-report.mjs --label final --coverage reportes/pruebas-unitarias/coverage.tap
```

El último comando requiere que el reporte TAP exista. Si la ejecución de `test:coverage` no guarda todavía ese archivo, se puede producir explícitamente, manteniendo los demás parámetros de cobertura definidos por el proyecto:

```sh
mkdir -p reportes/pruebas-unitarias
npm run test:coverage > reportes/pruebas-unitarias/coverage.tap 2>&1
```

Debe comprobarse que el proceso de pruebas termine con código 0 antes de usar sus cifras. El reporte de calidad admite opcionalmente `--audit ruta/a/npm-audit.json`; este archivo debe provenir de una ejecución real de `npm audit --json`. No hace falta red para ejecutar ESLint/jscpd una vez instaladas las dependencias. La referencia inicial debe existir en Git; en CI se necesita historial suficiente (`fetch-depth: 0`) para reconstruirla.

Cada ejecución crea un snapshot temporal del alcance, habilita información de tipos, ejecuta el perfil `recommended` de SonarJS y jscpd y conserva los resultados originales JSON. No aplica arreglos automáticos. El análisis termina con error si una herramienta falla o si hay errores de parseo, pero no bloquea por hallazgos de mantenibilidad: la consigna permite hallazgos documentados. Las pruebas y la construcción sí deben pasar sus verificaciones separadas.

## Resultados y significado de las métricas

La tabla actualizada automáticamente está en [METRICAS.md](../reportes/sonar/METRICAS.md). Los datos completos y versiones exactas están en [baseline.json](../reportes/sonar/baseline.json) y [final.json](../reportes/sonar/final.json).

| Métrica | Interpretación y límite |
|---|---|
| Hallazgos SonarJS | Mensajes de reglas realmente ejecutadas. No todos representan un defecto funcional o una vulnerabilidad. La severidad `error` es la del perfil ESLint, no una clasificación de riesgo de SonarQube. |
| Categoría ESLint | `problem`, `suggestion` o `layout`, cuando la regla la publica. No equivale automáticamente a Bugs, Code Smells o Security Hotspots del servidor. |
| Duplicación | jscpd en modo `mild`, con mínimos de 5 líneas y 50 tokens; informa clones, líneas duplicadas y porcentaje. No detecta cualquier similitud semántica. |
| Cobertura | Porcentaje real del módulo definido por `test:coverage`, separado en líneas, ramas y funciones. No es cobertura de toda la interfaz ni de toda la aplicación. |
| Vulnerabilidades de dependencias | Resultado opcional de `npm audit` para el árbol instalado. Es complementario al análisis del código y a ZAP. |
| Bugs / Vulnerabilities / Security Hotspots / Code Smells del servidor | **N/D**: no se ejecutó el servidor ni su clasificación. El inventario de reglas y hallazgos constituye la métrica disponible de la alternativa. |
| Deuda técnica | **N/D**: no hay estimación verificable de esfuerzo. No se asignan minutos u horas arbitrarios. |

## Hallazgo seleccionado: asignación dentro de una expresión

**Regla:** [S1121 / `sonarjs/no-nested-assignment`](https://sonarsource.github.io/rspec/#/rspec/S1121/javascript).

**Evidencia inicial:** `supabase/functions/server/index.tsx:93` del commit inicial. El mensaje y su posición están en `baseline-eslint.json` y `baseline.json`.

```ts
function shipmentService() {
  return service ??= createShipmentService(createRepository());
}
```

**Interpretación:** es un hallazgo real de legibilidad y mantenibilidad, no una vulnerabilidad confirmada. La misma expresión decide si inicializar, asigna una instancia compartida y la devuelve. Separar la inicialización facilita entender y depurar el ciclo de vida del servicio. Es relevante porque ese servicio controla autenticación, roles y operaciones de envíos.

**Acción:** el adaptador HTTP se reorganizó para separar la construcción del servicio de la respuesta a peticiones. La inicialización se expresa en instrucciones independientes y el handler se puede probar mediante inyección de dependencias. Se conserva el servicio compartido sin asignaciones dentro de expresiones de retorno.

**Verificación:** el análisis final vuelve a ejecutar la misma regla y permite comprobar que S1121 ya no aparece en ese archivo. Las pruebas del handler, servicio y repositorio verifican el comportamiento funcional después de la reorganización. La evidencia no consiste solamente en borrar o deshabilitar la regla; sigue activa en el perfil registrado en `analysisProfile.activeRules`.

## Otros hallazgos revisados y acciones posteriores

| Familia de hallazgos | Interpretación | Acción |
|---|---|---|
| `sonarjs/no-nested-conditional` en la interfaz | Los ternarios anidados dificultan seguir combinaciones de carga, error, autenticación y resultados. No demuestran una vulnerabilidad por sí mismos. | Descomponer los estados visuales en componentes o variables con nombres claros, conservando las pruebas del recorrido. Consultar el reporte final para la cantidad restante. |
| `sonarjs/prefer-read-only-props` | Marcar las propiedades como inmutables expresa el contrato de React en tipos y previene mutaciones futuras. | Incorporar `Readonly` a los contratos de propiedades cuando se modifiquen esos componentes; no implica que hoy se hayan observado mutaciones. |
| `sonarjs/deprecation` para `FormEvent` | Aviso basado en los tipos instalados en el análisis. La app puede compilar aunque el tipo esté marcado como obsoleto. | Migrar al tipo de evento recomendado por la versión efectiva de React durante la siguiente revisión de formularios, validando TypeScript y comportamiento. |
| `sonarjs/cognitive-complexity`, si aparece en el handler final | La selección de rutas y manejo de errores puede superar el umbral recomendado de 15. Es una señal de dificultad de mantenimiento, no evidencia de que una ruta falle. | Extraer decisiones de enrutamiento o lectura de cuerpos en funciones pequeñas y conservar casos positivos y negativos de autorización. Revisar el reporte final para confirmar si sigue presente. |

Las mejoras pendientes no se cuentan como correcciones terminadas. El dashboard enumera todos los avisos del corte final para que la revisión no dependa de esta selección.

## Artefactos de evidencia

- `reportes/sonar/baseline.html` y `final.html`: tablero global inicial y final.
- `reportes/sonar/baseline.json` y `final.json`: métricas, versiones, reglas activas, huellas, alcance y hallazgos.
- `reportes/sonar/*-eslint.json`: resultados de ESLint/SonarJS, sin copiar el texto completo de las fuentes.
- `reportes/sonar/*-jscpd.json`: estadísticas y clones informados por jscpd.
- `reportes/sonar/METRICAS.md`: comparación legible generada desde los datos anteriores.
- `eslint.config.mjs` y `scripts/quality-report.mjs`: configuración y automatización reproducibles.

El análisis estático se complementa con los reportes de pruebas y de seguridad dinámica. No demuestra ausencia absoluta de errores ni sustituye la revisión de permisos en ejecución.

## Fuentes técnicas primarias

- [SonarSource: complemento oficial SonarJS para ESLint](https://github.com/SonarSource/SonarJS/tree/master/packages/jsts/src/rules).
- [SonarSource: regla S1121](https://sonarsource.github.io/rspec/#/rspec/S1121/javascript).
- [ESLint: API de Node](https://eslint.org/docs/latest/integrate/nodejs-api).
- [jscpd: versión 4, configuración y reportes](https://jscpd.dev/getting-started/v4).

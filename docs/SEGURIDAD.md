# Análisis de seguridad con ZAP

## Alcance y método

Se ejecutó ZAP 2.17.0 sobre copias locales autorizadas de Milenio Express. El plan usa el spider tradicional para obtener páginas y recursos, seguido por reglas pasivas y generación de reportes HTML/JSON. No incluye escaneo activo, credenciales ni operaciones contra el backend compartido de Supabase. Los reportes originales están en [`reportes/seguridad-zap`](../reportes/seguridad-zap/).

La referencia anterior corresponde al commit `0469db3`, exportado con `git archive`, compilado sin alterar el repositorio y servido por `vite preview` en `http://127.0.0.1:4173/`. El reescaneo corresponde al build corregido servido con `scripts/serve.mjs` en `http://127.0.0.1:4174/`. El cambio de servidor forma parte de la corrección: los headers HTTP deben aplicarse donde se entregan los archivos, no solo en React.

Cada ejecución conserva `plan.yaml`, `execution.log`, `run.json` (versión, horas y resultado), `http-root.json` (headers y hash del HTML) y los reportes originales. El script `scripts/zap-scan.mjs` rechaza destinos fuera de localhost/127.0.0.1, mantiene el alcance del spider en ese origen y no configura usuarios ni tokens. No se filtraron ni se rebajaron riesgos en el reporte original.

## Resultado medido

Ambas ejecuciones finalizaron con código 0 y el mensaje del motor `Automation plan succeeded!`; el spider descubrió 28 URLs en cada ejecución. Se utilizaron exactamente la misma versión y reglas, detalladas en [`tool.json`](../reportes/seguridad-zap/tool.json). El alcance del contexto y de los informes se limita al origen loopback indicado.

| Tipos de alerta por riesgo | Antes, commit 0469db3 | Después, build corregido |
|---|---:|---:|
| Alto | 0 | 0 |
| Medio | 2 | 0 |
| Bajo | 1 | 0 |
| Informativo | 2 | 2 |

Se eliminaron los tres tipos de alerta con riesgo bajo o medio observados (3 → 0), verificando una mejora del 100% sobre esa métrica acotada. El total de tipos pasó de 5 a 2. Permanecen las observaciones informativas 10027 y 10109, interpretadas en la tabla siguiente. Esto no significa una eliminación del 100% de las vulnerabilidades posibles.

El reescaneo intermedio se conserva en [`post-headers`](../reportes/seguridad-zap/post-headers/): detectó además una observación informativa 10019 por ausencia de `Content-Type` en la respuesta 404 de `/sitemap.xml`. Se corrigió asignando MIME por defecto antes de responder errores y se ejecutó de nuevo el plan; la observación ya no aparece en el reporte final. Los archivos de ese directorio conservan los nombres originales `zap-final.*` de aquella ejecución, sin edición del reporte del motor.

Evidencia directa: [HTML inicial](../reportes/seguridad-zap/baseline/zap-baseline.html), [JSON inicial](../reportes/seguridad-zap/baseline/zap-baseline.json), [HTML final](../reportes/seguridad-zap/final/zap-final.html), [JSON final](../reportes/seguridad-zap/final/zap-final.json) y [comparación derivada](../reportes/seguridad-zap/comparacion.json). Los manifiestos `baseline/build-sha256.json` y `final/build-sha256.json` identifican por SHA-256 los archivos compilados, y el final incluye el servidor HTTP corregido. El commit de entrega contiene esa versión; `run.json` identifica que se escaneó antes de crear el commit de cierre.

## Hallazgos iniciales y decisiones

| ID ZAP | Riesgo inicial | Endpoint / evidencia | Interpretación | Acción |
|---|---|---|---|---|
| 10038 | Medio; 3 instancias | `/`, raíz sin barra y `/sitemap.xml`; no hay `Content-Security-Policy` | El navegador carece de una política para limitar fuentes de scripts y otros recursos. No prueba por sí sola una explotación XSS. | Entregar CSP desde el servidor de la aplicación, con orígenes mínimos y protección contra incrustación. |
| 10020 | Medio; 2 instancias | Raíz y fallback `/sitemap.xml`; falta `X-Frame-Options` | Posible incrustación de la interfaz en un sitio ajeno para inducir clics. | `X-Frame-Options: DENY` y `frame-ancestors 'none'`. |
| 10021 | Bajo; 5 instancias | HTML, CSS y JavaScript; falta `X-Content-Type-Options` | El navegador puede intentar inferir un tipo de contenido distinto al declarado. | `X-Content-Type-Options: nosniff` y MIME explícito. |
| 10027 | Informativo; 1 instancia | Bundle JavaScript, evidencia `select`; fragmento de React con `createElementNS` y URLs W3C | Falso positivo de la heurística de comentarios: confunde fragmentos de JavaScript minificado y `//` de una URL con comentario/SQL. La evidencia no contiene credenciales ni consulta SQL privada. | Conservar el reporte y la justificación, sin modificar dependencias ni esconder la alerta. |
| 10109 | Informativo; 3 instancias | `<script type="module" ...>` y ausencia de enlaces HTML | Reconoce una SPA. Señala que el spider tradicional no cubre sus interacciones dinámicas. | Mantener como limitación e interpretar junto con pruebas funcionales y de permisos. |

## Reproducción

Se requiere Node 22.6+ y Java 17+ para ZAP; la ejecución documentada utilizó Node 25.4.0 y Java 23.0.2. Descargar ZAP 2.17.0 portable desde la [página oficial](https://www.zaproxy.org/download/) y descomprimir fuera del repositorio. El paquete Linux puede ejecutarse en macOS con Java instalado según esa página.

SHA-256 verificado del archivo `ZAP_2.17.0_Linux.tar.gz`: `efe799aaa3627db683b43f00c9c210aea0b75c00cc8f0a0f0434d12bb3ddde5a`, coincide con el [manifiesto oficial de la versión](https://raw.githubusercontent.com/zaproxy/zap-admin/master/ZapVersions-2.17.xml).

```sh
pnpm install --frozen-lockfile
pnpm build
PORT=4174 node scripts/serve.mjs
```

En otra terminal, desde la raíz del repositorio, con `JAVA_HOME` apuntando a Java y `ZAP_HOME` a la carpeta que contiene `zap.sh`:

```sh
ZAP_HOME=/ruta/ZAP_2.17.0 SCAN_SOURCE_VERSION=commit-o-version \
  node scripts/zap-scan.mjs final http://127.0.0.1:4174/
```

El comando registra el código de salida del motor y falla si no existe el reporte JSON. Para reproducir la referencia inicial, exportar `0469db3` en un directorio temporal, instalar dependencias, ejecutar `pnpm build` y `pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort`; luego usar la etiqueta `baseline` y ese puerto. Las dependencias originales se conservan en el lockfile de ese commit. Las ejecuciones de esta entrega no incluyeron datos reales.

Para recalcular la comparación a partir de los originales conservados:

```sh
node scripts/zap-summary.mjs
```

## Límites de la evidencia

El alcance es el frontend HTTP local y sus headers. El spider tradicional no inicia sesión, no ejecuta React como un navegador completo y no valida los permisos JWT, la base de datos ni el backend remoto. Estas garantías se verifican separadamente con las pruebas de autenticación, dominio, servicio y handler. Un escaneo sin alertas altas no certifica ausencia de vulnerabilidades. En producción se debe utilizar HTTPS y verificar de nuevo la configuración de headers del host real; el localhost HTTP no demuestra TLS ni HSTS de un servidor público.

Fuentes del método: [Automation Framework](https://www.zaproxy.org/docs/desktop/addons/automation-framework/), [spider tradicional](https://www.zaproxy.org/docs/desktop/addons/spider/automation/) y [generación de reportes](https://www.zaproxy.org/docs/desktop/addons/report-generation/automation/).

# Evidencias y estados de Jira

Corte de sincronización: 24 septiembre 2026. Proyecto **Milenio Express / KAN**. Se registran únicamente transiciones que la coordinación comprobó en la interfaz, además del inventario inicial conservado. No se cambian responsables ni fechas. Fuente de requisitos: PDF del usuario y KAN-58; trazabilidad técnica en [MATRIZ_ENTREGA.md](MATRIZ_ENTREGA.md).

Versión técnica final publicada: `82ad3033067d5e7e896fb27a792f70575a090c87` de `dev-maxi`. [Run 35974266905](https://github.com/Sergionixx/MilenioExpress/actions/runs/35974266905): **success** en cuatro jobs, con 37 unitarias, 14 casos de integración real, 9 casos UI y deployment efímero verificado. Una etiqueta «Implementado» se refiere al alcance descrito en la tarjeta y su comentario, no a un nuevo despliegue en el Supabase compartido.

Evidencias originales descargadas y contrastadas con digest SHA-256 del artefacto GitHub: [resultados de integración](../reportes/integracion/resultados.json), [deployment](../evidencias/despliegue.json), [contenedor](../evidencias/contenedor.json) y [recibo del run](../evidencias/github-actions.json). INT-05 prueba JWT firmado válido/vencido; INT-13 comprueba colisión UNIQUE sin sobrescritura; INT-14 retira la sesión cliente; limpieza final de dos cuentas ficticias aprobada. El logout de cliente de INT-14 no acredita por sí solo navegación visual ni foco.

**Reanálisis posterior al comentario inicial de calidad/seguridad:** la revisión `ede06a6` corrige el nombre accesible de Buscar. SonarJS/jscpd se repitió localmente y en el CI final `82ad303`, y mantiene 18 hallazgos; ZAP final del 24/09/2026, 07:55:15–07:55:28 UTC, mantiene 0 altos/medios/bajos y 2 tipos informativos. [run.json](../reportes/seguridad-zap/final/run.json) y [build-sha256.json](../reportes/seguridad-zap/final/build-sha256.json) identifican esa versión; `pre-ui/` conserva el informe anterior. Los comentarios de KAN-51/54 se actualizaron con estos reportes finales y su guardado se comprobó en Jira. También se refrescaron los comentarios de las demás tarjetas implementadas con el run final `35974266905` y su revisión `82ad303`.

**Verificación UI aprobada:** el run final `35974266905` completó [nueve casos en Chromium](../reportes/integracion/ui-resultados.json), con [15 capturas](../evidencias/ci-ui/) a 320, 375 y 430 px. Los fallos previos de descarga de CLI y selector se corrigieron en la automatización; no se atribuyen a la app. La corrección funcional de accesibilidad Buscar pertenece a `ede06a6`. Los comentarios finales y las transiciones de KAN-16/20/21/23/24/27/39/52/53 a Implementado se comprobaron en Jira y enlazan ese run y sus reportes.

## Estado confirmado por tarjeta

| ID | Responsable conservado | Estado Jira confirmado | Evidencia / condición |
|---|---|---|---|
| KAN-10 | Maximo Aguilar | Pendiente | Comentario guardado. README existe; falta revisión real de clon limpio por otro integrante. |
| KAN-11 | Sergionix | Implementado | Base React/backend, contrato, typecheck/build y run exitoso. |
| KAN-12 | Humberto T | Implementado | YAML y run: pruebas → construcción/integración → deployment. |
| KAN-13 | Humberto T | Implementado | .env.example, variables públicas/privadas y README. |
| KAN-14 | Juan Deluquez | Implementado | Migraciones, persistencia/RLS y 14 casos de integración en Supabase aislado. |
| KAN-15 | Sergionix | Implementado | Contrato HTTP, validaciones/errores, handler y pruebas. |
| KAN-16 | Sergionix | Implementado | UI final aprobada; comentario y transición comprobados. |
| KAN-18 | Sergionix | Implementado | JWT real en Auth aislado y tests de rechazo; no redeploy compartido. |
| KAN-19 | Sergionix | Implementado | ADMIN/USER, propiedad, rechazos por rol y RLS en integración. |
| KAN-20 | Sergionix | Implementado | UI-04/06/08 prueban sesión, recarga y logout; comentario y transición comprobados. |
| KAN-21 | Sergionix | Implementado | Unitarias, integración y logout/navegación UI aprobados; comentario y transición comprobados. |
| KAN-23 | Juan Deluquez | Implementado | UI-02/03 verifican registro ADMIN y guía real, además de API/persistencia; comentario y transición comprobados. |
| KAN-24 | Juan Deluquez | Implementado | Unicidad/colisión cubiertas técnicamente; comentario y transición comprobados. |
| KAN-27 | Juan Deluquez | Implementado | UI-03 comprueba guía y copia real; alternativa seleccionable implementada y revisada en código. No se simuló denegación de Clipboard API. |
| KAN-29 | Juan Deluquez | Implementado | 37 unitarias, 100% líneas, 99.07% ramas, 100% funciones en siete módulos. |
| KAN-35 | Juan Deluquez | Implementado | Guías inválidas/inexistentes, conexión, permisos y errores comprobados. |
| KAN-38 | Juan Deluquez | Implementado | API autenticada, consulta por guía y propiedad en integración. |
| KAN-39 | Juan Deluquez | Implementado | UI-05/06/07 verifican consulta propia, recarga, rechazo ajeno y validación; comentario y transición comprobados. |
| KAN-51 | Humberto T | Implementado | Comentario y transición comprobados: ZAP original/interpretación/corrección/reescaneo. |
| KAN-52 | Sergionix | Implementado | Nueve casos UI aprobados sobre backend real aislado, más 14 casos API; comentario y transición comprobados. |
| KAN-53 | Sergionix | Implementado | Defecto Buscar corregido con aria-label en ede06a6; UI final aprobada a 320/375/430 px, sin desbordamiento. Comentario y transición comprobados. |
| KAN-54 | Humberto T | Implementado | Comentario y transición comprobados: alternativa global SonarJS/ESLint+jscpd, S1121 y dashboard. |
| KAN-55 | Humberto T | Implementado | Deployment Docker efímero del run exitoso, smoke HTTP/rutas/bundle/headers. |
| KAN-57 | Maximo Aguilar | Implementado | Informe final, PDF revisado y ZIP verificado; comentario guardado y estado comprobado. |
| KAN-58 | Maximo Aguilar | Implementado | Comentario de matriz y transición comprobados en UI; alcance confirmado con trazabilidad. |
| KAN-59 | Maximo Aguilar | Implementado | Reparto y fechas verificados; originales conservadas y seguimiento por evidencia. |
| KAN-80 | Maximo Aguilar | Implementado | Nueva tarea documental creada y asignada: «Documentar funcionamiento, idea de negocio y tecnicismos de Milenio Express». MD de tres partes finalizado; comentario y estado comprobados. |

Reparto original: **26 tarjetas**, Sergionix 9, Juan Deluquez 8, Humberto T 5, Maximo Aguilar 4. Se añadió KAN-80 a Maximo: **27 asignadas actuales**, conservando separado el conteo original. En este corte hay **26 de 27 asignadas Implementado**; solo permanece pendiente KAN-10, que requiere una revisión humana por otro integrante. Las cuatro tarjetas históricas de demo local (KAN-22/26/33/36) ya estaban Implementado; no se usan como evidencia nueva. Las épicas KAN-4 a KAN-9 y la referencia KAN-79 no se cierran automáticamente.

## Síntesis de evidencia vinculada en comentarios

**KAN-51 — seguridad dinámica (cierre confirmado).** Rama dev-maxi, versión técnica final `82ad303`. ZAP 2.17.0 ejecutado con reportes inicial/intermedio/final; el reescaneo final identifica la fuente de aplicación `ede06a6`, conservada en `82ad303`: 2 tipos medios +1 bajo →0 y 2 informativos justificados. Se corrigieron CSP, anticlickjacking, nosniff y Content-Type de error. Alcance frontend HTTP loopback pasivo; no se escaneó Supabase remoto ni se afirma cobertura JWT. [Interpretación](https://github.com/Sergionixx/MilenioExpress/blob/dev-maxi/docs/SEGURIDAD.md) y [originales](https://github.com/Sergionixx/MilenioExpress/tree/dev-maxi/reportes/seguridad-zap).

**KAN-54 — calidad global (cierre confirmado).** Rama dev-maxi, versión técnica final `82ad303`. Alternativa equivalente admitida por PDF: ESLint/SonarJS con tipos, jscpd y dashboard global. 19→18 hallazgos, duplicación 0%; S1121 corregido y reanalizado. No se ejecutó SonarQube Server y sus métricas no disponibles se declaran N/D. [Interpretación](https://github.com/Sergionixx/MilenioExpress/blob/dev-maxi/docs/CALIDAD.md) y [dashboard/originales](https://github.com/Sergionixx/MilenioExpress/tree/dev-maxi/reportes/sonar).

**KAN-29 — unitarias/cobertura (cierre confirmado).** Rama dev-maxi, versión técnica final `82ad303`. 37 pruebas aprobadas, 0 fallidas; 100% líneas, 99.07% ramas y 100% funciones. Ámbito: authErrors, http, session, domain, handler, repository y service. Incluye autenticación, permisos y consulta, sin presentarlo como cobertura de toda la UI. [TAP y LCOV](https://github.com/Sergionixx/MilenioExpress/tree/dev-maxi/reportes/pruebas-unitarias).

**KAN-13 — configuración (cierre confirmado).** Rama dev-maxi, versión técnica final `82ad303`. `.env.example` separa URL/clave pública de cliente de claves privadas de servidor; README explica configuración reproducible. No se publican claves privadas ni contraseñas reales en el ejemplo. Este cierre documenta el entorno, no afirma modificación de secrets del backend compartido. [Ejemplo](https://github.com/Sergionixx/MilenioExpress/blob/dev-maxi/.env.example) y [README](https://github.com/Sergionixx/MilenioExpress/blob/dev-maxi/README.md).

**KAN-58 — matriz (cierre confirmado).** Alcance confirmado del punto 1 a Informe de cierre: crear/consultar con JWT/roles, cobertura ≥80%, CI/CD, análisis global equivalente, ZAP interpretado y corregido, cierre/mejora/innovación. La matriz relaciona cada requisito con código, reporte y tarjeta. Este cierre acredita la confirmación del alcance, no afirma que toda dependencia humana esté terminada. Comentario y transición verificados en UI; evidencia documental: `docs/MATRIZ_ENTREGA.md`.

**KAN-59 — coordinación (cierre confirmado).** Se verificaron las 26 tarjetas originales, reparto 9/8/5/4 y vencimiento 25/09/2026. Se mantuvieron responsables y fechas. KAN-80 añade una tarea documental a Maximo, sin modificar el reparto histórico. Estados y comentarios usan evidencia de dev-maxi; KAN-10 conserva su condición humana pendiente.

**KAN-12/55 — CI y despliegue (cierres confirmados).** Run 35974266905 exitoso, commit 82ad303: unitarias/calidad, build, 14 casos reales de integración, 9 de UI en Supabase aislado y despliegue Docker temporal del artefacto. Deployment depende de construcción e integración, y estas de pruebas. Se verifican HTTP, rutas, bundle y cabeceras. Los artefactos permiten inspección/reproducción; no se ofrece URL permanente ni se altera el Supabase compartido. [Run](https://github.com/Sergionixx/MilenioExpress/actions/runs/35974266905).

**KAN-14/18/19/35/38 — backend (cierres confirmados).** `82ad303`, mismo run exitoso y artefacto `integracion-supabase-local`: 14 casos con Auth/PostgreSQL reales aislados, JWT, permisos ADMIN/USER, propiedad, persistencia, RLS y guías únicas. Se complementa con 37 unitarias. No confundir esta evidencia con un nuevo deployment remoto compartido.

## Cierres comprobados y condiciones restantes

| Grupo | Estado del cierre | Evidencia o condición restante |
|---|---|---|
| KAN-24 | Implementado verificado | Comentario y transición comprobados: formato/unicidad, colisión UNIQUE sin sobrescritura y restricciones SQL. |
| KAN-16/20/21/23/27/39/52/53 | Implementado verificado | Comentarios y transiciones comprobados. Run 35974266905, 9/9 casos UI y capturas 320/375/430, además de 14/14 integración. KAN-27 distingue copia real de alternativa manual inspeccionada. |
| KAN-58 | Implementado verificado | Conservar matriz y enlace del commit documental en la entrega. |
| KAN-57/80 | Implementado verificado | Comentarios guardados y estados visibles. MD de tres partes, PDF revisado y ZIP íntegro para publicación documental en dev-maxi. |
| KAN-10 | Mantener pendiente | Otra persona del equipo debe clonar, seguir README y registrar resultado. Automatización no acredita esa participación. |
| Épicas/históricos/fuera de alcance | Conservar | Este módulo no implementa toda la logística; no convertir propuesta futura en trabajo terminado. |

Los 26 cierres y sus comentarios fueron comprobados en Jira. La entrega documental conserva [el PDF](INFORME_CIERRE.pdf), [el ZIP](../entrega/entrega-final-milenio-express.zip) y los reportes originales en dev-maxi. La revisión humana KAN-10, las épicas y los elementos fuera del módulo mantienen su estado propio; no se atribuyen aprobaciones a otras personas.

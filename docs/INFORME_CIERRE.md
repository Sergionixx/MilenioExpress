# Informe de cierre — Milenio Express

**Rama de entrega:** `dev-maxi` · **Corte documental:** 24 de septiembre de 2026.

Este informe cubre el cierre y la mejora continua solicitados en los puntos 4 y 5 de «Entrega final del reto_proyecto.pdf», e incorpora la síntesis de calidad y seguridad del punto 3. La entrega se concentra en un módulo de creación y consulta de paquetes con autenticación y roles. Las propuestas de evolución se distinguen de las funciones implementadas.

**Resultado técnico comprobado:** 37 unitarias aprobadas; cobertura del módulo de 100% de líneas, 99.07% de ramas y 100% de funciones; 14 casos de integración real con Supabase aislado; 9 casos de interfaz en Chromium con 15 capturas; y 6 comprobaciones HTTP del despliegue temporal. El [run final 35974266905](https://github.com/Sergionixx/MilenioExpress/actions/runs/35974266905) aprobó los cuatro jobs sobre `82ad3033067d5e7e896fb27a792f70575a090c87`, publicado en `dev-maxi`. El análisis global redujo 19→18 hallazgos; ZAP corrigió 2 tipos medios y 1 bajo y conserva 2 informativos. El PDF se revisó visualmente y el ZIP pasó las comprobaciones de integridad; Jira registra 26 de 27 tareas asignadas Implementado, con comentarios y estados comprobados. Solo la revisión humana de KAN-10 sigue pendiente.

## 1. Fuentes y línea base

La evaluación utiliza el PDF de requisitos del usuario; el inventario del código; el [tablero KAN](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2); el historial Git; el [contrato de paquetes y acceso](CONTRATO_PAQUETES_ACCESO.md); y la [verificación previa de Sergio](SERGIO_VERIFICACION.md). La guía [MILENIO_EXPRESS.md](../MILENIO_EXPRESS.md) explica funcionamiento, negocio y términos técnicos.

Se fijó como línea base el commit `0469db39eef618e09c50c5af88bed250032e54d6`, «Complete Sergio session and mobile verification», fechado el 23 de septiembre de 2026. El historial registra el scaffold de Figma el 27 de agosto, la creación y consulta con permisos el 22 de septiembre y la integración y verificación del acceso entre el 22 y el 23 de septiembre. Estas fechas son fechas de commits, no horas de trabajo ni una duración medida del desarrollo.

El alcance de KAN-58 selecciona creación y consulta por guía: ADMIN crea y USER consulta sus paquetes. Excluye logística avanzada, fotos, firma, mapas, avisos, registro público y operación sin conexión. La rama de presentación interactiva permanece separada y no se incorpora a `dev-maxi`. Tampoco se modifica `main`.

El PDF muestra una entrega el 28 de septiembre de 2026; el tablero observado mantiene vencimiento del 25 de septiembre para las tarjetas asignadas. Se conservan ambas fuentes sin alterar el calendario del equipo ni suponer que significan la misma fecha. No existe en las fuentes revisadas un registro completo de horas planeadas y ejecutadas.

## 2. Comparación de avance planeado y ejecutado

| Elemento | Planeado según requisitos | Ejecutado y evidencia | Diferencia o causa |
| --- | --- | --- | --- |
| Módulo de negocio | Una creación y una consulta funcionales. | Formulario ADMIN, guía generada por persistencia, listado y consulta protegida. Código y contrato existentes; nuevas pruebas del adaptador HTTP. | Se entrega el módulo acordado, no todo el sistema logístico. |
| Autenticación | JWT verificado en servidor. | Supabase Auth verifica el token; integración real aislada del run 35974266905 valida identidad y rechazos. Se conserva además la evidencia previa de Sergio. | El ensayo nuevo utiliza servicios reales aislados dentro de CI; no representa un despliegue sobre el Supabase compartido. |
| Autorización | ADMIN crea; cuentas autenticadas consultan lo permitido. | El servicio consulta el rol confiable y la propiedad. Pruebas de rechazo sin token, USER que intenta crear y consulta ajena. | Ocultar botones no sustituye los controles del servidor. |
| Persistencia | Paquetes ligados a propietario y guía única. | Migraciones reproducidas en PostgreSQL aislado; integración verifica creación/consulta, RLS y guías únicas. Se corrigió la paginación de propietarios. | No se alteró el proyecto compartido: el ensayo arranca un entorno nuevo propio en el runner. |
| Pruebas | Automatización y cobertura mínima de 80 % del módulo. | 37 pruebas aprobadas; 100 % líneas, 99.07 % ramas y 100 % funciones en el ámbito declarado. [Reporte TAP](../reportes/pruebas-unitarias/coverage.tap) y [LCOV](../reportes/pruebas-unitarias/lcov.info). | La cobertura anterior abarcaba cuatro módulos y 17 pruebas. Ahora incluye HTTP, repositorio y mensajes de acceso; no representa toda la UI ni infraestructura externa. |
| Construcción | Artefacto desplegable sin errores de tipos. | `typecheck` y `build` locales correctos. La compilación produce `dist`. | Vite conserva aviso de bundle mayor de 500 KiB; es una mejora de rendimiento, no un fallo de compilación. |
| CI/CD | Pruebas → build → despliegue automático a pruebas. | Run 35974266905 exitoso en `82ad303`: 37 unitarias/calidad, 14 casos de integración, 9 de UI, build y despliegue Docker con seis comprobaciones HTTP, rutas, bundle y cabeceras. | Se ejecutó en `dev-maxi`; el YAML contempla push/PR a `main` sin modificar esa rama. |
| Entorno de pruebas | Instancia verificable y evidencia de funcionamiento. | Servidor local 4174 usado para ZAP y contenedor desplegado automáticamente en el runner; artefactos de aplicación, integración y deployment conservados en el run. | El contenedor existe durante el run y es reproducible mediante Dockerfile; no proporciona hosting permanente. |
| Calidad estática | Análisis global con tablero, métricas y hallazgo interpretado. | SonarJS/ESLint y jscpd: 19→18 hallazgos, 0% duplicación y S1121 corregido; dashboard y JSON originales. | Alternativa equivalente permitida por PDF; no es SonarQube Server y sus métricas no disponibles se declaran N/D. |
| Seguridad dinámica | ZAP inicial, interpretación, corrección y reanálisis. | ZAP 2.17.0 real: 2 tipos medios +1 bajo →0, sin altos y con 2 informativos; reportes inicial/final e intermedio conservados. | Alcance frontend loopback pasivo; no autentica contra Supabase ni certifica seguridad total. |
| Interfaz móvil | Acceso, registro y consulta entre 320 y 430 px. | Nueve casos UI aprobados en la versión final, con foco/errores, creación ADMIN, guía/copia, consulta propia/ajena, recarga y logout. Quince capturas conservadas. | Emulación Chromium a 320, 375 y 430 px, sin desbordamiento; no dispositivo físico. Clipboard se verificó con permiso concedido. |
| Duración | Comparar esfuerzo y desviaciones. | Se dispone de fechas Git y vencimientos Jira, sin bitácora de horas. | No se puede calcular una desviación temporal fiable; no se inventan días u horas consumidas. |
| Informe y entrega | Cierre, mejora, innovación e informe PDF/Word dentro del ZIP. | Informe editable y PDF revisado visualmente, guía de tres partes y ZIP con originales, 24 PNG, hashes SHA-256 y CRC comprobados. | Se entrega PDF, una de las dos alternativas del requisito. Solo se incluye .env.example como archivo de entorno. |

## 3. Síntesis técnica, calidad y seguridad

### 3.1. Arquitectura y pruebas

El flujo mantiene React y Supabase. Las reglas de campos y permisos permanecen en `domain.ts` y `service.ts`; `handler.ts` contiene el contrato HTTP; `repository.ts` concentra las llamadas a Auth y PostgreSQL. El archivo de arranque Deno conecta esas piezas con las variables privadas del servidor. Esta separación permite ejecutar el mismo manejo HTTP en las pruebas sin arrancar un servicio externo.

Las 37 pruebas del corte incluyen normalización y límites de campos, guías inválidas e inexistentes, permisos, propiedad, fallo de dependencias, envío del JWT a Supabase Auth, paginación, errores de almacenamiento, cabeceras, CORS configurable, límite de cuerpo y limpieza de sesión ante `401`. Se usan cuentas y datos ficticios. Las pruebas del adaptador Supabase usan el SDK con transporte controlado; verifican solicitudes y respuestas, pero no son una nueva validación del servidor remoto.

Separadamente, el run 35974266905 ejecutó **14 casos de integración real** después de iniciar Supabase Auth y PostgreSQL aislados con las migraciones de esta rama. El [reporte original descargado](../reportes/integracion/resultados.json) comprueba JWT firmado válido y vencido (INT-05), roles, persistencia, RLS y rechazo de colisión UNIQUE sin sobrescritura (INT-13); la limpieza de las dos cuentas ficticias también pasó. Estos casos no se suman a la cifra de cobertura unitaria ni se presentan como una ejecución contra el backend compartido. `scripts/run-local-integration.mjs` permite reproducirlos.

El [reporte original de UI](../reportes/integracion/ui-resultados.json) acredita **9/9 casos aprobados**, ejecutados entre 08:19:23 y 08:19:30 UTC del 24/09/2026 sobre `82ad303`. El navegador inició sesión en Auth real aislado y recorrió creación ADMIN, confirmación/copia de guía, consulta USER propia, rechazo ajeno, validación, recarga y logout. También verificó foco por teclado, error de credenciales y el dashboard de calidad. Las [15 capturas](../evidencias/ci-ui/) incluyen login, registro y consulta a 320, 375 y 430 px sin desbordamiento horizontal. La prueba usa emulación Chromium y bloquea fuentes externas; CSP y contenedor se comprueban separadamente. La alternativa manual ante fallo de portapapeles está implementada, pero no se simuló su denegación en esta suite.

El ámbito de cobertura comprende `authErrors.ts`, `http.ts`, `session.ts`, `domain.ts`, `service.ts`, `handler.ts` y `repository.ts`. Quedan fuera de esa cifra la interfaz `App.tsx`, el arranque Deno, el cliente de navegador, el SDK de terceros y la ejecución SQL. Se declaran para evitar interpretar la cifra como una cobertura de toda la aplicación.

### 3.2. Análisis estático global

El análisis usa el perfil recomendado de SonarJS con ESLint, verificación TypeScript y jscpd. Se ejecuta sobre las fuentes de aplicación de `src`, `supabase/functions/server` y `utils`, con manifiesto y hashes que identifican los archivos. Pruebas, scripts, dependencias y bundles generados no forman parte del análisis global de fuentes; las pruebas tienen su propia ejecución. Los tableros disponibles son [línea base](../reportes/sonar/baseline.html) y [corte final](../reportes/sonar/final.html).

El reporte [baseline.json](../reportes/sonar/baseline.json) registra 19 hallazgos, 12 archivos y 1 669 líneas físicas para el commit de referencia. Registra cero clones y cero líneas duplicadas según la configuración del detector. Esa cifra de duplicación no mide similitudes conceptuales ni todas las formas posibles de repetición.

El reanálisis [final.json](../reportes/sonar/final.json) registra **18 hallazgos**, con duplicación **0%**. El descenso 19→18 y la eliminación de S1121 se comprueban en los originales y el tablero, sin desactivar la regla. Los avisos restantes se documentan como mantenimiento pendiente y no se declaran resueltos.

El corte final se regeneró en CI el 24/09/2026 a las 08:16:45 UTC sobre `82ad3033067d5e7e896fb27a792f70575a090c87` y conserva 18 hallazgos. Su manifiesto identifica las fuentes reanalizadas; el código de aplicación coincide con la revisión `ede06a6` que incorporó el nombre accesible de Buscar y fue reescaneada con ZAP.

| Métrica requerida | Disponibilidad e interpretación |
| --- | --- |
| Hallazgos por regla | Disponibles en los JSON originales y tablero: 19 iniciales y 18 finales, con manifiestos SHA-256 del alcance analizado. |
| Bugs, Vulnerabilities y Security Hotspots de SonarQube | No disponibles como métricas de servidor. No se sustituyen por ceros ni se equiparan automáticamente con la severidad de ESLint. |
| Code Smells y Technical Debt de SonarQube | No disponibles como clasificación y estimación de SonarQube. Los hallazgos de mantenimiento se explican individualmente. |
| Duplicated Lines | Disponible mediante jscpd, con configuración y ámbito indicados en el reporte. |
| Cobertura | Disponible en TAP/LCOV para el módulo; su alcance es distinto al análisis global. |

**Hallazgo revisado.** En la línea base, `index.tsx` incluía una asignación dentro de una expresión de retorno (`service ??= …`), señalada por `sonarjs/no-nested-assignment` (S1121). Se sustituyó por una comprobación explícita de la instancia, su creación y retorno. El cambio facilita seguir el arranque y no altera el contrato de la API. Durante la ampliación, el analizador también detectó complejidad cognitiva 18 en el manejador HTTP, por encima del umbral 15: se extrajo la lógica CORS a una función específica y la revisión dirigida posterior pasó. La [comparación original](../reportes/sonar/METRICAS.md) y [CALIDAD.md](CALIDAD.md) conservan el reanálisis y la interpretación.

El tablero agregado permite revisar el proyecto fuera del editor. No se afirma haber instalado SonarQube Community Build ni haber obtenido un Quality Gate de su servidor. La equivalencia de herramientas y las métricas ausentes se exponen para que la evaluación pueda comprobar el alcance real.

### 3.3. Seguridad dinámica y límites

OWASP ZAP analiza respuestas de una aplicación ejecutándose. La inspección pasiva observa tráfico y cabeceras; un análisis activo además envía solicitudes de ataque y solo debe dirigirse al entorno propio autorizado. En esta entrega el objetivo de análisis es local, no Atlassian, GitHub ni otros servicios ajenos.

**Resultado real:** el [reporte inicial](../reportes/seguridad-zap/baseline/zap-baseline.html) encontró 2 tipos de riesgo medio (CSP ausente y falta de protección anticlickjacking), 1 bajo (nosniff ausente) y 2 informativos. El [reporte final](../reportes/seguridad-zap/final/zap-final.html) presenta 0 altos, 0 medios, 0 bajos y 2 informativos. Ambos planes terminaron con código 0 y el spider descubrió 28 URLs; se mantuvieron la versión ZAP 2.17.0 y las reglas entre ejecuciones. La tabla de riesgo, endpoint, evidencia, interpretación y acción está en [SEGURIDAD.md](SEGURIDAD.md).

El servidor estático incorpora CSP restringida, `frame-ancestors 'none'`, `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff`. Un reescaneo intermedio reveló ausencia de Content-Type en la respuesta 404 de `/sitemap.xml`; se corrigió el MIME por defecto y se volvió a ejecutar ZAP. Quedan la detección informativa de SPA y un falso positivo razonado de comentarios en JavaScript minificado de React. Los originales no se editaron para ocultarlos. La mejora medida es **3→0 tipos de alerta con riesgo bajo/medio**, no una prueba de ausencia universal de vulnerabilidades.

Tras la corrección de accesibilidad se reconstruyó `ede06a6` y se repitió ZAP entre 07:55:15 y 07:55:28 UTC del 24/09/2026: código 0, 28 URLs descubiertas y el mismo resultado de 0 altos/medios/bajos y 2 tipos informativos. El [registro final](../reportes/seguridad-zap/final/run.json) y [manifiesto SHA-256](../reportes/seguridad-zap/final/build-sha256.json) vinculan el resultado a la revisión completa. El informe anterior se conserva en `reportes/seguridad-zap/pre-ui/`.

El endurecimiento implementado en el manejo HTTP incluye `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: no-referrer`. CORS permite definir orígenes exactos con `ALLOWED_ORIGINS`; conserva el valor anterior `*` si no se configura para no romper las interfaces existentes del equipo. CORS no reemplaza JWT ni autorización y debe limitarse expresamente en el entorno publicado.

Un escaneo público no demuestra por sí solo seguridad de rutas autenticadas. Los rechazos `401` esperados no son defectos. Debe registrarse qué rutas exploró ZAP, cuáles requieren token y qué controles de roles se verificaron con pruebas independientes. La app no genera APK; las alternativas Android/MobSF y la instalación de certificados móviles no aplican a este alcance web.

### 3.4. Configuración, secretos y despliegue

Las claves de servicio y contraseñas deben permanecer en variables privadas del servidor o secrets de CI. El ejemplo `.env.example` contiene marcadores, no credenciales. La URL y clave pública de Supabase utilizadas por el navegador no sustituyen las políticas de acceso y no se deben confundir con `SUPABASE_SERVICE_ROLE_KEY`.

El destino acordado de Git es exclusivamente `dev-maxi`. Publicar archivos en esa rama no actualiza automáticamente la Edge Function remota ni modifica `main`. El [workflow](../.github/workflows/ci-cd.yml) activa push/PR a `main` y `dev-maxi` y conserva dependencias bloqueantes: construcción e integración requieren pruebas; deployment requiere ambas. El [run exitoso 35974266905](https://github.com/Sergionixx/MilenioExpress/actions/runs/35974266905), commit `82ad303`, acredita las etapas. El contenedor del runner se elimina al terminar: logs, comprobaciones y artefactos son la prueba reproducible del despliegue temporal permitido por el PDF. Los artefactos del run tienen retención configurada de 30 días; se descargaron los originales con comprobación SHA-256 para conservarlos junto con la entrega.

## 4. Desviaciones y lecciones de ingeniería

1. **La base ya tenía avances funcionales.** La entrega partió de creación, consulta, Auth, roles y evidencia móvil existentes. La ampliación se concentra en cobertura HTTP/repositorio, robustez, automatización, análisis y documentación; no se atribuye como nuevo el trabajo previo de Juan o Sergio.
2. **La cobertura necesita explicar el ámbito.** Un 100 % en cuatro archivos no acredita todos los adaptadores. Extraer y probar el manejo HTTP y el repositorio amplió la evidencia sin duplicar reglas de negocio ni fingir una respuesta productiva.
3. **Los límites del proveedor afectan funciones aparentemente completas.** El listado de propietarios podía truncarse con el límite de respuesta. La paginación ordenada por nombre e identificador recupera todas las páginas y tiene pruebas con más de 500 elementos.
4. **Un error externo también requiere contrato.** Una respuesta de error JSON `null` podía provocar un fallo al leer sus campos. El cliente ahora conserva un error comprensible, incluso cuando el proveedor devuelve un cuerpo inesperado o una respuesta exitosa sin JSON válido.
5. **Las credenciales y los roles tienen fuentes distintas.** El JWT prueba identidad; `profiles.role` define permisos. Las pruebas comprueban ambas decisiones y descartan roles enviados por el cliente. Si se reiniciara el proyecto, esta matriz se definiría antes de construir las pantallas.
6. **La evidencia debe corresponder a una versión.** Los resultados previos son útiles, pero no prueban una publicación nueva. Se conserva la referencia inicial y cada análisis identifica las fuentes utilizadas. Al reiniciar el proyecto se automatizaría desde el primer incremento la conservación de reportes por commit.
7. **El entorno temporal tiene un alcance concreto.** Un despliegue dentro de CI permite verificar el artefacto sin contratar hosting. No reemplaza la administración del Supabase compartido ni una URL disponible para usuarios fuera del run.
8. **El cierre de una tarjeta requiere su criterio completo.** Una revisión hecha por automatización no sustituye la validación humana pedida a otro integrante. KAN-10 debe conservar esa dependencia hasta que exista evidencia real de la revisión.
9. **La adaptación móvil también puede ocultar el nombre accesible.** La verificación de interfaz detectó que, en anchos de hasta 380 px, CSS ocultaba el texto «Buscar» y el botón de consulta quedaba sin nombre accesible. Se añadió `aria-label="Buscar"` en `App.tsx`, commit `ede06a6`. El defecto vincula accesibilidad con responsive: que el icono sea visible no garantiza que un lector de pantalla o una prueba semántica pueda identificar la acción. Calidad y ZAP se reejecutaron; el CI final aprobó las nueve pruebas de interfaz, incluida la consulta a 320/375/430 px. La evidencia técnica de KAN-53 queda vinculada al reporte y a sus capturas.
10. **La automatización necesita herramientas reproducibles y selectores adecuados.** El límite de API al resolver Supabase CLI `latest` se corrigió fijando `2.117.0`, autenticando la descarga y condicionando la limpieza (`fd884c9`). El run siguiente `35973015347` inició Supabase y aprobó INT-01–13 y UI-01; UI-02 se detuvo por un selector de prueba incorrecto, corregido por rol `combobox` en `82ad303`. Ambos fallos pertenecen a la infraestructura de verificación, no acreditan un defecto funcional de la app y no invalidan el análisis de su fuente `ede06a6`. La ejecución final `35974266905` aprobó el recorrido completo y los cuatro jobs. Su resultado y artefactos sustituyen los resultados parciales como evidencia de cierre.

## 5. Responsabilidades y trazabilidad Jira

La lectura del tablero del 24 de septiembre registró 26 tarjetas asignadas con vencimiento el 25 de septiembre: Sergionix, 9; Juan Deluquez, 8; Humberto T, 5; Maximo Aguilar, 4. Se conserva la persona asignada actualmente en Jira aunque una descripción histórica mencione otro reparto. Este informe no registra acuerdos ni aprobaciones en nombre de esas personas.

Se creó además **KAN-80**, «Documentar funcionamiento, idea de negocio y tecnicismos de Milenio Express», asignada a Maximo Aguilar. Son **26 tarjetas originales +1 adicional =27 asignadas**; no se altera retroactivamente el reparto original. Se comprobaron **26 de 27 asignadas Implementado**, incluidas las nueve tarjetas de interfaz y KAN-57/80 para el informe y el documento adicional. Los comentarios técnicos se actualizaron con el run final y los reportes vigentes; los cierres documentales tienen comentario guardado y estado visible. Solo KAN-10 permanece pendiente de revisión por otro integrante. El detalle está en [JIRA_EVIDENCIAS.md](JIRA_EVIDENCIAS.md).

| Responsable en Jira | Ámbito de referencia | Tarjetas principales |
| --- | --- | --- |
| Sergionix | Base del cliente/backend, acceso, roles, sesión y verificación del recorrido móvil. | KAN-11, 15, 16, 18, 19, 20, 21, 52 y 53. |
| Juan Deluquez | Persistencia, creación, guías, consulta y pruebas del módulo. | KAN-14, 23, 24, 27, 29, 35, 38 y 39. |
| Humberto T | Ambientes, pipeline, despliegue y análisis de calidad/seguridad. | KAN-12, 13, 51, 54 y 55. |
| Maximo Aguilar | Documentación, alcance, organización y cierre. | KAN-10, 57, 58, 59 y la nueva KAN-80. |

Las épicas no se cierran automáticamente porque haya un módulo terminado. Las tarjetas de demo local que ya figuraban «Implementado» mantienen su historia, sin utilizar ese estado como prueba nueva de JWT, CI o escaneos. Los comentarios finales deben vincular rama, commit, requisito y evidencia, y la transición debe corresponder a los criterios realmente satisfechos. Las actividades futuras y las dependencias humanas o de acceso permanecen abiertas.

## 6. Plan de mejora continua

Los plazos siguientes son propuestas relativas a la aceptación de la entrega; no constituyen horas trabajadas ni fechas ya acordadas con el equipo. Las personas indicadas son responsables de referencia por su ámbito actual en Jira y deben confirmar la planificación futura.

| Mejora | Acción concreta | Indicador de éxito propuesto | Prioridad y horizonte | Referencia responsable |
| --- | --- | --- | --- | --- |
| Reproducción por otro integrante | Clonar `dev-maxi` en un entorno limpio y seguir las instrucciones sin apoyo del autor. | Registro de commit, comandos y resultado por una segunda persona; cero pasos críticos omitidos. | Alta; primera revisión posterior a entrega. | Maximo coordina KAN-10; revisor por confirmar. |
| Paridad del backend compartido | Aplicar despliegue con acceso autorizado y repetir matriz de roles y JWT vencido. | Evidencia de firma/vigencia, ADMIN permitido, USER rechazado al crear y propiedad correcta en el mismo commit desplegado. | Alta; primera iteración con credenciales disponibles. | Sergionix y Juan, según KAN-18/21/23/29. |
| Restauración de datos | Documentar respaldo y recuperar un conjunto ficticio en base aislada. | Coincidencia de registros y relaciones; informe de recuperación sin alterar producción. | Alta; siguiente iteración de persistencia. | Juan, con ambiente de Humberto. |
| Endurecer publicación estable | Definir dominio de pruebas, HTTPS y lista CORS exacta; repetir ZAP. | Ninguna alerta nueva alta; hallazgos aceptados documentados y comprobación de rechazo de origen no autorizado. | Alta; antes de abrir acceso externo. | Humberto, KAN-13/51/55. |
| Ampliar la suite de interfaz | Extender los nueve casos Chromium aprobados a Firefox y WebKit; simular denegación de Clipboard API y comprobar selección/copia manual. | 9/9 casos por navegador a 320/375/430 px, sin desbordamiento; caso adicional de portapapeles denegado aprobado con mensaje y guía seleccionable. | Media; siguiente incremento de pruebas. | Sergionix y Juan, ámbitos KAN-21/29/52/53. |
| Reducir tamaño de carga | Medir el bundle y separar rutas o dependencias cuando resulte útil. | Artefacto principal menor de 500 KiB o justificación técnica basada en medición de carga. | Media; siguiente iteración de rendimiento. | Sergionix, ámbito KAN-11. |
| Controlar crecimiento del listado | Evaluar paginación visible y consulta por páginas sin cargar todo el historial. | Navegación con 10 000 registros ficticios y objetivo de respuesta p95 definido y medido antes de aprobar el cambio. | Media; antes de ampliar volumen. | Juan, ámbito KAN-38/39. |

### Innovación propuesta: consulta por QR sin exponer datos del paquete

Se propone generar un QR de la guía confirmada y permitir abrirlo desde el celular. Su objetivo es reducir errores al copiar o escribir una referencia larga. El QR contendrá únicamente una ruta con la guía; no incluirá dirección, destinatario, contraseña ni token. La consulta exigirá la misma sesión y validación de propiedad que la búsqueda manual.

En una iteración futura se compararán 20 consultas controladas por método, con los mismos datos ficticios. Se medirán tiempo mediano hasta abrir el detalle y proporción de guías mal capturadas. El criterio propuesto de aceptación es reducir al menos 20 % el tiempo mediano respecto de escribir la guía, mantener errores de captura por debajo de 5 % y aprobar el 100 % de los casos de rechazo sin sesión o con propietario ajeno. Son metas para el experimento; todavía no existen resultados ni participantes registrados. Juan es referencia para el módulo de consulta, Sergionix para acceso y Maximo para coordinar su priorización, sin cambiar asignaciones actuales por este documento.

## 7. Evidencias y criterios de cierre final

| Evidencia | Fuente y estado de este corte |
| --- | --- |
| Código y baseline | Rama `dev-maxi`; inicial `0469db3`; versión técnica final `82ad303`, fuente de aplicación `ede06a6`. |
| Contrato y permisos | [CONTRATO_PAQUETES_ACCESO.md](CONTRATO_PAQUETES_ACCESO.md). |
| Verificación remota y móvil previa | [SERGIO_VERIFICACION.md](SERGIO_VERIFICACION.md) y sus capturas enlazadas. |
| Unitarias/cobertura | [coverage.tap](../reportes/pruebas-unitarias/coverage.tap) y [lcov.info](../reportes/pruebas-unitarias/lcov.info), corte de 37 pruebas. |
| Calidad global | [baseline.html](../reportes/sonar/baseline.html), [baseline.json](../reportes/sonar/baseline.json), [final.html](../reportes/sonar/final.html) y [final.json](../reportes/sonar/final.json), reanálisis completado: 19→18 hallazgos. |
| ZAP inicial y posterior | Directorio `reportes/seguridad-zap` y [SEGURIDAD.md](SEGURIDAD.md), análisis e interpretación completados: 3→0 tipos con riesgo bajo/medio. |
| Integración real | [resultados.json](../reportes/integracion/resultados.json) descargado del run 35974266905: 14/14 casos, Auth/PostgreSQL/RLS aislados y limpieza aprobada. |
| Interfaz final | [ui-resultados.json](../reportes/integracion/ui-resultados.json): 9/9 casos en Chromium y 15 capturas, sin desbordamiento en anchos móviles. |
| Pipeline y despliegue | [Ejecución remota exitosa](https://github.com/Sergionixx/MilenioExpress/actions/runs/35974266905), `82ad303`; [recibo y digests](../evidencias/github-actions.json), [comprobaciones HTTP](../evidencias/despliegue.json) y [contenedor](../evidencias/contenedor.json), seis comprobaciones de despliegue aprobadas. |
| Documento de negocio y funcionamiento | [MILENIO_EXPRESS.md](../MILENIO_EXPRESS.md), con las tres partes solicitadas. |
| PDF y ZIP | [Informe PDF](INFORME_CIERRE.pdf) revisado visualmente y [ZIP de entrega](../entrega/entrega-final-milenio-express.zip) verificado: 91 entradas, 90 hashes SHA-256 correctos, 24 PNG reales y CRC correcto; únicamente .env.example como archivo de entorno. Publicación documental en dev-maxi. |
| Jira | [JIRA_EVIDENCIAS.md](JIRA_EVIDENCIAS.md): 26/27 asignadas Implementado, incluidos KAN-57/80; solo KAN-10 pendiente de otro integrante. |

El cierre técnico reúne el código de dev-maxi, los reportes originales, el pipeline exitoso, el despliegue verificado, el informe exportado y el ZIP íntegro. La documentación conserva la revisión técnica `82ad303` y los hashes de las fuentes analizadas; su publicación se integra en la misma rama. La revisión humana KAN-10, la aceptación del equipo, el despliegue del backend compartido y las propuestas futuras conservan su alcance propio.

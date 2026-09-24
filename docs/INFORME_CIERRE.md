# Informe de cierre — Milenio Express

**Rama de entrega:** `dev-maxi` · **Corte documental:** 24 de septiembre de 2026.

Este informe cubre el cierre y la mejora continua solicitados en los puntos 4 y 5 de «Entrega final del reto_proyecto.pdf», e incorpora la síntesis de calidad y seguridad del punto 3. La entrega se concentra en un módulo de creación y consulta de paquetes con autenticación y roles. Las propuestas de evolución se distinguen de las funciones implementadas.

**Estado de consolidación:** el módulo y sus pruebas locales están verificados. La evidencia final de análisis dinámico, la ejecución remota del pipeline, el empaquetado y la sincronización definitiva de Jira se están incorporando. No se consideran terminadas por aparecer descritas en este documento. El cierre final deberá enlazar los reportes y la ejecución de la versión publicada.

## 1. Fuentes y línea base

La evaluación utiliza el PDF de requisitos del usuario; el inventario del código; el [tablero KAN](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2); el historial Git; el [contrato de paquetes y acceso](CONTRATO_PAQUETES_ACCESO.md); y la [verificación previa de Sergio](SERGIO_VERIFICACION.md). La guía [MILENIO_EXPRESS.md](../MILENIO_EXPRESS.md) explica funcionamiento, negocio y términos técnicos.

Se fijó como línea base el commit `0469db39eef618e09c50c5af88bed250032e54d6`, «Complete Sergio session and mobile verification», fechado el 23 de septiembre de 2026. El historial registra el scaffold de Figma el 27 de agosto, la creación y consulta con permisos el 22 de septiembre y la integración y verificación del acceso entre el 22 y el 23 de septiembre. Estas fechas son fechas de commits, no horas de trabajo ni una duración medida del desarrollo.

El alcance de KAN-58 selecciona creación y consulta por guía: ADMIN crea y USER consulta sus paquetes. Excluye logística avanzada, fotos, firma, mapas, avisos, registro público y operación sin conexión. La rama de presentación interactiva permanece separada y no se incorpora a `dev-maxi`. Tampoco se modifica `main`.

El PDF muestra una entrega el 28 de septiembre de 2026; el tablero observado mantiene vencimiento del 25 de septiembre para las tarjetas asignadas. Se conservan ambas fuentes sin alterar el calendario del equipo ni suponer que significan la misma fecha. No existe en las fuentes revisadas un registro completo de horas planeadas y ejecutadas.

## 2. Comparación de avance planeado y ejecutado

| Elemento | Planeado según requisitos | Ejecutado y evidencia | Diferencia o causa |
| --- | --- | --- | --- |
| Módulo de negocio | Una creación y una consulta funcionales. | Formulario ADMIN, guía generada por persistencia, listado y consulta protegida. Código y contrato existentes; nuevas pruebas del adaptador HTTP. | Se entrega el módulo acordado, no todo el sistema logístico. |
| Autenticación | JWT verificado en servidor. | Supabase Auth verifica el token; se conserva el login existente. El documento de Sergio registra acceso remoto real y rechazo de token inválido. | Esa evidencia es previa. La expiración real y los cambios del backend deben verificarse en el entorno que corresponda; no se confunden pruebas simuladas con despliegue remoto. |
| Autorización | ADMIN crea; cuentas autenticadas consultan lo permitido. | El servicio consulta el rol confiable y la propiedad. Pruebas de rechazo sin token, USER que intenta crear y consulta ajena. | Ocultar botones no sustituye los controles del servidor. |
| Persistencia | Paquetes ligados a propietario y guía única. | Migración PostgreSQL con clave foránea, secuencia, trigger, restricciones y RLS. Se corrigió la paginación de propietarios. | La migración no se volvió a ejecutar sobre el proyecto remoto durante este corte; se conserva la evidencia histórica identificada. |
| Pruebas | Automatización y cobertura mínima de 80 % del módulo. | 37 pruebas aprobadas; 100 % líneas, 99.07 % ramas y 100 % funciones en el ámbito declarado. [Reporte TAP](../reportes/pruebas-unitarias/coverage.tap) y [LCOV](../reportes/pruebas-unitarias/lcov.info). | La cobertura anterior abarcaba cuatro módulos y 17 pruebas. Ahora incluye HTTP, repositorio y mensajes de acceso; no representa toda la UI ni infraestructura externa. |
| Construcción | Artefacto desplegable sin errores de tipos. | `typecheck` y `build` locales correctos. La compilación produce `dist`. | Vite conserva aviso de bundle mayor de 500 KiB; es una mejora de rendimiento, no un fallo de compilación. |
| CI/CD | Pruebas → build → despliegue automático a pruebas. | En consolidación: workflow para GitHub Actions con despliegue a contenedor temporal en el runner. | Configuración o build local no prueban un run remoto exitoso. Se debe adjuntar su enlace y resultado real antes de cerrar KAN-12/KAN-55. |
| Entorno de pruebas | Instancia verificable y evidencia de funcionamiento. | Servidor local previsto en el puerto 4174 y despliegue efímero automatizado. | El contenedor existe durante el run; no proporciona hosting permanente. No hay nuevas credenciales administrativas del Supabase remoto. |
| Calidad estática | Análisis global con tablero, métricas y hallazgo interpretado. | Reportes globales SonarJS/ESLint y jscpd, tablero HTML y referencia a las fuentes analizadas. Reanálisis final en consolidación. | No se presenta el tablero agregado como una instancia de SonarQube Server; sus métricas no disponibles se declaran expresamente. |
| Seguridad dinámica | ZAP inicial, interpretación, corrección y reanálisis. | Ejecución y documentos finales en consolidación dentro de `reportes/seguridad-zap`. | No se cierra el requisito con la mera presencia de un script o plan de escaneo. |
| Interfaz móvil | Acceso, registro y consulta entre 320 y 430 px. | Evidencia previa de Sergio a 320, 375 y 430 px, foco y etiquetas. | Emulación de navegador, no dispositivo físico; nueva verificación debe asociarse a la versión final. |
| Duración | Comparar esfuerzo y desviaciones. | Se dispone de fechas Git y vencimientos Jira, sin bitácora de horas. | No se puede calcular una desviación temporal fiable; no se inventan días u horas consumidas. |
| Informe y entrega | Cierre, mejora, innovación y ZIP sin secretos. | Este informe editable y la guía de tres partes; empaquetado y versión PDF/Word en consolidación. | El Markdown por sí solo no sustituye el formato PDF/Word solicitado. |

## 3. Síntesis técnica, calidad y seguridad

### 3.1. Arquitectura y pruebas

El flujo mantiene React y Supabase. Las reglas de campos y permisos permanecen en `domain.ts` y `service.ts`; `handler.ts` contiene el contrato HTTP; `repository.ts` concentra las llamadas a Auth y PostgreSQL. El archivo de arranque Deno conecta esas piezas con las variables privadas del servidor. Esta separación permite ejecutar el mismo manejo HTTP en las pruebas sin arrancar un servicio externo.

Las 37 pruebas del corte incluyen normalización y límites de campos, guías inválidas e inexistentes, permisos, propiedad, fallo de dependencias, envío del JWT a Supabase Auth, paginación, errores de almacenamiento, cabeceras, CORS configurable, límite de cuerpo y limpieza de sesión ante `401`. Se usan cuentas y datos ficticios. Las pruebas del adaptador Supabase usan el SDK con transporte controlado; verifican solicitudes y respuestas, pero no son una nueva validación del servidor remoto.

El ámbito de cobertura comprende `authErrors.ts`, `http.ts`, `session.ts`, `domain.ts`, `service.ts`, `handler.ts` y `repository.ts`. Quedan fuera de esa cifra la interfaz `App.tsx`, el arranque Deno, el cliente de navegador, el SDK de terceros y la ejecución SQL. Se declaran para evitar interpretar la cifra como una cobertura de toda la aplicación.

### 3.2. Análisis estático global

El análisis usa el perfil recomendado de SonarJS con ESLint, verificación TypeScript y jscpd. Se ejecuta sobre las fuentes de aplicación de `src`, `supabase/functions/server` y `utils`, con manifiesto y hashes que identifican los archivos. Pruebas, scripts, dependencias y bundles generados no forman parte del análisis global de fuentes; las pruebas tienen su propia ejecución. Los tableros disponibles son [línea base](../reportes/sonar/baseline.html) y [corte final](../reportes/sonar/final.html).

El reporte [baseline.json](../reportes/sonar/baseline.json) registra 19 hallazgos, 12 archivos y 1 669 líneas físicas para el commit de referencia. Registra cero clones y cero líneas duplicadas según la configuración del detector. Esa cifra de duplicación no mide similitudes conceptuales ni todas las formas posibles de repetición.

| Métrica requerida | Disponibilidad e interpretación |
| --- | --- |
| Hallazgos por regla | Disponible en los JSON originales y el tablero; el reanálisis final debe corresponder al árbol consolidado. |
| Bugs, Vulnerabilities y Security Hotspots de SonarQube | No disponibles como métricas de servidor. No se sustituyen por ceros ni se equiparan automáticamente con la severidad de ESLint. |
| Code Smells y Technical Debt de SonarQube | No disponibles como clasificación y estimación de SonarQube. Los hallazgos de mantenimiento se explican individualmente. |
| Duplicated Lines | Disponible mediante jscpd, con configuración y ámbito indicados en el reporte. |
| Cobertura | Disponible en TAP/LCOV para el módulo; su alcance es distinto al análisis global. |

**Hallazgo revisado.** En la línea base, `index.tsx` incluía una asignación dentro de una expresión de retorno (`service ??= …`), señalada por `sonarjs/no-nested-assignment`. Se sustituyó por una comprobación explícita de la instancia, su creación y retorno. El cambio facilita seguir el arranque y no altera el contrato de la API. Durante la ampliación, el analizador también detectó complejidad cognitiva 18 en el manejador HTTP, por encima del umbral 15: se extrajo la lógica CORS a una función específica y la revisión dirigida posterior pasó. La comparación global final debe conservar el reporte de reanálisis, no solamente esta explicación.

El tablero agregado permite revisar el proyecto fuera del editor. No se afirma haber instalado SonarQube Community Build ni haber obtenido un Quality Gate de su servidor. La equivalencia de herramientas y las métricas ausentes se exponen para que la evaluación pueda comprobar el alcance real.

### 3.3. Seguridad dinámica y límites

OWASP ZAP analiza respuestas de una aplicación ejecutándose. La inspección pasiva observa tráfico y cabeceras; un análisis activo además envía solicitudes de ataque y solo debe dirigirse al entorno propio autorizado. En esta entrega el objetivo de análisis es local, no Atlassian, GitHub ni otros servicios ajenos.

**Estado del corte:** los reportes inicial y posterior, su tabla interpretada y la conclusión final están en proceso de incorporación. No se declara un número de alertas ni una corrección validada por ZAP antes de disponer de su evidencia original. La versión final de este apartado debe referenciar `reportes/seguridad-zap` e identificar hallazgo, riesgo, ruta, evidencia, acción y resultado posterior.

El endurecimiento implementado en el manejo HTTP incluye `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: no-referrer`. CORS permite definir orígenes exactos con `ALLOWED_ORIGINS`; conserva el valor anterior `*` si no se configura para no romper las interfaces existentes del equipo. CORS no reemplaza JWT ni autorización y debe limitarse expresamente en el entorno publicado.

Un escaneo público no demuestra por sí solo seguridad de rutas autenticadas. Los rechazos `401` esperados no son defectos. Debe registrarse qué rutas exploró ZAP, cuáles requieren token y qué controles de roles se verificaron con pruebas independientes. La app no genera APK; las alternativas Android/MobSF y la instalación de certificados móviles no aplican a este alcance web.

### 3.4. Configuración, secretos y despliegue

Las claves de servicio y contraseñas deben permanecer en variables privadas del servidor o secrets de CI. El ejemplo `.env.example` contiene marcadores, no credenciales. La URL y clave pública de Supabase utilizadas por el navegador no sustituyen las políticas de acceso y no se deben confundir con `SUPABASE_SERVICE_ROLE_KEY`.

El destino acordado de Git es exclusivamente `dev-maxi`. Publicar archivos en esa rama no actualiza automáticamente la Edge Function remota ni modifica `main`. El workflow se prepara con eventos de push/PR y dependencias bloqueantes entre pruebas, construcción y despliegue a pruebas; el enlace de ejecución y el commit final constituyen la evidencia del resultado remoto. El contenedor del runner se elimina al terminar: sus logs, comprobaciones y artefactos son la prueba reproducible del despliegue temporal.

## 4. Desviaciones y lecciones de ingeniería

1. **La base ya tenía avances funcionales.** La entrega partió de creación, consulta, Auth, roles y evidencia móvil existentes. La ampliación se concentra en cobertura HTTP/repositorio, robustez, automatización, análisis y documentación; no se atribuye como nuevo el trabajo previo de Juan o Sergio.
2. **La cobertura necesita explicar el ámbito.** Un 100 % en cuatro archivos no acredita todos los adaptadores. Extraer y probar el manejo HTTP y el repositorio amplió la evidencia sin duplicar reglas de negocio ni fingir una respuesta productiva.
3. **Los límites del proveedor afectan funciones aparentemente completas.** El listado de propietarios podía truncarse con el límite de respuesta. La paginación ordenada por nombre e identificador recupera todas las páginas y tiene pruebas con más de 500 elementos.
4. **Un error externo también requiere contrato.** Una respuesta de error JSON `null` podía provocar un fallo al leer sus campos. El cliente ahora conserva un error comprensible, incluso cuando el proveedor devuelve un cuerpo inesperado o una respuesta exitosa sin JSON válido.
5. **Las credenciales y los roles tienen fuentes distintas.** El JWT prueba identidad; `profiles.role` define permisos. Las pruebas comprueban ambas decisiones y descartan roles enviados por el cliente. Si se reiniciara el proyecto, esta matriz se definiría antes de construir las pantallas.
6. **La evidencia debe corresponder a una versión.** Los resultados previos son útiles, pero no prueban una publicación nueva. Se conserva la referencia inicial y cada análisis identifica las fuentes utilizadas. Al reiniciar el proyecto se automatizaría desde el primer incremento la conservación de reportes por commit.
7. **El entorno temporal tiene un alcance concreto.** Un despliegue dentro de CI permite verificar el artefacto sin contratar hosting. No reemplaza la administración del Supabase compartido ni una URL disponible para usuarios fuera del run.
8. **El cierre de una tarjeta requiere su criterio completo.** Una revisión hecha por automatización no sustituye la validación humana pedida a otro integrante. KAN-10 debe conservar esa dependencia hasta que exista evidencia real de la revisión.

## 5. Responsabilidades y trazabilidad Jira

La lectura del tablero del 24 de septiembre registró 26 tarjetas asignadas con vencimiento el 25 de septiembre: Sergionix, 9; Juan Deluquez, 8; Humberto T, 5; Maximo Aguilar, 4. Se conserva la persona asignada actualmente en Jira aunque una descripción histórica mencione otro reparto. Este informe no registra acuerdos ni aprobaciones en nombre de esas personas.

| Responsable en Jira | Ámbito de referencia | Tarjetas principales |
| --- | --- | --- |
| Sergionix | Base del cliente/backend, acceso, roles, sesión y verificación del recorrido móvil. | KAN-11, 15, 16, 18, 19, 20, 21, 52 y 53. |
| Juan Deluquez | Persistencia, creación, guías, consulta y pruebas del módulo. | KAN-14, 23, 24, 27, 29, 35, 38 y 39. |
| Humberto T | Ambientes, pipeline, despliegue y análisis de calidad/seguridad. | KAN-12, 13, 51, 54 y 55. |
| Maximo Aguilar | Documentación, alcance, organización y cierre. | KAN-10, 57, 58 y 59. |

Las épicas no se cierran automáticamente porque haya un módulo terminado. Las tarjetas de demo local que ya figuraban «Implementado» mantienen su historia, sin utilizar ese estado como prueba nueva de JWT, CI o escaneos. Los comentarios finales deben vincular rama, commit, requisito y evidencia, y la transición debe corresponder a los criterios realmente satisfechos. Las actividades futuras y las dependencias humanas o de acceso permanecen abiertas.

## 6. Plan de mejora continua

Los plazos siguientes son propuestas relativas a la aceptación de la entrega; no constituyen horas trabajadas ni fechas ya acordadas con el equipo. Las personas indicadas son responsables de referencia por su ámbito actual en Jira y deben confirmar la planificación futura.

| Mejora | Acción concreta | Indicador de éxito propuesto | Prioridad y horizonte | Referencia responsable |
| --- | --- | --- | --- | --- |
| Reproducción por otro integrante | Clonar `dev-maxi` en un entorno limpio y seguir las instrucciones sin apoyo del autor. | Registro de commit, comandos y resultado por una segunda persona; cero pasos críticos omitidos. | Alta; primera revisión posterior a entrega. | Maximo coordina KAN-10; revisor por confirmar. |
| Paridad del backend compartido | Aplicar despliegue con acceso autorizado y repetir matriz de roles y JWT vencido. | Evidencia de firma/vigencia, ADMIN permitido, USER rechazado al crear y propiedad correcta en el mismo commit desplegado. | Alta; primera iteración con credenciales disponibles. | Sergionix y Juan, según KAN-18/21/23/29. |
| Restauración de datos | Documentar respaldo y recuperar un conjunto ficticio en base aislada. | Coincidencia de registros y relaciones; informe de recuperación sin alterar producción. | Alta; siguiente iteración de persistencia. | Juan, con ambiente de Humberto. |
| Endurecer publicación estable | Definir dominio de pruebas, HTTPS y lista CORS exacta; repetir ZAP. | Ninguna alerta nueva alta; hallazgos aceptados documentados y comprobación de rechazo de origen no autorizado. | Alta; antes de abrir acceso externo. | Humberto, KAN-13/51/55. |
| Automatizar recorrido de interfaz | Añadir prueba de login, registro, copia, consulta propia, rechazo ajeno y logout. | Recorrido completo repetible en CI y en anchos 320, 375 y 430 px, sin desbordamiento horizontal. | Media; siguiente incremento de pruebas. | Sergionix y Juan, KAN-21/29/52/53. |
| Reducir tamaño de carga | Medir el bundle y separar rutas o dependencias cuando resulte útil. | Artefacto principal menor de 500 KiB o justificación técnica basada en medición de carga. | Media; siguiente iteración de rendimiento. | Sergionix, ámbito KAN-11. |
| Controlar crecimiento del listado | Evaluar paginación visible y consulta por páginas sin cargar todo el historial. | Navegación con 10 000 registros ficticios y objetivo de respuesta p95 definido y medido antes de aprobar el cambio. | Media; antes de ampliar volumen. | Juan, ámbito KAN-38/39. |

### Innovación propuesta: consulta por QR sin exponer datos del paquete

Se propone generar un QR de la guía confirmada y permitir abrirlo desde el celular. Su objetivo es reducir errores al copiar o escribir una referencia larga. El QR contendrá únicamente una ruta con la guía; no incluirá dirección, destinatario, contraseña ni token. La consulta exigirá la misma sesión y validación de propiedad que la búsqueda manual.

En una iteración futura se compararán 20 consultas controladas por método, con los mismos datos ficticios. Se medirán tiempo mediano hasta abrir el detalle y proporción de guías mal capturadas. El criterio propuesto de aceptación es reducir al menos 20 % el tiempo mediano respecto de escribir la guía, mantener errores de captura por debajo de 5 % y aprobar el 100 % de los casos de rechazo sin sesión o con propietario ajeno. Son metas para el experimento; todavía no existen resultados ni participantes registrados. Juan es referencia para el módulo de consulta, Sergionix para acceso y Maximo para coordinar su priorización, sin cambiar asignaciones actuales por este documento.

## 7. Evidencias y criterios de cierre final

| Evidencia | Fuente y estado de este corte |
| --- | --- |
| Código y baseline | Rama `dev-maxi`; referencia inicial `0469db3`. La versión final debe identificarse con su commit publicado. |
| Contrato y permisos | [CONTRATO_PAQUETES_ACCESO.md](CONTRATO_PAQUETES_ACCESO.md). |
| Verificación remota y móvil previa | [SERGIO_VERIFICACION.md](SERGIO_VERIFICACION.md) y sus capturas enlazadas. |
| Unitarias/cobertura | [coverage.tap](../reportes/pruebas-unitarias/coverage.tap) y [lcov.info](../reportes/pruebas-unitarias/lcov.info), corte de 37 pruebas. |
| Calidad global | [baseline.html](../reportes/sonar/baseline.html), [baseline.json](../reportes/sonar/baseline.json), [final.html](../reportes/sonar/final.html) y [final.json](../reportes/sonar/final.json); consolidación del reanálisis en curso. |
| ZAP inicial y posterior | Directorio `reportes/seguridad-zap`; consolidación de reportes e interpretación en curso. |
| Pipeline y despliegue | Enlace remoto, logs y artefactos por incorporar tras la ejecución real. |
| Documento de negocio y funcionamiento | [MILENIO_EXPRESS.md](../MILENIO_EXPRESS.md), con las tres partes solicitadas. |
| PDF/Word y ZIP | Pendientes del empaquetado final y revisión de su contenido. |
| Jira | Sincronización final según evidencia; no se acredita revisión de otro integrante inexistente. |

El cierre técnico se considera completo cuando los reportes originales, el pipeline exitoso, la evidencia de despliegue, el informe exportado y el ZIP apunten a la versión entregada, y las limitaciones permanezcan explícitas. La aceptación del equipo, los accesos externos y las propuestas futuras conservan su estado propio; no se sustituyen por resultados inventados.

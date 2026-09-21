# Plan vigente de entrega — Milenio Express

Decisiones de coordinación del 20 de septiembre de 2026, preparadas por autorización del usuario. Fecha final fijada por el usuario: **25 de septiembre de 2026**, zona America/Mexico_City. Jira registra una fecha, no una hora de entrega.

## Fuente de verdad y alcance de estas decisiones

[KAN — Milenio Express](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2) es la fuente de responsables, estados y fechas. El cambio masivo confirmó 59 tareas asignadas y no terminadas con vencimiento el 25 de septiembre. Ese número es una operación histórica, no un contador en vivo. PACKAGE es el tablero anterior.

Este documento sustituye las decisiones abiertas de los planes locales. `KANBAN.md`, `kanban-data.json` y `kanban.html` se conservan como referencia histórica; sus estados y ediciones locales no representan Jira. `RUTAS-SIMULADAS.md` conserva el detalle de cobertura y se integra al orden de trabajo siguiente.

Se fijan criterios internos de entrega, no se afirma aprobación del profesor ni conformidad con una rúbrica que no ha sido revisada aquí. Si aparece un requisito académico incompatible, al07098284 registra la diferencia en KAN-58 antes de cambiar el alcance. No se declaran funciones implementadas por escribir este plan.

## Matriz de aceptación

| Requisito | Decisión | Jira | Evidencia para cerrar |
| --- | --- | --- | --- |
| Web móvil React | Obligatorio; conservar la plataforma actual | KAN-11, KAN-53 | Recorrido en 320, 375 y 430 px, sin desbordamiento horizontal; teclado, etiquetas y errores legibles |
| Cuentas y permisos | Obligatorio; cliente, repartidor y administrador reales | KAN-16 a KAN-21, KAN-61 | Dos clientes no acceden a envíos ajenos; repartidor modifica solo asignados; registro público sin autoasignación de privilegios |
| Paquetes y guía manual | Obligatorio; datos compartidos | KAN-14, KAN-23, KAN-24, KAN-27 | Registrar, copiar y consultar la misma guía desde otro dispositivo autorizado; errores visibles |
| Estados e historial | Obligatorio; eventos persistentes y sin duplicados | KAN-34, KAN-37, KAN-38 | Transición válida conservada tras recarga; rechazar saltos y doble entrega; repetir petición sin duplicar eventos |
| Evidencia | Obligatorio; foto y nombre del receptor | KAN-44, KAN-46, KAN-47, KAN-50 | JPG/PNG/WebP hasta 1 MB; lectura restringida; fallo de carga no confirma entrega |
| Destinatario | Obligatorio; enlace seguro | KAN-39, KAN-64 | Enlace limitado al envío; caducidad/revocación verificadas; guía sola no concede acceso privado |
| Ubicación y mapa | Obligatorio; checkpoints ficticios identificados como simulación | KAN-41, KAN-60, KAN-75 | Último checkpoint y línea de tiempo coherentes; mensaje útil sin ubicación o mapa disponible |
| Rutas simuladas | Obligatorio; conservar 50 países, 269 centros y 2,450 pares internacionales dirigidos | KAN-65 a KAN-78 | Catálogo validado; todos los pares alcanzan destino sin ciclos; ejemplos, inversos y rutas nacionales; pausa, avance, velocidad, reinicio y recarga |
| Avisos | Obligatorio dentro de la app; push, SMS y correo fuera de esta entrega | KAN-42, KAN-43 | Cambio relevante visible solo para destinatario autorizado; leído/no leído y preferencias |
| Administración e incidencias | Obligatorio | KAN-61, KAN-62, KAN-63, KAN-76 | Asignar repartidor, resolver incidencia y conservar actor, fecha y evento de auditoría |
| Trabajo sin conexión | Obligatorio acotado a una sesión ya cargada | KAN-28, KAN-49 | Operación pendiente visible; al volver conexión se revalida permiso/estado y se sincroniza una vez; conflictos y almacenamiento lleno se muestran; no se finge éxito remoto |
| Apertura inicial offline/PWA | No requerida en esta entrega | KAN-58 | Documentar que cargar por primera vez requiere conexión; no prometer caché instalable |
| Rendimiento | Mantener objetivo de referencia: p95 ≤ 2 s con 100 usuarios concurrentes | KAN-52, KAN-54, KAN-56 | Ensayo de 10 minutos tras 1 minuto de calentamiento, lecturas de guía/historial; registrar entorno, muestra, p95 y errores; medir foto/mapa aparte. Un fallo queda abierto, no se elimina el objetivo |
| Disponibilidad | Verificación de la sesión de exposición; sin prometer SLA de producción | KAN-55, KAN-57 | Smoke test HTTPS al preparar entrega y antes de exponer; ensayo de 30 minutos; demo local de respaldo. Cualquier porcentaje exigido por rúbrica requiere evidencia adicional |
| Calidad y liberación | Obligatorio | KAN-12, KAN-51 a KAN-57 | Tests, TypeScript y build verdes; CI remoto verificado; E2E con dos cuentas y dos dispositivos; capturas y limitaciones con versión exacta |
| Android/Kotlin, Firebase/MySQL adicionales, QR, barras, escaneo, pagos, transportistas reales | Excluidos de la implementación de esta entrega | KAN-58 | Documento y exposición describen la plataforma real y no prometen estas funciones |
| Firma del receptor | Opcional, no condiciona la entrega | KAN-45 | No sustituye fotografía y receptor; no desplazar trabajo obligatorio por esta tarjeta |

## Decisión de backend y almacenamiento

**Decisión: Supabase para Auth, Postgres y Storage privado; React/Vite para el cliente.** Se aprovecha la dependencia y el scaffold existentes. No añadir un segundo backend Firebase/MySQL. Las reglas privilegiadas se ejecutarán del lado servidor; los trabajadores deciden y prueban su implementación dentro de las tarjetas asignadas.

La demo local sigue siendo un recorrido reproducible con datos ficticios y perfiles simulados. La versión compartida debe identificarse claramente y nunca cambiar silenciosamente a datos locales cuando falle el servidor. La integración heredada no está conectada a la demo actual y no prueba que haya un backend listo.

| Ambiente | Uso y configuración prevista | Responsable de implementación |
| --- | --- | --- |
| Demo local | Instalación del README; sin credenciales remotas; datos ficticios reiniciables | Responsables actuales de la demo |
| Desarrollo compartido | Proyecto Supabase de desarrollo o stack local; cambios reproducibles, cuentas ficticias y pruebas de autorización | Sergionix, KAN-13/KAN-14/KAN-15 |
| Piloto/entrega | Configuración aislada de desarrollo; frontend HTTPS publicado mediante el flujo de despliegue disponible, redirects de Auth exactos y prueba desde celular | Sergionix, KAN-55; validación Humberto T |

Contrato previsto de configuración: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` para el navegador; credenciales administrativas solo en secretos del servidor/CI. Estos nombres son una decisión para implementar: el cliente heredado todavía importa `utils/supabase/info`. No se crean credenciales ni se afirma que esas variables funcionen hoy. No versionar archivos `.env` ni claves privadas. Las cuentas y fotos del piloto serán ficticias; revisar límites del proyecto elegido antes de cargar datos. No se autoriza contratar servicios de pago.

Acceso esperado: autenticación más autorización por usuario/asignación, políticas de filas para datos expuestos y políticas de Storage para fotos privadas. No confiar en un rol editable por el navegador. El esquema, migraciones y políticas quedan dentro del trabajo de los responsables; este documento no introduce SQL.

Referencias de la decisión: [Auth](https://supabase.com/docs/guides/auth), [Storage y control de acceso](https://supabase.com/docs/guides/storage/security/access-control).

## Responsables y orden unificado

Se conservan los responsables observados en Jira; esta tabla resume áreas y no reasigna tarjetas.

| Persona en Jira | Coordinación y ejemplos de trabajo asignado |
| --- | --- |
| Sergionix | Plataforma, backend, integración y liberación; KAN-10/11/13/14/15/18/19/20/21/27/31/54/55/59/63 |
| Juan Deluquez | Paquetes, eventos, sincronización y motor/catálogo de rutas; KAN-23/24/28/29/37/60/62/66/67/70/71/73/76 |
| Maximo Aguilar | Acceso e interfaz, seguimiento/mapa, administración y catálogos; KAN-16/17/34/35/38/39/41/42/43/44/61/64/68/69/75 |
| Humberto T | CI, evidencia, QA y exposición; KAN-12/46/47/49/50/51/52/53/56/57/72/74/77; firma KAN-45 opcional |
| al07098284 | Alcance y documentación de rutas; KAN-58/KAN-78 |

Los hitos siguientes son objetivos internos de coordinación establecidos en este plan. La fecha final de Jira sigue siendo el 25; no se atribuye al equipo una aceptación previa de los hitos.

1. **21 sep — contratos y base:** KAN-58/59 como coordinación; KAN-13/14/15 para configuración y persistencia; KAN-66 para contrato de rutas. Definir entradas, salidas, errores y responsable de cada interfaz antes de integración. Catálogos regionales KAN-67 a KAN-70 avanzan después del contrato KAN-66. Diseño móvil, documentación y pruebas pueden avanzar con ejemplos acordados.
2. **22 sep — recorrido compartido:** acceso/permisos → paquete/guía → transición/evento → evidencia. En rutas: catálogo validado → KAN-71 generador → KAN-72 ejemplos → KAN-73 asociación. No bloquear el motor por la publicación del backend si se puede verificar con datos ficticios.
3. **23 sep — integración completa:** incorporar mapa/checkpoints, controles KAN-74/75, incidencias KAN-76, destinatario, avisos, administración y sincronización. KAN-55 prepara HTTPS. Comprobar que dos dispositivos ven el mismo envío autorizado.
4. **24 sep — cierre de funciones y QA:** pruebas de permisos, E2E, móvil, recuperación de conexión y 2,450 pares KAN-77; rendimiento y piloto; corrección de bloqueos. Registrar cualquier criterio fallido y su responsable. No presentar como terminado trabajo pendiente ni añadir funciones opcionales.
5. **25 sep — entrega:** verificar CI y smoke test, congelar versión, capturas, documentación KAN-57/78, guion y ensayo. Hora exacta no especificada por el usuario; no se inventa.

Dependencias de rutas: KAN-66 → KAN-67/68/69/70 → KAN-71 → KAN-72/73 → KAN-74/75/76 → KAN-77 → KAN-78. Documentación y diseño pueden empezar antes con contratos acordados; cierre exige la implementación. Las dependencias aquí expresan el orden de integración y no afirman que existan enlaces de bloqueo en Jira.

Una tarea pasa a revisión con evidencia y versión/PR; se cierra solo al cumplir su criterio. Cada persona mantiene como máximo dos tareas en curso y registra bloqueos con dependencia y siguiente acción. El tablero debe distinguir implementación, revisión y trabajo ya verificado.

## Checkpoint y límites de esta preparación

Checkpoint local creado: **`7af9577`**, en `codex/prototipo-academico`, conserva la demo y configuración preexistentes. Verificación del 20 de septiembre: **6/6 pruebas, TypeScript y build correctos**. La documentación se guarda en un commit separado. No equivale a desplegar ni a que CI remoto haya pasado; no se hizo push. El checkpoint conserva el trabajo previo sin implementar las tareas de cada persona.

Hallazgos del checkpoint para los responsables: la descripción de `.figma/make/site.json` contiene `acad?mico` (metadatos, KAN-55); la validación local de foto comprueba formato de data URL, no decodificación del archivo, y la prueba usa contenido ficticio (KAN-50). No impiden guardar el estado existente, pero el checkpoint no certifica que la aplicación compartida esté lista.

La matriz/decisión de backend se publicó en la descripción de KAN-58; responsables, hitos, dependencias y evidencia del checkpoint en KAN-59. Se preservaron las descripciones originales como antecedentes. Las dos tarjetas se llevan a revisión, no a implementación terminada.

La preparación queda documentada; siguen siendo trabajo de implementación: aprovisionar/verificar ambientes, conectar backend, completar las funciones, medir rendimiento y reunir evidencia académica. La rúbrica original no fue aportada en esta revisión: la matriz es el criterio interno operativo y no una certificación del profesor.

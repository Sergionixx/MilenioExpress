# Kanban en Jira

## Seguimiento vigente — 21 de septiembre de 2026

[Abrir KAN — Milenio Express](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2).

El plan vigente es [PLAN-ENTREGA.md](PLAN-ENTREGA.md), con alcance, criterios, decisión de backend y orden de integración. Los responsables están asignados en Jira. Reparto vigente solicitado el 21 de septiembre: Sergionix 9 (acceso/integración), Juan 8 (paquetes completos), Humberto 5 (CI/CD y análisis), Maximo 4 (documentación/cierre), al07098284 0. Las 26 descripciones detallan pasos, dependencias y evidencia. La operación masiva del 20 de septiembre confirmó el vencimiento **25 de septiembre de 2026** en 59 tareas asignadas no terminadas, incluidas entonces las rutas simuladas. El 21 de septiembre se retiraron 36 tarjetas a Fuera de alcance conforme a la rúbrica: KAN-17/28/31/34/37/40–50/56/60–78. El plan vigente limita la entrega a creación/consulta, JWT/roles, cobertura ≥80%, CI/CD con deployment, SonarQube, ZAP e informe/ZIP. KAN-58 contiene la coordinación de alcance y KAN-59 la de responsables/fechas.

Los registros PACKAGE y las cantidades siguientes son **históricos**. No usarlos para asignar trabajo ni deducir estados actuales; no existe correspondencia automática de números entre ambos proyectos. Los tableros locales tampoco se sincronizan con Jira. Conservar las asignaciones del proyecto KAN.

## Registro histórico del tablero anterior

Actualización: 17 de septiembre de 2026.

[Abrir tablero PACKAGE](https://tecmilenio-team-gs8kbphw.atlassian.net/jira/software/projects/PACKAGE/boards/100)

Jira es el tablero de seguimiento. Los archivos `kanban-data.json`, `KANBAN.md` y `kanban.html` conservan el plan local de referencia; no se sincronizan automáticamente con Jira.

## Clasificación

- Implementado: 6 tarjetas acotadas a funciones verificadas de la demo local (PACKAGE-20, 24, 31, 34, 38 y 46).
- Incompleto / En progreso: 19 tarjetas con implementación parcial y pendientes explicados.
- Pendiente: 29 tarjetas, incluida una firma opcional (PACKAGE-43).
- En revisión: 0 tarjetas.
- Fuera de alcance: 3 tarjetas (PACKAGE-23, 28 y 30), sin contarlas como implementadas.

Total: 57 tareas y 6 épicas. Se actualizaron las 50 tareas originales y se añadieron 7 (PACKAGE-58 a PACKAGE-64). Las seis épicas tienen trabajo parcial y permanecen abiertas.

La demo usa almacenamiento del navegador y roles simulados. No se considera terminada la autenticación, persistencia compartida, autorización del servidor, almacenamiento remoto de fotografías ni ejecución remota de CI. El alcance es web móvil, sin Android nativo, QR, barras ni escaneo.

## Correspondencia del plan

| Plan | Tarjetas principales de Jira |
| --- | --- |
| ME-01 Alcance | PACKAGE-58 |
| ME-02 Responsables y orden | PACKAGE-59 |
| ME-03 Backend | PACKAGE-9, 11, 13 |
| ME-04 Modelo persistente | PACKAGE-12 |
| ME-05 Autenticación | PACKAGE-14, 15, 16, 18, 19 |
| ME-06 Permisos | PACKAGE-17, 19, 49 |
| ME-07 Datos compartidos | PACKAGE-21, 22, 36 |
| ME-08 Estados atómicos | PACKAGE-35 |
| ME-09 Evidencia remota | PACKAGE-44, 45, 49 |
| ME-10 Captura móvil | PACKAGE-29, 42 |
| ME-11 Copiar y buscar guía | PACKAGE-25 |
| ME-12 Enlace destinatario | PACKAGE-37, 64 |
| ME-13 Checkpoints | PACKAGE-60 |
| ME-14 Mapa | PACKAGE-39 |
| ME-15 Avisos | PACKAGE-40 |
| ME-16 Administración | PACKAGE-61 |
| ME-17 Incidencias | PACKAGE-62 |
| ME-18 Auditoría | PACKAGE-63 |
| ME-19 Sin conexión | PACKAGE-26, 47 |
| ME-20 QA móvil | PACKAGE-53 |
| ME-21 Pruebas y CI | PACKAGE-10, 19, 27, 33, 41, 48, 52 |
| ME-22 Despliegue | PACKAGE-55 |
| ME-23 Rendimiento | PACKAGE-50, 51, 54 |
| ME-24 Piloto | PACKAGE-56 |
| ME-25 Documentación | PACKAGE-57 |
| ME-26 Entrega | PACKAGE-8, 10, 57 |
| BASE-01 Interfaz móvil | PACKAGE-24 |
| BASE-02 Roles simulados | Parte implementada en PACKAGE-17, 18 |
| BASE-03 Alta y guía local | PACKAGE-20, 24 y parte implementada en PACKAGE-22 |
| BASE-04 Seguimiento local | PACKAGE-31, 34, 38 |
| BASE-05 Foto y receptor local | PACKAGE-46 y parte implementada en PACKAGE-42, 45 |
| BASE-06 Pruebas locales y archivo CI | Parte implementada en PACKAGE-10 |

Los responsables y fechas deberán acordarse con el equipo; no se inventaron asignaciones ni compromisos. Las dependencias se documentaron en las descripciones; no todas están creadas como enlaces de bloqueo de Jira.

## Dificultad estimada

Cada una de las 57 tareas tiene una etiqueta visible en Jira. Es una estimación técnica del alcance de la tarjeta, no una prioridad ni una duración garantizada. En las tareas implementadas clasifica el trabajo realizado; en las parciales, la complejidad de completarlas.

| Etiqueta | Criterio | Cantidad | PACKAGE |
| --- | --- | --- | --- |
| dificultad-baja | Cambio acotado, interfaz simple o planificación/documentación básica | 9 | 8, 14, 20, 24, 25, 31, 38, 58, 59 |
| dificultad-media | Integración acotada, varios estados de UI o validación de varios casos | 25 | 9, 10, 11, 15, 18, 22, 29, 32, 33, 34, 36, 37, 39, 42, 43, 45, 46, 50, 53, 54, 55, 56, 57, 60, 62 |
| dificultad-alta | Seguridad, concurrencia, sincronización o pruebas de varios componentes | 20 | 12, 13, 16, 17, 19, 21, 26, 27, 35, 40, 41, 44, 47, 48, 49, 51, 52, 61, 63, 64 |
| dificultad-no-aplica | Trabajo excluido del alcance, sin esfuerzo comprometido | 3 | 23, 28, 30 |

Las etiquetas originales, prioridades y estados se conservaron. La firma opcional PACKAGE-43 tiene dificultad media si se decide implementarla.

## Tablero nuevo para la entrega

La copia de trabajo para el prototipo web móvil quedó en el sitio Jira Free:

- Sitio: https://milenioexpress-sergionix.atlassian.net
- Proyecto: **KAN — Milenio Express**
- Tablero Kanban: https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2
- Estados: Pendiente, Incompleto / En progreso, En revisión, Implementado y Fuera de alcance.
- Se copiaron los épicos y las tareas PACKAGE-2 a PACKAGE-64 como KAN-4 en adelante; KAN-64 fue verificada en el tablero.
- No se agregaron usuarios ni correos al sitio nuevo.

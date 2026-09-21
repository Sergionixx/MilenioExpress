# Entrega académica — alcance vigente

Revisión del 21 de septiembre de 2026 basada en la [rúbrica del usuario](RUBRICA-ENTREGA.txt). Sustituye el alcance ampliado del 20 de septiembre. Fecha final: **25 de septiembre de 2026**, America/Mexico_City; hora no indicada. [Jira KAN](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2) conserva responsables, estados y fechas.

## Un módulo terminado

Implementar **creación y consulta de paquetes por guía**, mediante la web React y su backend. ADMIN crea paquetes; USER y ADMIN autenticados consultan los paquetes permitidos. El servidor valida JWT y permisos: sin token se rechaza la operación protegida y USER no puede crear. Cuentas ficticias preparadas son suficientes; registro público y recuperación de contraseña no son necesarios.

Se mantiene React/Vite y la decisión previa de aprovechar Supabase Auth/Postgres, reducida a autenticación y persistencia de usuarios/paquetes. El responsable deberá demostrar JWT real, validación en servidor y rol confiable; un selector de perfil no cumple. Claves de firma y credenciales privilegiadas van en configuración segura/secretos, nunca en código o variables públicas del cliente. No se requiere Storage de fotografías ni un segundo backend. La implementación sigue a cargo de los trabajadores.

## Matriz de requisitos y evidencia

| Requisito | Tarjetas / responsable actual | Criterio de aceptación |
| --- | --- | --- |
| Base y configuración reproducible | KAN-10/11/13/14/15 — Sergionix | README, dependencias, configuración de ejemplo sin secretos; persistencia limitada a usuarios y paquetes; validaciones y errores. No exigir eventos/fotos/rutas. |
| JWT y ADMIN/USER | KAN-18/19/20/21 — Sergionix | Login real; creación solo ADMIN; consulta autenticada; pruebas sin token, token inválido y rol incorrecto. Permisos en servidor, no solo ocultar botones. |
| Interfaz de acceso y consulta | KAN-16/35/38/39 — Maximo Aguilar | Login y consulta por guía con resultados y errores claros; API protegida. Sin recuperación, destinatario anónimo, historial logístico ni estados. |
| Creación y guía única | KAN-23/24 — Juan Deluquez; KAN-27 — Sergionix | Crear y consultar el mismo paquete persistido; guía única y copiable; rechazar entradas inválidas. Edición no obligatoria. |
| Unitarias y cobertura ≥80% | KAN-29 — Juan Deluquez; apoyo KAN-21/35 | Medición sobre el módulo implementado, incluyendo lógica y autorización; reportes originales de ejecución y cobertura. No reducir artificialmente el denominador. Sin pruebas de sincronización. |
| CI/CD automático | KAN-12 — Humberto T; KAN-55 — Sergionix | Push o PR a rama principal: pruebas → build → despliegue automático a entorno de prueba. YAML, ejecución exitosa y URL/instrucciones verificables. Build sin deployment no cumple. Docker opcional. |
| SonarQube | KAN-54 — Sergionix | Community Build o equivalente con dashboard, métricas disponibles, al menos un hallazgo interpretado, corrección o justificación de falso positivo y evidencia. Extensión del IDE sola no cumple. Sustituye métricas operativas. |
| OWASP ZAP | KAN-51 — Humberto T | Reporte inicial, tabla de hallazgos (riesgo/endpoint/evidencia/acción), corrección relevante cuando sea razonable, segundo análisis cuando sea posible y conclusión. Documentar límites de autenticación; automatizar JWT en ZAP es opcional. Escaneo activo solo en entorno propio autorizado. |
| Demostración básica | KAN-52/53 — Humberto T | Recorrido crear/consultar, roles, móvil y clonación reproducible. Sin E2E logístico completo, carga de 100 usuarios ni SLA. |
| Informe y paquete final | KAN-57 — Humberto T | PDF/Word: plan vs realidad, desviaciones, lecciones concretas, resultados, mejora medible y una innovación pertinente. ZIP: fuente/configuración, YAML, reportes originales, capturas de pipeline/despliegue, README y entorno de ejemplo sin secretos. |
| Alcance y coordinación | KAN-58 — al07098284; KAN-59 — Sergionix | Relacionar cada requisito con evidencia y dueño, conservar fecha final y registrar pendientes reales. Revisar evidencia antes de cerrar. |

La innovación se propone como trabajo futuro; no obliga a construir el simulador antes del 25.

## Trabajo retirado de esta entrega

Jira confirmó el cambio de **36 tarjetas a Fuera de alcance**. Se conserva trazabilidad; no se borra código existente ni se marca trabajo como implementado.

- KAN-17: registro público; usar cuentas de demostración preparadas.
- KAN-28/49: funcionamiento offline y sincronización.
- KAN-31/44/45/46/47/48/50: cámara, fotos, firma y pruebas de evidencia.
- KAN-34/37/40: operación de repartidor, transiciones e historial logístico avanzado.
- KAN-41/42/43: mapas, notificaciones y sus pruebas.
- KAN-56: piloto formal; se conserva verificación básica del módulo.
- KAN-60/61/62/63/64: checkpoints, panel de asignación, incidencias, auditoría operativa y enlace de destinatario. **Roles y operación ADMIN siguen obligatorios en KAN-19/21.**
- KAN-65 a KAN-78: épico y 13 tareas de simulación internacional, 50 países, 269 centros y 2,450 pares. Propuesta futura.

También quedan fuera los objetivos de 100 usuarios concurrentes, p95 de 2 segundos y SLA de producción. QR/escaneo, transportistas reales, pagos y Android/Kotlin permanecen excluidos de esta web. KANBAN.md, kanban-data.json y kanban.html son historia; RUTAS-SIMULADAS.md es una propuesta aplazada.

## Secuencia de cierre

1. **21 septiembre:** contrato mínimo, JWT/roles y configuración; matriz de evidencia.
2. **22 septiembre:** creación y consulta integradas; probar ADMIN/USER y rechazos.
3. **23 septiembre:** cobertura ≥80% y pipeline con despliegue automático verificable.
4. **24 septiembre:** SonarQube y ZAP; interpretar, corregir, volver a analizar y guardar evidencia; verificación móvil y desde clon limpio.
5. **25 septiembre:** informe, mejora/innovación, ZIP y ejecución final del pipeline; revisión cruzada de evidencias.

Son hitos de coordinación, no trabajo terminado. Se conservan responsables y vencimiento del 25 en Jira; no se promete una hora no indicada.

## Estado verificado y límites

El checkpoint `7af9577` conserva la demo; `a978e36` guardó el plan anterior. La última verificación de código registró 6 pruebas correctas, TypeScript y build correctos. **No hay aquí evidencia de cobertura ≥80%, JWT real, Sonar, ZAP o despliegue automático completo.** El CI actual de pruebas/build requiere delivery. La demo usa localStorage y perfiles simulados, por lo que aún no satisface la rúbrica.

Esta revisión cambia planificación y Jira, no implementa tareas de los trabajadores. Los ejemplos de comandos de la rúbrica son referencias, no acciones ejecutadas aquí.

# Entrega académica — alcance vigente

Revisión del 21 de septiembre de 2026 basada en la [rúbrica del usuario](RUBRICA-ENTREGA.txt). Sustituye el alcance ampliado del 20 de septiembre. Fecha final: **25 de septiembre de 2026**, America/Mexico_City; hora no indicada. [Jira KAN](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2) conserva responsables, estados y fechas.

## Un módulo terminado

Implementar **creación y consulta de paquetes por guía**, mediante la web React y su backend. ADMIN crea paquetes; USER y ADMIN autenticados consultan los paquetes permitidos. El servidor valida JWT y permisos: sin token se rechaza la operación protegida y USER no puede crear. Cuentas ficticias preparadas son suficientes; registro público y recuperación de contraseña no son necesarios.

Se mantiene React/Vite y la decisión previa de aprovechar Supabase Auth/Postgres, reducida a autenticación y persistencia de usuarios/paquetes. El responsable deberá demostrar JWT real, validación en servidor y rol confiable; un selector de perfil no cumple. Claves de firma y credenciales privilegiadas van en configuración segura/secretos, nunca en código o variables públicas del cliente. No se requiere Storage de fotografías ni un segundo backend. La implementación sigue a cargo de los trabajadores.

## Responsables por función — reparto revisado

Cambio solicitado por el usuario el 21 de septiembre: retirar todas las asignaciones de al07098284, dar a Maximo el grupo de menor complejidad técnica y mantener cada función completa con su dueño. Se mantienen 26 tarjetas activas, todas con vencimiento 25 de septiembre.

| Responsable | Tarjetas | Función completa |
| --- | --- | --- |
| Sergionix | 9: KAN-11/15/16/18/19/20/21/52/53 | Base e integración; login, JWT, roles, sesión y sus tests; verificación del recorrido integrado y móvil. |
| Juan Deluquez | 8: KAN-14/23/24/27/29/35/38/39 | Módulo de paquetes completo: persistencia, formulario/API de creación, guía, interfaz/API de consulta, errores y tests. |
| Humberto T | 5: KAN-12/13/51/54/55 | Configuración, CI/CD y deployment; SonarQube y ZAP con revisión de resultados. |
| Maximo Aguilar | 4: KAN-10/57/58/59 | README/reproducibilidad, matriz de rúbrica, coordinación e informe/ZIP final. Grupo de menor complejidad técnica. |
| al07098284 | 0 | Retirado de las asignaciones del proyecto. KAN-78 excluida queda sin asignar. |

El reparto busca coherencia y esfuerzo razonable, no igualdad matemática de tarjetas. No existen estimaciones de horas verificadas. Sergionix conserva la carga adicional; Juan mantiene creación y consulta juntas para no dividir el módulo. Las descripciones de las 26 tarjetas contienen objetivo, pasos, dependencias y evidencia de cierre.

## Matriz de requisitos y evidencia

| Requisito | Dueño y tarjetas | Evidencia de cierre |
| --- | --- | --- |
| Base y contratos comunes | Sergionix KAN-11/15 | Cliente/backend arrancables; contrato de paquete, usuario autenticado y errores documentados. |
| JWT, ADMIN/USER, login y sesión | Sergionix KAN-16/18/19/20/21 | Validación en servidor; creación solo ADMIN, consulta autenticada y autorizada; pruebas de token ausente/inválido/vencido, rol incorrecto, logout y acceso ajeno. Claves privadas fuera de código. |
| Persistencia, creación y guía | Juan KAN-14/23/24/27 | Cambios reproducibles; formulario y API; propietario; guía única garantizada en persistencia; validación/colisiones; guía mostrada y copiable. |
| Consulta completa | Juan KAN-35/38/39 | API e interfaz protegidas; resultado persistido correcto, errores de guía/conexión y acceso no permitido; tests propios. |
| Unitarias y cobertura ≥80% | Juan KAN-29 integra sus tests y los de Sergionix KAN-21 | Reportes originales del módulo completo, sin excluir lógica para inflar cobertura. Cada dueño escribe y corrige tests de su función. |
| CI/CD y entorno | Humberto KAN-12/13/55 | Push o PR a rama principal: pruebas → build → despliegue automático; YAML, secretos seguros, ejecución exitosa, versión y URL/instrucciones verificables. No basta build local. |
| SonarQube | Humberto KAN-54 | Dashboard global, métricas disponibles, hallazgo interpretado, corrección o falso positivo justificado y evidencia; IDE solo insuficiente. |
| OWASP ZAP | Humberto KAN-51 | Reporte inicial, tabla riesgo/endpoint/evidencia/acción, corrección razonable y segundo análisis cuando sea posible; límites JWT documentados. Solo entorno propio autorizado. |
| Integración y móvil | Sergionix KAN-52/53 | Recorrido login/crear/copiar/consultar/logout y rechazos; evidencia móvil 320–430 px y defectos resueltos por su dueño. Sin E2E logístico completo ni carga/SLA. |
| README y reproducción | Maximo KAN-10 | Instrucciones reales para instalación, entorno, ejecución, tests y análisis; otra persona verifica desde clon limpio. |
| Informe y ZIP | Maximo KAN-57 | PDF/Word: plan vs realidad, desviaciones, lecciones, resultados, mejora medible e innovación. ZIP fuente/configuración, YAML, reportes originales y capturas CI/deploy; sin secretos. |
| Matriz y coordinación | Maximo KAN-58/59 | Cada requisito ligado a dueño/tarjeta/evidencia de la versión; brechas explícitas, bloqueos y checklist de cierre. |

## Reglas de colaboración

1. Sergionix entrega a Juan el contrato de usuario/rol/errores; Juan entrega el esquema y contrato de paquetes. Humberto acuerda con ambos variables y comandos para el entorno.
2. Juan implementa y prueba tanto creación como consulta. Sergionix implementa y prueba acceso/sesión. No transferir la mitad de una función a otra persona para igualar números.
3. Juan agrega el reporte de cobertura, pero cada dueño corrige los tests y código de su función. Humberto consume el mismo comando en CI.
4. Humberto ejecuta Sonar/ZAP y corrige configuración de entrega; cualquier defecto de aplicación se entrega al dueño de esa función, que lo corrige y devuelve evidencia para repetir análisis.
5. Maximo recopila documentación y resultados reales de todos. Su grupo exige verificar evidencia y redactar el cierre; no inventar resultados ni afirmar ejecución por tener archivos de configuración.
6. Verificar dependencias antes de empezar y adjuntar commit/PR o versión, pasos y resultados antes de cerrar tarjetas. Los enlaces en descripciones expresan coordinación; no se afirma que sean bloqueos formales de Jira.

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

Son hitos de coordinación, no trabajo terminado. Se actualizan responsables según el reparto anterior y se conserva el vencimiento del 25 en Jira; no se promete una hora no indicada.

## Estado verificado y límites

El checkpoint `7af9577` conserva la demo; `a978e36` guardó el plan anterior. La última verificación de código registró 6 pruebas correctas, TypeScript y build correctos. **No hay aquí evidencia de cobertura ≥80%, JWT real, Sonar, ZAP o despliegue automático completo.** El CI actual de pruebas/build requiere delivery. La demo usa localStorage y perfiles simulados, por lo que aún no satisface la rúbrica.

Esta revisión cambia planificación y Jira, no implementa tareas de los trabajadores. Los ejemplos de comandos de la rúbrica son referencias, no acciones ejecutadas aquí.

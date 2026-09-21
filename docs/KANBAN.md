# Kanban - Milenio Express

> **Referencia histórica del plan inicial.** Desde el 20 de septiembre de 2026, consultar [PLAN-ENTREGA.md](PLAN-ENTREGA.md) para alcance, backend, responsables, fecha final y secuencia unificada. Jira KAN es la fuente operativa. Las frases «sin asignar», «por acordar» y los estados de este archivo describen la captura original, no la situación actual. La fecha final vigente es el **25 de septiembre de 2026**.

Prototipo web para celular. Seguimiento por número de guía; sin QR, códigos de barras ni escaneo. Evidencia mediante fotografía.

## Alcance y uso

Plan inicial basado en el código actual y en los requisitos de referencia, con los cambios solicitados por el usuario. Los requisitos restantes se mantienen; ME-01 permite ajustar formalmente los objetivos no funcionales a la evaluación académica. No se han asignado responsables ni fechas.

- P0: base necesaria o cierre de entrega. P1: funcionalidades y validación. La dependencia manda sobre la prioridad.
- Flujo: Pendiente - Listo para iniciar - En curso - En revisión - Terminado.
- Listo: requisitos claros y dependencias resueltas. En curso: trabajo realmente iniciado; límite sugerido de 2 tareas por equipo.
- En revisión: implementación y evidencia disponibles. Terminado: criterio cumplido, prueba o revisión realizada, documentación actualizada y aceptación del equipo.
- Las seis tarjetas BASE describen únicamente lo verificado en la demo local; no dan por terminada la versión con backend.
- Foto suficiente para evidencia. Firma digital, QR, códigos de barras, escaneo, pagos y app nativa quedan fuera del plan. No se implementan servicios de paquetería reales.

El tablero interactivo está en `docs/kanban.html`. Guarda movimientos y responsables en el navegador y permite exportar JSON. Esos movimientos no modifican este documento ni `kanban-data.json`; estos archivos conservan el plan inicial.

## Vista por columnas

### Pendiente

- **ME-04 - P0** - Modelar usuarios, paquetes, eventos y evidencias
- **ME-05 - P0** - Registro, inicio y cierre de sesión
- **ME-06 - P0** - Permisos reales y envíos por usuario
- **ME-07 - P0** - Conectar registro y consulta con datos compartidos
- **ME-08 - P0** - Guardar cambios de estado y evitar duplicados
- **ME-09 - P0** - Guardar fotos de entrega con acceso restringido
- **ME-12 - P1** - Consulta del destinatario mediante enlace seguro
- **ME-13 - P1** - Registrar checkpoints y última ubicación
- **ME-14 - P1** - Mostrar mapa y estado sin ubicación
- **ME-15 - P1** - Avisos de cambios y preferencias del usuario
- **ME-16 - P1** - Administrar roles y asignar repartidores
- **ME-17 - P1** - Registrar y resolver incidencias de entrega
- **ME-18 - P1** - Consultar auditoría de cambios y accesos
- **ME-19 - P1** - Resolver almacenamiento y trabajo sin conexión
- **ME-20 - P1** - Revisar experiencia móvil y accesibilidad
- **ME-21 - P0** - Automatizar pruebas del flujo completo
- **ME-22 - P0** - Publicar una versión de prueba con HTTPS
- **ME-23 - P1** - Validar rendimiento y requisitos no funcionales
- **ME-24 - P1** - Prueba con usuarios y corrección de hallazgos
- **ME-25 - P1** - Actualizar documentación y evidencia académica
- **ME-26 - P0** - Preparar exposición y cerrar versión final

### Listo para iniciar

- **ME-01 - P0** - Actualizar alcance y criterios de la entrega
- **ME-02 - P0** - Asignar responsables y ordenar la entrega
- **ME-03 - P0** - Elegir dónde guardar datos y ejecutar el backend
- **ME-10 - P1** - Mejorar captura de fotografía en celular
- **ME-11 - P1** - Facilitar búsqueda y copia del número de guía

### En curso

Sin tareas: no se presume trabajo en curso ni en revisión.

### En revisión

Sin tareas: no se presume trabajo en curso ni en revisión.

### Terminado

- **BASE-01 - Base** - Interfaz web adaptable y navegación
- **BASE-02 - Base** - Perfiles simulados de cliente y repartidor
- **BASE-03 - Base** - Registro local y guía única
- **BASE-04 - Base** - Rastreo, historial y estados locales
- **BASE-05 - Base** - Entrega local con foto y receptor
- **BASE-06 - Base** - Pruebas unitarias y configuración de CI

## Criterios de cada tarjeta

### ME-01 - Actualizar alcance y criterios de la entrega

**Estado:** Listo para iniciar - **Prioridad:** P0 - **Área:** Planeación

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Actualizar el documento del proyecto y las historias: web para celular, consulta por guía escrita, sin QR ni escaneo, foto como evidencia. Acordar si los objetivos de carga, disponibilidad y funcionamiento sin conexión del PDF se evalúan en la materia; registrar la decisión y el alcance final.

### ME-02 - Asignar responsables y ordenar la entrega

**Estado:** Listo para iniciar - **Prioridad:** P0 - **Área:** Planeación

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Cada tarea pendiente tiene una persona responsable y un orden de trabajo. Acordar fecha de entrega y fechas objetivo; limitar a dos tareas en curso por equipo. No inventar fechas ni asignaciones.

### ME-03 - Elegir dónde guardar datos y ejecutar el backend

**Estado:** Listo para iniciar - **Prioridad:** P0 - **Área:** Datos

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Documentar una sola solución para usuarios, paquetes, eventos y fotos, su configuración local y de prueba, límites y variables necesarias. Aprovechar el repositorio existente y conservar un modo demo reproducible.

### ME-04 - Modelar usuarios, paquetes, eventos y evidencias

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Datos

**Dependencias:** ME-03. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Crear el modelo persistente con propietario, repartidor asignado, guía única, estado, eventos con fecha/actor, evidencia y ubicación opcional. Aplicar cambios reproducibles y preparar datos ficticios de prueba; no guardar todo como una lista global compartida.

### ME-05 - Registro, inicio y cierre de sesión

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Acceso

**Dependencias:** ME-04. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** El cliente puede registrarse, iniciar sesión y salir; la sesión se recupera al recargar y las credenciales incorrectas muestran un error. El registro público no permite convertirse en repartidor o administrador.

### ME-06 - Permisos reales y envíos por usuario

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Acceso

**Dependencias:** ME-05. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** El backend comprueba cliente, repartidor y administrador. Un cliente solo ve sus envíos; un repartidor solo modifica los asignados; probar peticiones directas y acceso a guías ajenas, además de ocultar botones.

### ME-07 - Conectar registro y consulta con datos compartidos

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Paquetes

**Dependencias:** ME-04, ME-06. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Registrar un paquete y consultarlo desde otro dispositivo con la cuenta autorizada. Validar campos y guía única en el servidor; manejar carga, errores y reintento. Asociar remitente, destinatario y repartidor.

### ME-08 - Guardar cambios de estado y evitar duplicados

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Paquetes

**Dependencias:** ME-07. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Guardar cada transición y su evento de forma atómica con hora y actor verificables. Repetir una solicitud o hacer doble clic no crea eventos extra; rechazar saltos, retrocesos y nuevas entregas de un paquete entregado.

### ME-09 - Guardar fotos de entrega con acceso restringido

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Entregas

**Dependencias:** ME-08. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Validar imagen y tamaño, guardar la foto fuera de localStorage y permitir su lectura solo a usuarios autorizados. Registrar receptor y evidencia antes de confirmar entrega; un fallo de subida no cambia el estado. Probar rechazo de archivos inválidos y acceso ajeno.

### ME-10 - Mejorar captura de fotografía en celular

**Estado:** Listo para iniciar - **Prioridad:** P1 - **Área:** Entregas

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Permitir cámara o galería cuando el navegador lo soporte, mostrar vista previa, reemplazar imagen y comprimir fotografías grandes. Probar cancelación, permiso rechazado y error de archivo sin perder el formulario.

### ME-11 - Facilitar búsqueda y copia del número de guía

**Estado:** Listo para iniciar - **Prioridad:** P1 - **Área:** Seguimiento

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Agregar copia accesible de la guía con alternativa si el portapapeles falla. Validar búsqueda vacía, espacios, minúsculas y guía inexistente; mejorar búsqueda del historial sin usar cámara ni códigos gráficos.

### ME-12 - Consulta del destinatario mediante enlace seguro

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Seguimiento

**Dependencias:** ME-06, ME-07. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Permitir un enlace revocable y con vencimiento para consultar seguimiento sin cuenta. Mostrar solo estado y recorrido necesarios; no revelar dirección completa, contacto ni fotografía privada. Probar enlaces inválidos, vencidos y revocados.

### ME-13 - Registrar checkpoints y última ubicación

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Ubicación

**Dependencias:** ME-08. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** El repartidor autorizado registra ubicación o punto de control con fecha. La geolocalización pide permiso solo al usarla y tiene alternativa manual; distinguir ubicación real de datos simulados y mostrar cuándo se obtuvo.

### ME-14 - Mostrar mapa y estado sin ubicación

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Ubicación

**Dependencias:** ME-13. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Mostrar el último punto disponible en un mapa móvil, con fecha y texto alternativo. Si no hay coordenadas, conexión o proveedor, mostrar una explicación y conservar el seguimiento. No simular movimiento en tiempo real como si fuera real.

### ME-15 - Avisos de cambios y preferencias del usuario

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Avisos

**Dependencias:** ME-08, ME-06. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Crear avisos de cambios relevantes y entrega para el cliente autorizado, con leídos/no leídos y preferencias. Acordar el canal para destinatarios autorizados según alcance; diferenciar claramente avisos dentro de la app de push o correo si estos no se implementan.

### ME-16 - Administrar roles y asignar repartidores

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Administración

**Dependencias:** ME-06, ME-07. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Un administrador puede consultar usuarios, asignar roles permitidos y distribuir paquetes. Los otros perfiles no acceden; cambios de rol y asignación quedan auditados. Preparar una cuenta administradora de prueba sin permitir autoasignación pública.

### ME-17 - Registrar y resolver incidencias de entrega

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Administración

**Dependencias:** ME-08, ME-16. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** El repartidor puede reportar destinatario ausente, dirección incorrecta o paquete dañado con nota y fecha. El administrador consulta y resuelve la incidencia; una entrega fallida no marca el paquete como entregado ni elimina su historial.

### ME-18 - Consultar auditoría de cambios y accesos

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Administración

**Dependencias:** ME-16, ME-17. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** El administrador filtra eventos por paquete, usuario y fecha, incluidos cambios de estado, roles, asignaciones e incidencias. Registrar accesos relevantes sin contraseñas ni tokens; la auditoría no es editable desde la app.

### ME-19 - Resolver almacenamiento y trabajo sin conexión

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Conectividad

**Dependencias:** ME-01, ME-08, ME-09. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Si RF-10 se conserva, guardar operaciones pendientes y reintentar al recuperar conexión, con identificadores estables, estados visibles y resolución de conflictos sin duplicar eventos. Si se excluye para la materia, documentar la exclusión aprobada y avisar claramente de operaciones no guardadas. Siempre manejar almacenamiento lleno o bloqueado.

### ME-20 - Revisar experiencia móvil y accesibilidad

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Calidad

**Dependencias:** ME-09, ME-11, ME-14, ME-15, ME-18. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Probar formularios, navegación, carga, errores y estados vacíos entre 320 y 430 px, teclado visible y orientación horizontal. Revisar etiquetas, foco, contraste, tamaño de controles y texto largo; probar al menos Android Chrome y otro navegador disponible.

### ME-21 - Automatizar pruebas del flujo completo

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Calidad

**Dependencias:** ME-09, ME-12, ME-15, ME-18, ME-19. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Cubrir registro/login, permisos, alta, seguimiento, estados, evidencia, avisos y administración, incluyendo fallos. Agregar pruebas de integración y navegador a las unitarias existentes; usar datos aislados y asegurar que CI rechace pruebas fallidas.

### ME-22 - Publicar una versión de prueba con HTTPS

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Entrega

**Dependencias:** ME-03, ME-07, ME-09. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Preparar URL de prueba accesible desde celular fuera de la red local, variables de entorno y rutas directas que soporten recarga. Verificar que no se incluyan secretos, que el backend acepte el origen correcto y que la demo pueda restablecerse con datos ficticios.

### ME-23 - Validar rendimiento y requisitos no funcionales

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Calidad

**Dependencias:** ME-01, ME-20, ME-21, ME-22. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Medir tiempos de consulta y tamaño de imágenes en la versión publicada. Si se mantienen las metas del PDF, probar p95 ≤ 2 s con 100 usuarios, TLS y disponibilidad durante una ventana definida; registrar herramienta, entorno y resultados, sin afirmar cumplimiento no medido.

### ME-24 - Prueba con usuarios y corrección de hallazgos

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Calidad

**Dependencias:** ME-20, ME-21, ME-22. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Observar tareas de consulta y entrega con participantes, registrar tiempo y dificultades, y abrir/cerrar tarjetas por cada defecto. Si se conserva la meta del PDF, verificar 8 de 10 consultas en menos de 60 segundos sin ayuda. Obtener aceptación del equipo responsable.

### ME-25 - Actualizar documentación y evidencia académica

**Estado:** Pendiente - **Prioridad:** P1 - **Área:** Entrega

**Dependencias:** ME-01, ME-21, ME-23, ME-24. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Entregar README, arquitectura real, modelo de datos, historias y matriz requisito→pantalla→prueba. Adjuntar resultados, capturas y limitaciones, y explicar qué es demo. El documento final no debe prometer Kotlin, MySQL, QR o escaneo si no forman parte de la entrega.

### ME-26 - Preparar exposición y cerrar versión final

**Estado:** Pendiente - **Prioridad:** P0 - **Área:** Entrega

**Dependencias:** ME-22, ME-25. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Ensayar cliente, repartidor y administrador con cuentas/datos ficticios; incluir alta→seguimiento→entrega con foto, incidencias y avisos. Subir la versión revisada al repositorio, comprobar CI remoto y preparar respaldo local y guion por integrante.

### BASE-01 - Interfaz web adaptable y navegación

**Estado:** Terminado - **Prioridad:** Base - **Área:** Ya disponible

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Interfaz existente revisada a 390 px. La validación móvil ampliada permanece en ME-20.

### BASE-02 - Perfiles simulados de cliente y repartidor

**Estado:** Terminado - **Prioridad:** Base - **Área:** Ya disponible

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Selección local y restricción de rutas operativas. Las cuentas y permisos reales permanecen en ME-05 y ME-06.

### BASE-03 - Registro local y guía única

**Estado:** Terminado - **Prioridad:** Base - **Área:** Ya disponible

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Formulario validado y guía aleatoria con comprobación de duplicados. Datos compartidos pendientes en ME-07.

### BASE-04 - Rastreo, historial y estados locales

**Estado:** Terminado - **Prioridad:** Base - **Área:** Ya disponible

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Detalle por guía, filtros, estados secuenciales y eventos locales. Persistencia multiusuario pendiente en ME-08.

### BASE-05 - Entrega local con foto y receptor

**Estado:** Terminado - **Prioridad:** Base - **Área:** Ya disponible

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Foto y receptor persistidos en navegador; recorrido verificado tras recarga. Almacenamiento remoto pendiente en ME-09.

### BASE-06 - Pruebas unitarias y configuración de CI

**Estado:** Terminado - **Prioridad:** Base - **Área:** Ya disponible

**Dependencias:** Ninguna. **Responsable:** sin asignar. **Fecha:** por acordar.

**Termina cuando:** Seis pruebas, TypeScript y compilación verificados localmente en la entrega anterior. Workflow creado; ejecución remota y pruebas ampliadas pendientes en ME-21 y ME-26.

## Orden sugerido de trabajo

1. Cerrar alcance, repartir tareas y decidir persistencia (ME-01 a ME-03). ME-10 y ME-11 pueden avanzar de forma independiente.
2. Completar datos, acceso y flujo de paquetes/entrega (ME-04 a ME-09).
3. Completar seguimiento compartido, ubicación, avisos y administración (ME-12 a ME-19). Preparar publicación de prueba (ME-22).
4. Validar experiencia móvil, automatización, rendimiento y uso real (ME-20, ME-21, ME-23 y ME-24).
5. Consolidar documentación y ensayar la entrega (ME-25 y ME-26).

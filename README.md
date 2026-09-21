# Milenio Express

Prototipo académico de seguimiento de paquetes construido con React, TypeScript y Vite. El entregable acordado es una **app web que funcione en celular**.

## Ejecutar

Requisitos: Node.js 24 o posterior y pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abre http://localhost:8443. Para entrar desde un celular conectado a la misma red, usa la dirección IP local de la computadora y el puerto 8443, si el firewall lo permite.

```sh
pnpm test
pnpm typecheck
pnpm build
```

`pnpm preview` sirve la compilación de `dist/`. El servidor de desarrollo y el de vista previa usan el mismo puerto; ejecuta solo uno a la vez.

## Guion de demostración

1. Entra como **repartidor**. Hay dos paquetes ficticios iniciales con guías `ME-8472-1903` y `ME-1294-8816`.
2. Registra un paquete con destinatario, dirección, ciudad y descripción. Copia la guía que aparece en el detalle.
3. Avanza de **Registrado → En tránsito → En reparto**. Cada paso conserva fecha y responsable.
4. Confirma la entrega con nombre del receptor y una imagen JPG, PNG o WebP de hasta 1 MB. Puedes usar una fotografía ficticia preparada para la exposición.
5. Comprueba la evidencia y el evento **Entregado**, y revisa el filtro del historial.
6. En Perfil, cambia a **cliente**. Busca la misma guía: el cliente consulta el estado y la evidencia, pero no puede registrar ni entregar paquetes.
7. Recarga la página para comprobar la persistencia. En Perfil puedes restablecer los ejemplos para otra exposición; se pide confirmación porque elimina los datos locales.

## Qué está implementado

- Selección explícita de dos perfiles de demostración, con protección de rutas operativas.
- Registro validado y guía aleatoria con comprobación de duplicados.
- Rastreo por número, detalle correcto por paquete y errores para guías inexistentes.
- Historial filtrado y cambios de estado secuenciales con fecha y actor.
- Evidencia fotográfica y validación de receptor antes de entregar; rechazo de entregas repetidas.
- Persistencia local y manejo de errores de almacenamiento.
- Pruebas automatizadas y workflow de CI para pruebas, TypeScript y compilación.

## Alcance y pendientes del documento

El plan vigente está en [Plan de entrega](docs/PLAN-ENTREGA.md): fecha final **25 de septiembre de 2026**, criterios de aceptación, decisión de backend, responsables y orden de integración, limitado a creación y consulta con JWT, ADMIN/USER, cobertura ≥80%, CI/CD, SonarQube, ZAP e informe final. [Jira KAN](https://milenioexpress-sergionix.atlassian.net/jira/software/projects/KAN/boards/2) es la fuente de estados y asignaciones. El [Kanban local](docs/KANBAN.md) y su [tablero interactivo](docs/kanban.html) son referencias históricas, sin sincronización con Jira.

Se decidió usar Supabase para la versión compartida. Es una decisión de planificación: esta demo continúa usando almacenamiento local; la implementación corresponde a las tareas asignadas.

El PDF describe un alcance mayor (Android/Kotlin, Firebase y MySQL), mientras que el repositorio original contiene React y archivos de Supabase. El usuario confirmó que el entregable es un prototipo web para celular. Esta versión mantiene React y proporciona una demostración local.

| Requisito de referencia | Estado de esta versión |
| --- | --- |
| Acceso y roles | Perfiles simulados; falta autenticación real y administrador |
| Registro y guía | Registro y número único; consulta por guía escrita |
| QR, códigos de barras y escaneo | Fuera del alcance por decisión del usuario |
| Estados, seguimiento e historial | Funcionales con datos locales |
| Evidencia | Foto existente en el navegador; fotos compartidas y firma fuera de esta entrega |
| Mapas y notificaciones | Fuera de esta entrega según la rúbrica |
| Sincronización sin duplicados | Sin backend ni sincronización entre dispositivos |
| Administración y auditoría | Operación ADMIN obligatoria; panel de asignación y auditoría fuera de alcance |
| Plataforma | Web adaptable a celular, conforme al formato confirmado |

Los perfiles no son una frontera de seguridad: se pueden cambiar desde la interfaz y el navegador controla los datos. No hay cuentas, aislamiento entre clientes ni enlaces seguros. No se envían fotos ni paquetes a servicios externos. Todos los perfiles de una misma instalación local ven los mismos ejemplos. No utilizar datos personales reales.

Los cambios locales funcionan sin llamadas a una API una vez cargada la app, pero todavía no existe caché instalable para abrirla sin conexión. `localStorage` tiene capacidad limitada y no comparte datos entre dispositivos; las fotos grandes o numerosas pueden llenar ese espacio. Los errores de escritura se muestran sin confirmar una operación fallida.

## Organización

- `src/App.tsx`: pantallas, navegación y captura de fotografía.
- `src/lib/demo.ts`: tipos, reglas de negocio y almacenamiento de demostración.
- `src/index.css`: diseño adaptable y estilos existentes.
- `tests/demo.test.ts`: validación, roles, estados, evidencia y almacenamiento.
- `src/lib/supabase.ts` y `supabase/`: integración heredada, no utilizada por esta demo. El servidor versionado solo implementa `/health`; no desplegarlo como backend completo.

El ZIP proporcionado contiene ejercicios Java/JUnit sobre estacionamiento y nombres de usuario, independientes de Milenio Express. Se conserva la separación: las pruebas de esta app verifican su dominio de paquetes.

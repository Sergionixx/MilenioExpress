# Milenio Express

Guía del proyecto académico en la rama `dev-maxi`. Describe el módulo que existe en el código y distingue las propuestas futuras. El informe y las evidencias de calidad se consultan en [docs/INFORME_CIERRE.md](docs/INFORME_CIERRE.md).

Actualización posterior a la entrega académica: [interfaz renovada y registro público de cuentas](docs/ACTUALIZACION_INTERFAZ.md).

## 1. Funcionamiento de app

Milenio Express es una aplicación web adaptable a computadora y celular. Su módulo actual permite registrar un paquete, generar una guía y consultar los datos autorizados del envío. Se abre en un navegador; esta entrega no es una aplicación Android nativa ni genera un APK.

La pantalla de acceso permite **Crear cuenta** con nombre, correo y contraseña. Los perfiles nuevos nacen como USER; si el servicio exige confirmar el correo, se muestra ese paso antes de entrar. El acceso continúa con correo y contraseña mediante Supabase Auth. El servidor verifica el token de la sesión y consulta el rol guardado en la base de datos. El usuario no puede convertirse en administrador modificando la interfaz, enviando un campo `role` o alterando los metadatos de su cuenta.

| Perfil | Operaciones disponibles |
| --- | --- |
| ADMIN | Consultar propietarios, registrar paquetes para un propietario existente y consultar todos los paquetes. |
| USER | Consultar su perfil y los paquetes que le pertenecen, tanto en el listado como por número de guía. |
| Sin sesión | Abrir el acceso y crear una cuenta USER. La API rechaza la creación y las consultas protegidas. El endpoint de salud es público. |

**Registro de un paquete.** La persona con rol ADMIN abre «Registrar paquete», selecciona al propietario e introduce destinatario, dirección, ciudad y descripción. El formulario y el servidor comprueban los campos. La base de datos genera una guía con el formato `ME-AAAA-########`, garantiza su unicidad y guarda el paquete con estado `Registrado`. La pantalla de confirmación muestra la guía devuelta por el servidor y permite copiarla. Si el navegador impide usar el portapapeles, la guía queda seleccionable para copiarla manualmente.

**Consulta.** Una cuenta autenticada puede buscar la guía, abrir el detalle o revisar su listado. El detalle muestra destinatario, dirección, ciudad, descripción y el evento de registro. Para USER, conocer una guía ajena no concede permiso: el servidor comprueba quién es el propietario. ADMIN puede consultar cualquier paquete del módulo.

**Sesión y errores.** La aplicación recupera la sesión al recargar, ofrece cierre de sesión y oculta las pantallas protegidas cuando el servidor rechaza el acceso con `401`. Distingue falta de permiso, guía inexistente, campos incorrectos y fallos de conexión. Una operación que falla no se presenta como un registro exitoso.

El historial actual reúne los paquetes y su registro inicial. No implementa todavía un recorrido logístico completo con asignación de repartidores, recolección, tránsito, entrega, fotografías o firma. Tampoco se incluyen geolocalización, avisos, operación sin conexión ni pagos. Esas funciones requieren otra iteración y criterios propios.

La rama `feature/presentacion-interactiva` contiene trabajo de presentación independiente. Su README autorizado se utilizó como referencia de trabajo, pero esa presentación no se fusionó con `dev-maxi`. La entrega conserva el flujo académico de acceso, creación y consulta.

## 2. Idea de negocio, qué resuelve

La idea consiste en ofrecer una herramienta sencilla para que una operación de paquetería registre sus envíos y sus usuarios consulten información confiable mediante una guía. La necesidad que aborda es mantener juntos los datos del paquete y evitar que una consulta dependa exclusivamente de mensajes, hojas separadas o del recuerdo de quien hizo el registro. Se trata de la justificación del producto; no se presenta como una investigación de mercado ya realizada.

El valor del módulo está en tener un registro persistente, una referencia única y acceso según responsabilidades. La persona operadora captura el paquete una vez y obtiene su guía; el usuario consulta los datos que le corresponden. La separación de permisos también reduce la exposición innecesaria de direcciones y nombres de otras personas.

| Participante propuesto | Necesidad | Respuesta del módulo |
| --- | --- | --- |
| Personal de una operación de paquetería | Registrar y localizar paquetes de forma consistente. | Formulario con validación, guía única y consulta centralizada. |
| Persona usuaria del servicio | Recuperar la información de su paquete. | Consulta autenticada por guía y listado propio. |
| Equipo administrador | Separar funciones y controlar quién puede crear registros. | Roles ADMIN/USER y comprobación de propiedad en servidor. |

Un posible modelo futuro sería ofrecer el sistema como servicio a pequeñas operaciones de paquetería mediante una suscripción o soporte de instalación. Esa opción es una hipótesis: no se fijaron precios, ingresos, ahorro, número de clientes ni acuerdos comerciales. Primero se necesitaría validar el problema con usuarios, medir costos de operación y comprobar que el flujo les resulta útil.

Para validar la utilidad proponemos medir cuánto tarda una persona en registrar y recuperar un paquete, cuántas consultas fallan por capturar mal la guía y cuántas solicitudes de ayuda necesita. Las métricas deben obtenerse con un piloto acordado y datos de prueba. Las pruebas técnicas de esta entrega verifican comportamiento del software, no rentabilidad ni aceptación del mercado.

Como evolución se propone una **guía con código QR** para reducir errores de transcripción. El QR contendría la referencia de la guía, sin dirección, nombre ni token. Abrirlo llevaría al mismo acceso y conservaría la validación de propiedad. La propuesta incluye un experimento medible en el informe de cierre; no se afirma que esté implementada.

## 3. Tecnicismos, herramientas, metodologías, etc.

La arquitectura separa la interfaz, las reglas del módulo y el acceso a datos. Esa separación permite probar permisos y validaciones sin depender de una pantalla o de credenciales productivas.

| Elemento | Herramienta o concepto | Uso en Milenio Express |
| --- | --- | --- |
| Interfaz | React, TypeScript y React Router | Pantallas, componentes, navegación y estado de sesión. |
| Estilos y construcción | CSS, Tailwind CSS y Vite | Presentación adaptable y generación del directorio `dist`. |
| Autenticación | Supabase Auth y JWT | Inicio de sesión y verificación de identidad desde el servidor. |
| API | Edge Function con Deno; `Request`/`Response` estándar | Rutas HTTP, validación JSON, códigos de error y cabeceras. |
| Reglas | `domain.ts` y `service.ts` | Campos permitidos, formato de guía, roles, propiedad y operaciones. |
| Persistencia | Supabase/PostgreSQL y `repository.ts` | Perfiles, paquetes, consultas y generación de guías. |
| Protección de datos | RLS, restricciones SQL y rol confiable | Limitar lecturas e inserciones aunque se consulte la base directamente. |
| Pruebas | Test runner y cobertura de Node.js | Casos unitarios y pruebas del contrato HTTP y del adaptador de datos. |
| Integración e interfaz | Supabase local y Playwright/Chromium | Verificación con Auth/PostgreSQL reales aislados, recorrido ADMIN/USER y capturas móviles. |
| Calidad estática | ESLint con SonarJS, TypeScript y jscpd | Revisión global de fuentes, problemas de mantenimiento y duplicación. |
| Seguridad dinámica | OWASP ZAP | Inspección de la aplicación en ejecución y comparación de hallazgos. |
| Colaboración | Git, GitHub y Jira | Versiones, revisión, trazabilidad de requisitos y tareas del equipo. |
| Automatización | GitHub Actions y contenedor de pruebas | Secuencia pruebas → construcción → despliegue verificable. |

**JWT y autorización.** Un JWT es un token firmado que representa una sesión. El navegador lo envía en `Authorization: Bearer …`; la API lo comprueba mediante Supabase Auth. Después obtiene el rol de `profiles`, no de campos enviados por el cliente. Autenticación significa comprobar quién hace la solicitud; autorización significa decidir si esa persona puede realizar la operación o consultar ese paquete.

**Persistencia y guías.** `profiles` se relaciona con las cuentas de autenticación. `shipments.owner_id` relaciona cada paquete con su propietario. Una secuencia y un trigger de PostgreSQL generan la guía; la restricción `UNIQUE` es la protección final contra duplicados. Las listas se consultan por páginas para no perder registros por el límite de respuesta de la base. Los datos de conexión privada se configuran en el servidor; las variables `VITE_…` son visibles en el navegador y nunca deben contener contraseñas o claves de servicio.

**Contrato de API.** La función utiliza el prefijo `/make-server-845b49a4`. `GET /me` obtiene el perfil, `GET /users` lista propietarios para ADMIN, `POST /shipments` crea un paquete, `GET /shipments` lista los permitidos y `GET /shipments/:guide` consulta uno. `GET /health` comprueba que la función responde. Los detalles de campos y permisos están en [el contrato del módulo](docs/CONTRATO_PAQUETES_ACCESO.md). El adaptador también rechaza métodos no admitidos con `405` y cuerpos JSON mayores de 16 KiB con `413`.

**Pruebas y cobertura.** La medición tiene un ámbito explícito: reglas, servicios, HTTP, repositorio y utilidades de acceso del módulo. La cifra no representa automáticamente toda la interfaz React, la infraestructura externa ni una auditoría de seguridad completa. El reporte original se conserva en [reportes/pruebas-unitarias](reportes/pruebas-unitarias). Las pruebas con un transporte simulado comprueban el contrato con Supabase. Por separado, `integration-supabase.mjs` verifica Auth, PostgreSQL, permisos y guías en servicios reales aislados; `ui-smoke.mjs` recorre las pantallas con cuentas ficticias y captura anchos de 320, 375 y 430 píxeles. Sus reportes conservan el resultado real y la versión ejecutada, sin publicar contraseñas ni JWT de sesión.

**Metodología y entrega.** El tablero Jira se usa como Kanban para relacionar tareas, responsables, dependencias y evidencias. No se atribuyen reuniones, sprints ni estimaciones históricas que no estén registrados. El trabajo actual se integra únicamente en `dev-maxi`; `main` queda sin modificar. El pipeline se diseña para impedir el despliegue si fallan las pruebas. El entorno de pruebas en un runner es temporal: un run exitoso y su artefacto no equivalen a una URL pública permanente ni a un despliegue nuevo de Supabase.

Para revisar los resultados, limitaciones, plan de mejora y evidencia de integración, consultar [el informe de cierre](docs/INFORME_CIERRE.md). Las instrucciones finales de reproducción y empaquetado deben acompañar los reportes de la misma versión entregada.

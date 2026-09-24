# Milenio Express — LA RAMA MAIN NO SE TOCA

Entrega académica de registro y consulta de paquetes. El trabajo y la publicación de esta entrega están en **`dev-maxi`**. `main` queda reservada para la revisión del equipo; no se modifica ni se fusiona automáticamente.

La referencia de coordinación solicitada fue el `README.md` de `feature/presentacion-interactiva`. Esa rama contiene una dinámica de exposición independiente. Esta entrega conserva el módulo académico de `dev-maxi` con correo/contraseña, JWT, ADMIN y USER. No reemplaza el backend compartido ni publica la presentación interactiva.

## Preparar y ejecutar

Requisitos: Node.js 24 y pnpm 10.34.3 (también declarados en `.mise.toml`).

```sh
git clone --branch dev-maxi https://github.com/Sergionixx/MilenioExpress.git
cd MilenioExpress
pnpm install --frozen-lockfile
pnpm dev
```

Abrir `http://localhost:8443`. El repositorio es privado: quien clone necesita acceso concedido por su propietario. El cliente conserva la URL y clave **pública** del Supabase existente. Para otro proyecto, copiar `.env.example` a `.env.local` y reemplazar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` por valores públicos reales del entorno de pruebas. No usar los marcadores de ejemplo literalmente.

Las cuentas se administran en Supabase Auth. Los perfiles nuevos nacen como USER; el rol ADMIN se asigna únicamente desde administración de la base. No existe un selector de rol que conceda privilegios. ADMIN registra paquetes para un perfil existente; USER consulta únicamente sus paquetes. La guía se genera en PostgreSQL, con una secuencia y restricción UNIQUE.

## Variables y backend

| Variable | Ubicación | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | Cliente, pública | URL del proyecto Supabase de pruebas |
| `VITE_SUPABASE_ANON_KEY` | Cliente, pública | Clave publishable/anon; no concede privilegios ADMIN |
| `SUPABASE_URL` | Función, servidor | URL para el acceso a datos |
| `SUPABASE_SERVICE_ROLE_KEY` | Secretos de Supabase | Credencial privada del servidor; nunca VITE, Git o ZIP |
| `ALLOWED_ORIGINS` | Función, servidor | Orígenes exactos separados por coma; sin configurar conserva compatibilidad `*` |
| `HOST`, `PORT` | Servidor de pruebas | Dirección de escucha y puerto; por defecto 127.0.0.1:4174 |

La firma y vigencia del JWT se verifican mediante `Supabase Auth.getUser(token)` antes de consultar el perfil. El rol proviene de `profiles`, nunca del cuerpo de la petición. RLS añade controles de propiedad en PostgreSQL. `verify_jwt=false` en la puerta de entrada permite `/health`; **no desactiva la autenticación en las rutas de datos**.

Código de backend en `supabase/functions/server/`; migración en `supabase/migrations/`. Contrato y matriz de acceso: [docs/CONTRATO_PAQUETES_ACCESO.md](docs/CONTRATO_PAQUETES_ACCESO.md). Las nuevas correcciones del servidor deben validarse en un Supabase aislado antes de promoverse al backend compartido, donde también vive la presentación de otra rama.

Para una réplica local completa se necesita Docker y [Supabase CLI 2.117.0](https://github.com/supabase/cli/releases/tag/v2.117.0), la versión fijada en CI. `supabase start` aplica las migraciones locales; `supabase functions serve make-server-845b49a4 --no-verify-jwt` sirve la función. `supabase status -o env` muestra las claves locales: no compartir ni guardar esa salida en Git. Configurar el cliente con API_URL/ANON_KEY locales. El pipeline crea ese entorno aislado para sus pruebas de integración.

Después de `supabase start`, `node scripts/run-local-integration.mjs` arranca la función y ejecuta las comprobaciones con cuentas ficticias; toma las claves efímeras directamente de la CLI y limpia los datos creados. Para usar el cliente contra ese backend HTTP local, utilizar `pnpm dev` o `pnpm build` seguido de `pnpm preview --host 127.0.0.1`. El servidor endurecido `pnpm serve` está configurado para conexiones HTTPS a Supabase Cloud; su CSP no permite conectar a otro puerto HTTP local.

El recorrido de navegador se añade con `MILENIO_UI_SMOKE=1 node scripts/run-local-integration.mjs`, después de instalar Chromium con `pnpm exec playwright install chromium`. CI instala también sus dependencias de sistema. La prueba crea un build temporal para Supabase local y conserva resultados y capturas en `reportes/integracion/` y `evidencias/ci-ui/`; no utiliza cuentas personales ni publica credenciales.

## Pruebas, compilación y despliegue de pruebas

```sh
pnpm test
pnpm test:coverage
pnpm typecheck
pnpm build
pnpm serve
```

`test:coverage` exige al menos 80% en líneas, ramas y funciones y genera TAP y LCOV en `reportes/pruebas-unitarias/`. El alcance es el **módulo API de creación/consulta con control de acceso y sus helpers declarados**: reglas de negocio, permisos, cliente HTTP, sesión, mensajes de acceso, handler HTTP y adaptador de datos. La cifra no representa cobertura de toda la interfaz React o del motor PostgreSQL.

El servidor del build abre `http://127.0.0.1:4174`, soporta rutas de la SPA y cabeceras CSP/anticlickjacking/nosniff. `node scripts/deployment-smoke.mjs` comprueba HTML, bundle, rutas y cabeceras. La alternativa reproducible es:

```sh
docker build -t milenio-pruebas .
docker run --rm -p 127.0.0.1:8080:8080 milenio-pruebas
```

El workflow [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) se ejecuta en push/PR a `main` o `dev-maxi`. Pruebas y typecheck son requisitos de construcción; construcción es requisito de despliegue. El despliegue ejecuta el artefacto construido en Docker en el runner de GitHub Actions y verifica sus respuestas. **Es un entorno efímero de pruebas:** termina con el job; no es una URL pública permanente. Los artefactos de pruebas, calidad, aplicación y despliegue duran 30 días; la entrega conserva además reportes locales verificables.

Consultar [Actions](https://github.com/Sergionixx/MilenioExpress/actions) filtrando `dev-maxi`. Cada ejecución identifica su commit. El pipeline no cambia otras ramas ni despliega funciones sobre el proyecto Supabase compartido.

## Calidad y seguridad

```sh
pnpm quality
ZAP_HOME=/ruta/a/ZAP_2.17.0 node scripts/zap-scan.mjs final http://127.0.0.1:4174/
```

El análisis global equivalente permitido por el PDF utiliza reglas recomendadas ESLint/SonarJS, tipos TypeScript, jscpd y cobertura real. Abrir `reportes/sonar/final.html`; métricas y limitaciones en [docs/CALIDAD.md](docs/CALIDAD.md). No se presenta como una instancia de SonarQube ni se inventan sus métricas exclusivas.

Los escaneos OWASP ZAP originales, comparación y procedimiento están en [docs/SEGURIDAD.md](docs/SEGURIDAD.md) y `reportes/seguridad-zap/`. Se ejecutan solo contra loopback propio. Los límites de autenticación y del alcance frontend se documentan; los endpoints protegidos se verifican por separado.

## Documentación y entrega

- [MILENIO_EXPRESS.md](MILENIO_EXPRESS.md): funcionamiento, idea de negocio y explicación técnica.
- [docs/INFORME_CIERRE.md](docs/INFORME_CIERRE.md): cierre, comparación, lecciones y plan de mejora.
- [docs/INFORME_CIERRE.pdf](docs/INFORME_CIERRE.pdf): informe exportado para entregar.
- [docs/MATRIZ_ENTREGA.md](docs/MATRIZ_ENTREGA.md): requisitos y evidencias, incluida cualquier validación pendiente.
- [docs/JIRA_EVIDENCIAS.md](docs/JIRA_EVIDENCIAS.md): tareas, evidencia y dependencias restantes.
- [entrega/entrega-final-milenio-express.zip](entrega/entrega-final-milenio-express.zip): paquete de entrega con manifiesto SHA-256; descargar con Git LFS.
- `reportes/`: originales de pruebas, calidad, integración y seguridad.
- `evidencias/`: comprobaciones de despliegue y de GitHub Actions.

No incluir `.env.local`, contraseñas, JWT de sesión, claves de servicio o secretos reales en la entrega. `.env.example` contiene únicamente marcadores públicos y comentarios. Las verificaciones históricas se identifican como históricas; una comprobación local automatizada no se atribuye a otro integrante del equipo.

Para regenerar el informe y el paquete se necesita Python 3 con ReportLab: `python3 scripts/build-delivery.py --zip entrega/entrega-final-milenio-express.zip`. El paquete permite acceder al código mediante el enlace del repositorio privado; el evaluador necesita acceso al repositorio. Las capturas y el ZIP usan Git LFS: `git lfs pull` recupera sus archivos completos después de clonar.

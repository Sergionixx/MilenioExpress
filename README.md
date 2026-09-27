# Milenio Express · Presentación pública

Rastreo y creación de paquetes ficticios para la dinámica de exposición. El módulo administrativo conserva la interfaz de `dev-maxi`, con acceso mediante correo/contraseña y operaciones de registro exclusivas ADMIN.

## Pantallas

- **Público:** `/` abre la presentación más reciente. `/presentacion/participar/:runId` fija una presentación concreta. Dos acciones: rastrear y crear paquetes, sin nombre obligatorio, cuenta, correo ni contraseña.
- **Mis paquetes:** muestra únicamente lo creado desde ese navegador. Supabase emite una identidad anónima al crear el primer paquete; no se crea identidad para rastrear. La sesión se guarda separada de la administrativa.
- **Administración:** `/admin`; las rutas anteriores de gestión siguen protegidas y sólo ADMIN entra al panel.
- **Organizador:** enlace privado `/presentacion/control#key=…`. Inicia una presentación y obtiene enlaces independientes para público y proyector.
- **Proyector:** enlace privado `/presentacion/pantalla/:runId#key=…`. Se actualiza cada dos segundos. Destaca cada guía y adapta filas/columnas a la cantidad de paquetes y altura de pantalla. Hasta 30 paquetes permanecen visibles sin scroll; más de 30 se rotan en páginas cada 12 segundos, con controles manuales.

Las guías nuevas se generan en el servidor con seis caracteres, omitiendo caracteres confusos. Se conserva la consulta de guías antiguas de cuatro dígitos. El índice UNIQUE impide duplicados por presentación; las colisiones se reintentan automáticamente. Los participantes no eligen ni envían la guía.

32 países y regiones comparten un catálogo de ciudades y aeropuertos con el servidor. Las cinco escalas muestran nombres como Almacén Madrid, Aeropuerto Madrid-Barajas o Aeropuerto de Hong Kong. Los trayectos son simulados y avanzan durante 90 segundos desde la fecha persistida del paquete; recargar no reinicia el recorrido.

## Ejecutar y verificar

Con Node 24 y pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test:coverage
pnpm exec tsc --noEmit
pnpm build
```

Las variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` pueden reemplazar el proyecto configurado. Nunca incluir claves de servicio u organizador en `VITE_`.

`pnpm test:live-guests` comprueba dos identidades, guías automáticas, rastreo público sin identidad, aislamiento de listas, RLS y rechazo de creación administrativa por espectadores. `pnpm test:ui-presentation` ejecuta el flujo real en tres navegadores y comprueba el proyector con 30 paquetes en 1280×720, 1366×768 y 1920×1080. Ambos requieren `MILENIO_ORGANIZER_KEY` en el entorno y crean presentaciones ficticias de prueba. La prueba de UI admite `MILENIO_UI_URL` y `MILENIO_BROWSER`; su navegador predeterminado es Edge en Windows.

28 unitarias pasan. Cobertura de los seis módulos declarados: 98.35% líneas, 96.43% ramas, 96.97% funciones; no equivale a cubrir toda la UI. [Evidencias de navegador](docs/evidencia/presentacion/resultados-ui.json).

## En línea

[Abrir la página pública](https://milenio-express-presentacion.lospollso123.chatgpt.site).
La publicación usa Sites y `.openai/hosting.json`, con fallback de rutas SPA. La función Edge y los datos permanecen en Supabase. [Orden para la exposición](docs/PRESENTACION_EN_LINEA.md) y [contrato del backend](supabase/README.md).

Esta actualización se trabaja en `codex/presentacion-publica`, derivada de `feature/presentacion-interactiva`. El `main` del repositorio del equipo y la entrega académica de `dev-maxi` no se fusionan automáticamente.

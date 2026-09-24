# 🚨 LA RAMA MAIN NO SE TOCA 🚨

## 📌 Reglas del Flujo de Trabajo (Git Workflow)

El equipo reserva `main` para cambios revisados por Sergionix mediante Pull Request. **No se deben hacer commits ni pushes directos a `main`.** Si GitHub no muestra una regla de protección activa para `main`, esta norma depende del flujo de trabajo del equipo.

### 🌳 Estructura de Ramas (Instrucciones para Desarrolladores e IAs)

El flujo de trabajo se divide en 3 niveles de ramas:

1. **`main` (Integración)**: Es la rama principal. Sergionix revisa y aprueba cada Pull Request (PR) antes de integrarlo.
2. **Ramas Principales por Colaborador** (`dev-[nombre-colaborador]`): Cada integrante del equipo debe crear y mantener una rama principal a su nombre (ej. `dev-juan`). Esta rama actúa como su entorno de integración personal.
3. **Ramas por Actividad/Tarea** (`feature/[nombre-tarea]`, `fix/[nombre-fix]`): Ramas efímeras para trabajar en tareas específicas. 

#### Diagrama de Ramas
```text
main (integración después de revisión de Sergionix)
│
├── dev-colaborador1 (Rama principal de integración del colaborador 1)
│   ├── feature/crear-login (Se hace push y merge hacia dev-colaborador1)
│   └── fix/error-botones (Se hace push y merge hacia dev-colaborador1)
│
├── dev-colaborador2 (Rama principal de integración del colaborador 2)
│   ├── feature/conexion-db
│   └── feature/diseno-home
```

## Iniciar el módulo académico

1. Instalar las versiones de Node y pnpm indicadas en `.mise.toml` y ejecutar `pnpm install`.
2. Ejecutar `pnpm dev` para abrir el cliente web en la dirección que indique Vite.
3. Ejecutar `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build` antes de entregar cambios.

La interfaz utiliza Supabase Auth y la función `make-server-845b49a4`. La migración está en `supabase/migrations/` y el servidor en `supabase/functions/server/`. La configuración, el contrato de API y las instrucciones de despliegue están en [supabase/README.md](supabase/README.md). Las variables `VITE_` sólo admiten la URL y la clave pública del proyecto; nunca deben contener la clave de servicio.

`pnpm test:live-auth` comprueba que la función desplegada responde y rechaza peticiones sin sesión o con un token inválido. `pnpm test:live-roles` comprueba los permisos ADMIN/USER con dos cuentas ficticias ya existentes; requiere `MILENIO_ADMIN_EMAIL`, `MILENIO_ADMIN_PASSWORD`, `MILENIO_USER_EMAIL`, `MILENIO_USER_PASSWORD`, `MILENIO_CLIENT_GUIDE` y `MILENIO_OPERATOR_GUIDE` en el entorno. Ninguno de los dos comandos crea usuarios ni paquetes. La evidencia de integración y revisión móvil está en [docs/SERGIO_VERIFICACION.md](docs/SERGIO_VERIFICACION.md).

## Presentación interactiva (rama `feature/presentacion-interactiva`)

El código de esta rama prepara una demostración con **dos interfaces simultáneas**, separada de los paquetes académicos normales:

1. **Celular del atendiente:** una cuenta `ADMIN` entra a `/presentacion/control`, inicia una presentación y comparte su enlace. Después elige origen y destino de una lista de países y confirma cada envío ficticio. La ruta de control incluye el identificador de la presentación, por lo que se puede volver a abrir después de recargar.
2. **Proyector:** el enlace `/presentacion/pantalla/:runId` muestra una línea horizontal nueva por envío, con país de origen, destino y los puntos Salida, Clasificación, Tránsito, Aduana y Destino. Las líneas avanzan durante 90 segundos según su fecha de creación y permanecen en la pantalla; cuando hay muchas, la lista se desplaza hacia las más recientes.

La pantalla consulta los envíos existentes al abrirse, recibe inserciones mediante [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes) y vuelve a consultar periódicamente por si se interrumpe la conexión. El mismo identificador de envío elimina duplicados entre ambas vías. Los datos de esta dinámica son únicamente códigos de países y fechas ficticias; no incluyen nombres ni direcciones. Para empezar otra función se crea una presentación nueva, sin mezclar las rutas anteriores. Una vista de ejemplo local está disponible en `/presentacion/pantalla/vista-previa` cuando se ejecuta Vite en desarrollo; no escribe datos ni aparece en producción.

La migración nueva crea `presentation_runs` y `presentation_shipments`, y la función Edge añade rutas propias. La tabla `shipments`, las guías `ME-...`, el registro y la consulta académicos no se modifican. El detalle del contrato y del despliegue está en [supabase/README.md](supabase/README.md).

**Estado:** las pantallas, el servicio, la migración y las pruebas están implementados en esta rama, pero esta ampliación aún no se ha desplegado. Para probarla con celular y proyector reales hay que aplicar la migración, desplegar la función Edge y publicar el cliente web en una URL HTTPS accesible a ambos dispositivos. Después se debe hacer una prueba completa creando varios envíos desde el celular y comprobando que aparecen y avanzan en el proyector. Los países, nombres de puntos de control y duración se pueden ajustar en `src/presentation/model.ts` sin cambiar el módulo académico.

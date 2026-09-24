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

## Presentación interactiva prevista después de la entrega

Cuando el módulo académico esté terminado, publicar una demostración en línea con **dos interfaces simultáneas**:

1. **Celular de los atendientes:** cada participante elige un país de origen y otro de destino para registrar un envío internacional **simulado**. El atendiente confirma el envío desde esta vista.
2. **Proyector:** una pantalla compartida muestra una nueva línea horizontal por cada envío confirmado. Cada línea identifica su origen y destino y avanza por puntos de control visibles hasta llegar al destino. Las líneas anteriores permanecen en pantalla, de modo que varios envíos puedan avanzar al mismo tiempo.

Ambas vistas deben reflejar los mismos envíos en tiempo real sin recargar la pantalla del proyector. Para considerar lista la demostración, se debe poder abrir las dos vistas en dispositivos distintos, crear varios envíos desde el celular y observar que cada uno aparezca como una línea independiente que progresa por sus puntos de control. Esta dinámica es una **ampliación para la presentación**; todavía no está implementada y no cambia el alcance de creación y consulta exigido para la entrega académica actual.

### Preparación para añadirla sin rehacer el módulo actual

- **Separar datos y API:** conservar `shipments` y `/shipments` para la entrega académica. La tabla actual exige guías `ME-...` y estado `Registrado`; la simulación deberá usar una tabla y rutas propias, por ejemplo `presentation_shipments` y `/presentation/shipments`. No se deben añadir países ni estados animados a los paquetes existentes.
- **Guardar lo mínimo:** cada envío de la presentación necesita un identificador, un identificador de la presentación activa, país de origen, país de destino y fecha/hora de creación generada por el servidor. Usar una lista controlada de países y sólo datos ficticios; no hacen falta nombres ni direcciones de participantes. El identificador de presentación permite iniciar una nueva función sin mostrar las líneas de una anterior.
- **Añadir pantallas independientes:** reservar `/presentacion/control` para el celular y `/presentacion/pantalla` para el proyector, con componentes separados de `Register` y `ShipmentDetail`. El control deberá poder crear envíos sólo con una sesión autorizada; el proyector leerá únicamente los datos ficticios necesarios para dibujar las líneas. La clave de servicio nunca irá al navegador.
- **Sincronizar y animar:** al abrirse, el proyector se suscribe a los nuevos envíos mediante [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes), carga los de la presentación activa y elimina duplicados por identificador. Cada línea calcula su avance a partir de la hora de creación y una duración definida para los puntos de control, sin escribir un cambio de estado por cada cuadro de la animación. Si se corta la conexión o se recarga la pantalla, vuelve a consultar los envíos y reconstruye el avance sin duplicar líneas.

La ampliación puede conectarse al cliente de Supabase de `src/lib/supabase.ts`, a rutas nuevas en `src/App.tsx` y a un módulo nuevo de la función Edge y de la base de datos. Esta separación deja intactos el contrato y las pruebas actuales de autenticación, registro y consulta. **Preparado en diseño no significa implementado:** antes de la presentación habrá que crear esas rutas, la tabla, los permisos, la suscripción y la prueba con un celular y el proyector conectados al mismo despliegue en línea.

# 🚨 LA RAMA MAIN NO SE TOCA 🚨

## 📌 Reglas del Flujo de Trabajo (Git Workflow)

El equipo reserva `main` para cambios revisados por Sergionix mediante Pull Request. **No se deben hacer commits ni pushes directos a `main`.** Mientras el repositorio privado no tenga una protección técnica activa, esta regla depende del flujo de trabajo del equipo.

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

`pnpm test:live-auth` comprueba que la función desplegada responde y rechaza peticiones sin sesión o con un token inválido. `pnpm test:live-roles` comprueba los permisos ADMIN/USER con dos cuentas ficticias ya existentes; requiere `MILENIO_ADMIN_EMAIL`, `MILENIO_ADMIN_PASSWORD`, `MILENIO_USER_EMAIL`, `MILENIO_USER_PASSWORD`, `MILENIO_CLIENT_GUIDE` y `MILENIO_OPERATOR_GUIDE` en el entorno. Ninguno de los dos comandos crea usuarios ni paquetes. La evidencia y la verificación móvil pendiente están en [docs/SERGIO_VERIFICACION.md](docs/SERGIO_VERIFICACION.md).

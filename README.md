# 🚨 LA RAMA MAIN NO SE TOCA 🚨

## 📌 Reglas del Flujo de Trabajo (Git Workflow)

Este repositorio sigue un flujo de trabajo estricto para proteger el código de producción. **Está estrictamente prohibido hacer commits o pushes directos a la rama `main`.** 

### 🌳 Estructura de Ramas (Instrucciones para Desarrolladores e IAs)

El flujo de trabajo se divide en 3 niveles de ramas:

1. **`main` (Producción)**: Es la rama principal. **Solo** recibe código a través de un Pull Request (PR) y únicamente cuando **TODOS** los colaboradores han dado su aprobación (Review/Approve).
2. **Ramas Principales por Colaborador** (`dev-[nombre-colaborador]`): Cada integrante del equipo debe crear y mantener una rama principal a su nombre (ej. `dev-juan`). Esta rama actúa como su entorno de integración personal.
3. **Ramas por Actividad/Tarea** (`feature/[nombre-tarea]`, `fix/[nombre-fix]`): Ramas efímeras para trabajar en tareas específicas. 

#### Diagrama de Ramas
```text
main (PROTEGIDA - Solo Merge con aprobación de todo el equipo)
│
├── dev-colaborador1 (Rama principal de integración del colaborador 1)
│   ├── feature/crear-login (Se hace push y merge hacia dev-colaborador1)
│   └── fix/error-botones (Se hace push y merge hacia dev-colaborador1)
│
├── dev-colaborador2 (Rama principal de integración del colaborador 2)
│   ├── feature/conexion-db
│   └── feature/diseno-home

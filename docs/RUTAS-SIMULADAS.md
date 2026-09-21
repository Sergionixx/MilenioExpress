# Rutas ficticias — planificación en Jira

> **FUERA DE ESTA ENTREGA — 21 septiembre 2026.** La rúbrica exige un módulo funcional con evidencia técnica. KAN-65 a KAN-78 se retiraron del alcance activo; el contenido siguiente conserva la propuesta histórica para una mejora futura. Consultar [PLAN-ENTREGA.md](PLAN-ENTREGA.md).

Épico: [KAN-65](https://milenioexpress-sergionix.atlassian.net/browse/KAN-65).
Las 13 tareas KAN-66 a KAN-78 están creadas como hijas, en Pendiente, con criterios de aceptación, dependencias en descripción y etiquetas de dificultad y `rutas-simuladas`. Esto es planificación; el motor y catálogo todavía no están implementados.

## Cobertura propuesta

50 países, 269 centros ficticios disponibles. Redes de 3, 5, 8 o 12 centros según extensión y necesidades del escenario. Cada paquete visita únicamente los centros necesarios. Se genera una ruta para cada uno de los 2,450 pares internacionales dirigidos; las rutas nacionales se tratan aparte.

- América (15; 92 centros): Canadá, Estados Unidos, México, Guatemala, Costa Rica, Panamá, Cuba, República Dominicana, Colombia, Ecuador, Perú, Brasil, Bolivia, Chile, Argentina.
- Europa (15; 65 centros): Reino Unido, España, Portugal, Francia, Alemania, Italia, Países Bajos, Bélgica, Suiza, Austria, Polonia, Suecia, Noruega, Grecia, Turquía (agrupación de catálogo).
- Asia (12; 67 centros): China, Japón, Corea del Sur, India, Indonesia, Vietnam, Tailandia, Malasia, Singapur, Filipinas, Emiratos Árabes Unidos, Arabia Saudita.
- África y Oceanía (8; 45 centros): Egipto, Marruecos, Sudáfrica, Kenia, Nigeria, Australia, Nueva Zelanda, Fiyi.

## Tareas

| Jira | Trabajo | Dificultad |
| --- | --- | --- |
| KAN-66 | Modelo de países, centros, conexiones y checkpoints | Alta |
| KAN-67 | Catálogo de América | Media |
| KAN-68 | Catálogo de Europa | Media |
| KAN-69 | Catálogo de Asia | Media |
| KAN-70 | África/Oceanía y validación del catálogo completo | Media |
| KAN-71 | Generador de recorridos entre países | Alta |
| KAN-72 | China→Argentina, Reino Unido→España, China→México e inversos | Baja |
| KAN-73 | Asociar ruta y progreso al paquete | Alta |
| KAN-74 | Avance, pausa, velocidad y reinicio | Alta |
| KAN-75 | Sección móvil de rutas, mapa y línea de tiempo | Media |
| KAN-76 | Retrasos, aduana, desvíos, reintentos y devolución | Media |
| KAN-77 | Pruebas de combinaciones, casos límite y móvil | Alta |
| KAN-78 | Documentación y guion de exposición | Baja |

## Ejemplos diseñados para la demo

- China→Argentina: Shanghái → salida aérea → Buenos Aires/Ezeiza → aduana simulada → distribución Buenos Aires → Córdoba → reparto → entrega.
- Reino Unido→España: Londres → salida aérea → Madrid → aduana simulada → Barcelona → reparto → entrega.
- China→México: Shenzhen → Guangzhou → salida aérea → Ciudad de México → aduana simulada → San Luis Potosí → Monterrey → reparto → entrega.

Se añaden etapas de recepción y clasificación, tiempos ficticios crecientes y coordenadas válidas. No representan itinerarios reales de transportistas. El catálogo de ciudades y coordenadas se completa durante las tareas regionales.

## Retiro de funcionalidades descartadas

KAN-25 estaba archivada. Se solicitó archivar KAN-30 y KAN-32 para retirar las tarjetas de lectura/generación de códigos del tablero activo. El borrado permanente está pendiente de confirmación: Jira advierte que elimina irreversiblemente tarjetas, comentarios y adjuntos.

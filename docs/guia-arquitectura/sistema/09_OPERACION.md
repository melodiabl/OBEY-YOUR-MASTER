# Operación, rendimiento y mantenimiento

## Arranque y cierre

Arranque por dependencias: cargar configuración validada → logger → almacenamiento/colas necesarios → servicios → registro de capacidades → Gateway y nodos → listeners/rutas → readiness. Conciliar el bootstrap local existente antes de crear otro. Cada paso que adquiere un recurso registra su liberación.

Readiness refleja capacidades: proceso vivo no equivale a música lista o DB disponible. Un error de imágenes puede dejar fallback textual; un error Mongo bloquea operaciones que necesitan persistencia. No aceptar cambios críticos para guardarlos luego en una caché sin garantía.

Cierre: dejar de aceptar trabajo nuevo → drenar interacciones según plazo → checkpoint de sesiones → cerrar listeners/timers → conexiones/worker/nodos → salida. No reproducir autoplay al drenar. Limitar plazo y registrar trabajo no confirmado para conciliación.

## Medición por tramo

| Tramo | Registro objetivo |
| --- | --- |
| Interacción | Recepción, ACK, autorización y cola |
| Operación | Inicio, fin, código y estado confirmado/desconocido |
| Nodo | Búsqueda, conexión, primer audio/confirmación y recuperación |
| Presentación | Render y espera de publicación |
| Discord REST | Ruta categorizada, duración, 429 y retry-after redactados |
| Jobs | Edad, intentos, ejecución y agotados |

Comparar p50/p95/p99 con carga, región y tamaño de muestra descritos; no atribuir un retraso de edición al nodo sin datos. Objetivo de diseño para ACK: margen claro frente al máximo oficial; los demás presupuestos se fijan con baseline. Sin promesas absolutas de cero lag o continuidad.

## Fluidez

No renderizar canvas, transcribir archivos grandes o procesar miles de items en el hilo Gateway. Workers y colas acotadas, cachés por versión y cancelación de trabajos obsoletos. No añadir un timer por mensaje si un planificador compartido puede resolver los vencimientos/progreso con límites conocidos.

Publicación: agrupar por mensaje, priorizar controles y limitar ráfagas por destino. Mantener separados estado de audio y disponibilidad REST. Fallar una edición no detiene la reproducción. Jobs por guild no consumen toda la capacidad de imágenes de las demás guilds.

## Diagnóstico para usuarios y operadores

Gestor ve: configuración faltante, canal/rol afectado, permiso necesario y acción de reparación. Operador ve: dependencia, versión, correlación, tasa de errores y último resultado, sin tokens ni datos privados. El error al miembro lleva referencia de soporte; no stacktrace.

## Despliegue

Instalación reproducible con lockfile, imagen y runtime fijados. Migraciones de datos antes de activar lectores incompatibles, con checkpoint y backup apropiados. Liberación gradual por guild/capacidad, kill switch y rollback descrito. No reconstruir las credenciales retiradas para llenar ejemplos.

Escala por concurrencia de sesiones, audio, peticiones y presupuesto. Sharding no multiplica automáticamente capacidad de los nodos. Autoscaling exige propiedad estable por guild y fencing; se introduce después de medir necesidad, no para decorar un diagrama.

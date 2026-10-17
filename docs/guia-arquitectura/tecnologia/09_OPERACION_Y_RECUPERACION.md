# Operación, disponibilidad y recuperación modular

Diseño objetivo sobre los jobs, bootstrap, persistencia y audio existentes. No exige dividir hoy el despliegue.

## Estado visible por capacidad

| Estado | Significado | Mensaje/acción de producto |
| --- | --- | --- |
| No configurado | Faltan recursos o decisiones del servidor | Mostrar pasos mínimos y valores pendientes |
| Desactivado | Decisión del gestor para esa guild | Permitir configurar o activar según permiso |
| Disponible | Dependencias y configuración permiten la operación | Mostrar acciones reales y estado confirmado |
| Degradado | Parte de la capacidad está indisponible | Explicar qué puede hacerse y qué quedó pendiente |
| Suspendido | Política operativa impide nuevas operaciones | Mostrar motivo autorizado y vía de recuperación |
| Desconocido | No hay evidencia reciente suficiente | Evitar indicador verde y ofrecer consultar de nuevo |

Estos estados son proyecciones de configuración, salud y política; no reemplazan el estado de una operación pendiente/confirmada. No ejecutar escrituras o mensajes de prueba al consultar salud.

## Infraestructura por responsabilidad

Conservar Mongo como persistencia actual. Las escrituras de un solo documento pueden usar revisión y CAS; varias entidades requieren una política explícita [T8]. No prometer atomicidad entre Mongo y un envío Discord.

Reutilizar BullMQ para trabajos que deben sobrevivir al proceso. El módulo define idempotencia y conciliación, además del transporte de reintentos [T9]. Si Redis falta, mostrar capacidad afectada como no disponible o pendiente según el contrato; no pasar silenciosamente a timers en memoria y confirmar durabilidad.

Mantener Socket.IO para actualizar vistas. Su entrega por defecto no convierte cada actualización en un recibo durable [T10]. Después de reconectar, pedir snapshot autorizado y revisión; no aplicar eventos fuera de orden sobre un estado más nuevo. El socket no es la fuente de verdad de la cola musical ni de una publicación.

## Jobs y efectos externos

Persistir operación, guild, entidad, generación, estado, intentos y referencia del resultado. El worker recibe identificador y carga lo necesario, no credenciales copiadas al payload. Verificar autorización efectiva o política de delegación antes del efecto.

Al recibir una respuesta incierta del proveedor, consultar evidencia del efecto cuando exista antes de repetir. Si no puede conciliarse, marcar desconocido y ofrecer recuperación operativa. Un outbox ayuda a entregar eventos después de guardar cambios locales, pero su dispatcher debe ser idempotente; no produce exactamente una entrega por sí solo.

Definir cuánto tiempo retener recibos y contenido sensible por módulo. La eliminación de datos y la conservación mínima de auditoría tienen objetivos distintos y deben quedar explícitos.

## Perfil de despliegue

Un proceso inicial puede ejecutar bot, API y jobs si ya es la topología usada. El diseño prepara factories para separar workers o render cuando haga falta; no abre otra sesión Gateway para aparentar modularidad.

Compose permite perfiles selectivos [T12]. Propuesta: base, jobs y render cuando esos servicios se separen realmente. Un perfil de Compose no es el toggle de bienvenida de un servidor. Servicios comunes se comparten; cada capacidad declara cómo se comporta al perder una dependencia.

En audio, asignar un solo propietario de sesión por guild. Un worker genérico no debe reconstruir un reproductor activo a partir de un job y competir con el motor. Conservar reloj confirmado, cancelaciones y recuperación vigentes.

## Diagnóstico y logs

La interfaz logger acepta módulo, operación, correlationId, resultado, duración y código de proveedor permitido. Evitar que un logger genérico serialice request, sesión o cliente completos. Pino ofrece redacción configurable [T11], pero no detecta automáticamente todos los secretos. Añadir un adaptador solo cuando esté definida la allowlist y se compruebe con fixtures.

Conservar Sentry para los errores que ya reporte, con contexto autorizado. El panel puede ofrecer diagnóstico del módulo con estado y pasos; nunca mostrar token, URI privada, cookie, body de ticket o parámetros de conexión.

## Operaciones de mantenimiento

Separar consulta, simulación, aplicación y recuperación. Importar configuración requiere fuente permitida, versión, diff y confirmación de recursos; nunca recrear canales porque tengan nombres distintos. Conservar integración con canales/roles de otros bots usando IDs existentes y autoridad explícita observe/cooperate/manage.

Todo cierre tiene plazo, impide nuevas operaciones y libera recursos propios. Todo reinicio necesita reconciliar trabajo pendiente y reconstruir vistas desde datos confirmados. Desactivar y reactivar no duplica listeners ni resucita trabajos cancelados de generaciones anteriores.

## Aceptación operativa propuesta

Comprobar indisponibilidad selectiva de Redis/Mongo/nodo, cierre concurrente, reconexión de web, job cancelado en curso y respuesta incierta. Registrar la conducta real y recuperación posible. Esta lista no son pruebas ejecutadas en la entrega documental.

# Datos, trabajos e interoperabilidad

## Datos y concurrencia

Cada módulo documenta su colección/esquema real antes de introducir nuevas colecciones. Separar entidad, configuración y sesión de UI. Todas las consultas multiusuario usan guild/actor y alcance explícitos; no depender de filtros puestos únicamente en una vista.

| Dato | Autoridad propuesta | Protección |
| --- | --- | --- |
| Configuración | Mongo y revisión del módulo | Compare-and-set; historial de cambios |
| Ticket/caso/solicitud | Repositorio del módulo | Revisión y unicidad de operación |
| Saldo y transferencia | Ledger/repositorio economía | Atomicidad según topología y recibo idempotente |
| Favoritos | Biblioteca personal | Índice de usuario/pista y acceso privado |
| Reproducción | Propietario runtime + snapshot durable | Generación, playbackId y reconciliación |
| Jobs | BullMQ/Redis con durabilidad acordada | IDs estables y verificación del efecto |
| Caché de tarjeta | Derivado por hash/versión | Caducidad y reconstrucción |
| Sesión de menú | Estado temporal recuperable según necesidad | Actor, expiración, recurso y revisión |

No usar almacenamiento en memoria para prometer recuperación después de reinicio. No usar TTL como garantía de entrega exacta a una hora. No considerar el balance final un historial suficiente para investigar doble gasto.

## Trabajos durables

Payload mínimo: versión, guild, recurso, operationId, actor de sistema autorizado, instante y referencias necesarias. No serializar Interaction, cliente Discord o una colección de secretos. Antes de ejecutar, volver a comprobar configuración, permisos y si el trabajo fue cancelado o completado.

La cola puede entregar más de una vez. Aplicar deduplicación y verificar recibo antes de repetir efectos. Retries con backoff y máximo; agotados pasan a estado diagnosticable. En envíos Discord, timeout desconocido requiere conciliación. Si no puede resolverse automáticamente sin duplicar, informar revisión necesaria.

Transcripción: cerrar ticket y generar archivo son pasos distintos con estados y políticas de acceso. Recordatorio: guardar UTC y zona original; acordar horarios ambiguos por DST. Feed: deduplicar por fuente/ID; cursor durable y reintentos no publican el mismo post repetidas veces.

## Integración con otros ecosistemas

OBEY puede usar canales/categorías/roles existentes elegidos por un administrador, importar formatos propios versionados y consumir APIs/webhooks oficiales expresamente configurados. No tiene acceso implícito al estado privado de otro bot ni debe raspar sus mensajes como si fueran un contrato confiable.

Vinculación: detectar recursos del servidor → seleccionar → comprobar capacidades → guardar referencia → preview → activar. Cada referencia guarda ID y propósito; nombres son presentación. No renombrar o borrar recursos que no fueron creados/gestionados por OBEY salvo acción explícita con alcance revisado.

Architect guarda plan, cambios previstos y efectos confirmados. Un backup de servidor no reconstruye todos los mensajes, IDs o sistemas externos de Discord. La UI explica límites de restauración antes de aplicar.

## Retención y privacidad

Clasificar logs operativos, casos, transcripciones, perfiles, feedback y datos musicales. Cada tipo debe acordar acceso, retención y borrado. No inventar plazos legales como defaults técnicos. Propuesta de configuración: retención editable para datos operativos, con validación y capacidades de exportación/borrado por alcance; documentar excepciones justificadas.

Conservar solo metadata necesaria para recomendaciones, sin registrar contenido de voz. Logs redaccionados, backups con acceso restringido y secrets fuera de imágenes/config exports. La entrega no contiene bases de producción ni credenciales.

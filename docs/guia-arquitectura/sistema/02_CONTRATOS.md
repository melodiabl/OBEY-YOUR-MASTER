# Contratos públicos y compatibilidad

## Operación

Cada entrada se vincula a `operationId` canónico, política y servicio. Ejemplo de diseño: `tickets.close`, con entrada `ticketId`, `reason` y `expectedRevision`; el contexto aporta actor, guild y referencia de interacción. No tomar actor/guild de parámetros sin contrastarlos con el transporte autenticado.

Contexto común: `guildId`, `actorId`, `origin`, `audience`, `correlationId`, `requestId`, `deadlineAt`. Añadir `expectedRevision` e `idempotencyKey` solo a operaciones que los necesitan. Las claves idempotentes identifican actor, operación, recurso y contenido; no dan permiso.

Resultado de diseño:

| Campo | Significado |
| --- | --- |
| `status` | confirmed, pending, partial, unknown, conflict o rejected |
| `code` | Identificador estable, independiente del idioma |
| `data` | Datos que ese actor puede ver |
| `revision` | Versión confirmada del recurso si existe |
| `retry` | Qué puede reintentarse y cuándo; no una invitación universal a duplicar acciones |
| `correlationId` | Referencia pública para diagnóstico sin secretos |

El renderer transforma códigos en mensajes traducidos. Excepciones del SDK no se muestran literalmente a miembros. Un timeout puede significar efecto desconocido: consultar estado antes de repetir creación de canal, sanción o transferencia.

## Paridad de entradas

| Entrada | Transformación | Lo que comparte |
| --- | --- | --- |
| Slash | Tipos, opciones, defer/modal y actor | Operación, política y resultado |
| Prefijo existente | Parser/aliases y permisos de mensaje | Mismas reglas, valores y errores |
| Botón/menú | Referencia de sesión y recurso | Misma operación y revisión actual |
| Job | Actor de sistema y propósito autorizado | Invariantes y deduplicación |
| Ruta web existente | Sesión y acceso a guild comprobados | Mismo servicio; sin acceso paralelo a colecciones |

La paridad es de semántica. Un menú puede abrir un modal y slash puede pedir una opción, pero ambos deben aplicar el mismo límite y producir el mismo efecto. Mostrar una acción solo si está disponible; volver a autorizar al ejecutarla.

## Interacciones persistentes

Router estable en lugar de collectors como única autoridad para tickets, roles y reproductores permanentes. Un ID nuevo puede seguir `obey:<modulo>:<version>:<accion>:<referencia>` dentro del límite vigente de Discord. Referencia opaca y recuperable; nunca meter tokens, texto libre o permisos en el ID. Las doce IDs `mp_*` se conservan con un puente explícito.

Estado de sesión temporal: guild, propietario o audiencia autorizada, recurso, revisión, expiración y generación. Revalidar todo en cada interacción. El TTL borra la sesión después de dejar un mensaje comprensible; un control antiguo responde caducado o abre una sesión nueva según su contrato.

## Eventos y efectos

Los eventos describen hechos confirmados con ID, timestamp, versión del schema, guild, recurso y correlación. Un consumidor es idempotente ante entrega repetida. Si dos cambios deben ser indivisibles, usar una operación de dominio; no confiar en que dos listeners correrán juntos.

Usar outbox durable cuando haya que garantizar publicación posterior a una escritura. Una transacción Mongo no confirma por sí misma una llamada Discord. Registrar efecto solicitado, confirmado y desconocido; conciliar tras reinicio.

## Ficha de módulo obligatoria

La ficha mantiene: entradas reales; público; configuración y defaults; autoridad de datos; operaciones e invariantes; catálogo de vistas; recursos; i18n; permisos; jobs; compatibilidad; recuperación; pruebas de aceptación. Cada endpoint o comando nuevo se asigna a una ficha. No cerrar una ficha solo con un manifest o una lista de features.

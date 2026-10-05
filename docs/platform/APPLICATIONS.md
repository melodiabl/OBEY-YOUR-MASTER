# Aplicación confirmada de ediciones existentes

T28 parcial: backend y web implementan nombres de canales/categorías/roles existentes, temas de canales de texto y colores de roles. Rechazan creaciones, movimientos, permisos, eliminaciones y configuración de módulos; no declaran esos efectos disponibles. La conservación de IDs y permisos permite verificar esta primera ejecución sin remapeo. El editor sigue permitiendo diseñar otros cambios y guardarlos, pero no ejecutarlos.

La aplicación está cerrada por defecto. Un operador debe configurar IDs numéricos concretos en `OBEY_ARCHITECT_APPLY_GUILDS` para un canary previamente autorizado. Configurar Redis no habilita este flag. No se configuraron guilds, reinició el bot, publicó comandos ni ejecutó REST Discord real. Los scripts usan proveedores mutables de fixture en redes aisladas.

La edición de color solo admite roles con estilo simple conocido. Gradientes/holográficos se bloquean, y estado desconocido no se considera seguro. El snapshot guarda los tres colores conocidos en metadata `roleColors` y los incorpora a la revisión; una modificación de color secundario invalida el plan aunque el primario no cambie. Snapshots anteriores sin esa metadata siguen legibles. Se utiliza `colors` del SDK, evitando la opción antigua `color` que limpia los colores secundarios. Ver [contrato de colores de discord.js 14.27.0](https://discord.js.org/docs/packages/discord.js/14.27.0/RoleColorsResolvable%3AInterface).

## Preparación y confirmación

`POST /api/architect/:guildId/applications` valida un blueprint contra un snapshot fresco, calcula diff y preflight, agrupa ediciones por recurso y crea un plan privado. El actor/guild provienen del contexto autenticado, con permisos OAuth frescos y CSRF. Un plan vacío o con efectos no soportados se rechaza. El preflight para ejecutar comprueba además `ManageGuild` del actor y `ManageChannels` efectivo en cada canal, sin tratar un permiso global como garantía de acceso local.

Plan y payload tienen versión 1. El plan contiene snapshot/blueprint/operaciones/revisión y caduca a los 15 minutos, con TTL Mongo. Se devuelve un token de confirmación aleatorio de 256 bits; solo su hash SHA-256 se persiste en el plan. La web muestra antes/después y requiere confirmación explícita. Cambiar la propuesta elimina su confirmación local.

`POST /api/architect/:guildId/applications/confirm` acepta únicamente `{id, confirmation, revision}`. Comprueba scope, hash en tiempo constante, revisión, caducidad y drift antes de marcar confirmado. El servicio de jobs solo acepta `architect.apply` con un `applicationId` cuyo payload confirmado proviene del servidor; el cliente no proporciona payload de ejecución. La clave `apply-<plan UUID>` hace idempotentes confirmaciones concurrentes o con respuesta perdida. La marca confirmada y la solicitud son dos writes: repetir la confirmación repara el caso donde el segundo write falló; no se promete transacción entre documentos.

## Ejecución y recuperación

Mongo conserva payload inmutable, revisión esperada, referencia de copia, pasos y contador real. BullMQ entrega solo el ID del registro. El worker comprueba de nuevo permisos del actor, canary y token Mongo antes de entrar al lease Redis por guild. El ejecutor valida versión/scope, blueprint, diff y operaciones del payload.

Antes de efectos reclama además `ArchitectGuildOperation` por guild. Este guard duradero no caduca: un lease Redis perdido no permite a otra aplicación atravesar una edición incierta. Captura una copia `before_apply` y exige que su revisión coincida con la esperada. Antes de cada edición lee estructura, revisa permisos/hierarchy efectivos y vuelve a comprobar la revisión después del preflight.

Cada paso se escribe `executing` **antes** de REST, mediante CAS del token y estado/cancelación. Después de editar compara el snapshot completo con la revisión esperada para ese cambio: una modificación externa o normalización no prevista detiene la ejecución. Solo entonces persiste `completed`, revisión y contador juntos. Un checkpoint completado no se vuelve a ejecutar. Un crash después del último checkpoint puede recuperar resultado y liberar el guard sin repetir efectos.

Si REST, lectura posterior, lease o checkpoint falla tras `executing`, el job termina para revisión y conserva el guard. Una respuesta perdida no se reproduce automáticamente. Una segunda aplicación falla mientras existe ese guard. Cancelar durante una solicitud REST en vuelo puede dejar el efecto aplicado; mantiene el guard y los pasos inciertos. La UI explica que cancelar no revierte lo ya realizado.

El guard solo se libera al completar todos los pasos o tras un aborto duradero, por CAS, antes de cualquier edición. Ese aborto marca `executionAborted` y prohíbe `startEdit`, impidiendo que un worker antiguo libere protección sobre un nuevo worker. No hay botón de desbloqueo ni borrado automático por timeout. Reconciliar una ejecución incierta requiere comprobar la estructura real, el journal y la copia; herramienta de recuperación/rollback y aceptación real quedan pendientes. No borrar un guard a ciegas.

Discord no ofrece una transacción/CAS para esta secuencia. Cambios humanos, comandos legacy y otros bots no adquieren nuestro lease. Se detecta drift antes/después de cada edición, pero no se promete atomicidad ni exactamente una llamada REST. El cliente discord.js administra sus buckets de rate limit; no se añadieron sleeps ni reintentos de mutación paralelos.

## Verificación y continuación

`test/architect-application.test.js`, `test/architect-edits.test.js`, rutas y preflight prueban scopes, token/revisión/caducidad, unsupported, recuperación, permisos, drift y respuesta perdida. `scripts/verify-architect-application.js` verifica con MongoDB 7/Redis 7/BullMQ reales: confirmación concurrente, copia previa, edits mutables de fixture, checkpoints, scopes, revocación, guard persistido, fencing del aborto y cancelación durante REST. Usa el RoleManager instalado para serializar la edición, con REST sustituido antes de llamar y sin login/token. CI lo ejecuta en la imagen runtime sin salida externa. Evidencia: `evidence/architect-application.json`.

Chromium verifica plan sin efectos, revisión/confirmación explícita, edición de fixture y copia previa, estado real del job, dos pestañas, móvil, revocación y respuesta tardía; `scripts/verify-jobs-browser.js` y `evidence/jobs-*`. No es una aceptación de Discord real ni de OAuth real.

Siguientes T24/T26/T28: creaciones seguras con reconciliación de respuestas perdidas e IDs lógicos→reales, orden/dependencias, movimientos/permisos, límites/capacidades y acceso administrativo, configuración/referencias de módulos, resultados por dominio y recuperación de pendientes. T27: configuración portable, importación/exportación, retención/scheduler y restauración confirmada. T29: propuesta inversa/rollback con conflictos y límites. Todo el maestro sigue íntegro.

Referencia del proveedor: [gestión de servidores y canales de Discord](https://github.com/discord/discord-api-docs/blob/main/developers/platform/server-and-channel-management.mdx), [rate limits](https://github.com/discord/discord-api-docs/blob/main/developers/topics/rate-limits.mdx). Firmas `GuildChannelManager.edit` y `RoleManager.edit`, fetch frescos y bitfields verificadas en discord.js instalado; métodos usados con fixtures y permisos reales de la biblioteca.

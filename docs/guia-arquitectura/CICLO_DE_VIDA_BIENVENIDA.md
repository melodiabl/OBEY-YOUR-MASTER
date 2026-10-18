# Cierre de configuración de bienvenida · incremento TECH-05

Implementación local del 18/10/2026 sobre `3e71648`. El alcance es el servicio de configuración de canal/mensaje del [piloto](PILOTO_BIENVENIDA.md). El SHA del incremento se registra en [la evidencia](../platform/evidence/welcome-lifecycle.json). No cierra ARCH-04 ni todo TECH-05.

## Problema y comportamiento

Una escritura podía estar esperando la autorización de Discord cuando empezaba el cierre. Todavía no pertenecía a la cola de Mongo: vaciar esa cola no esperaba la operación y esta podía intentar escribir después del flush.

El servicio ahora cuenta sus operaciones desde la entrada hasta resolver o rechazar: `read`, `readPublished`, `channels`, `saveDraft`, `preview`, `publish` y `savePublished`. `drain()` cierra la admisión, devuelve la misma promesa en llamadas repetidas y espera las operaciones aceptadas. `finally` libera el contador también ante errores; esperar su terminación no convierte errores en éxitos.

La composición consulta `client._shuttingDown` antes de aceptar operaciones. Las ya aceptadas pueden terminar y siguen comprobando permisos, disponibilidad del servidor y del canal. La consulta de canales se movió a esa composición: conserva un único fetch del miembro, la autorización ManageGuild y el DTO de canales de texto visibles `{ channels: [{ id, name }] }`. El puerto debe autorizar y proyectar recursos conjuntamente; si no existe, el servicio falla como no disponible.

`client.stopWelcomeConfiguration` conecta el drenaje al cierre normal existente, después de cards/jobs y antes del flush musical, flush de Mongo y desconexión. La inicialización repetida conserva la misma instancia y hook; no reabre una instancia cerrada. No añade listeners, timers, dependencias ni otro runtime.

## Estado y respuestas

`lifecycleState()` devuelve `{ phase, inFlight }`: `accepting`, `draining` o `stopped`. Describe admisión y operaciones pendientes; no es readiness de Mongo/Discord ni certifica que toda operación terminó con éxito.

Durante el cierre las nuevas llamadas fallan con `configuration_unavailable`. El adaptador HTTP devuelve 503 y `{ "error": "configuration_unavailable" }`, sin snapshot ni marca de revocación. Una revocación confirmada sigue devolviendo 403 y `accessRevoked: true`. El editor conserva los cambios ante indisponibilidad y limpia datos ante revocación según el comportamiento ya verificado en TECH-04.

La política por guild se conserva: `channelId: null` desactiva el canal principal; no borra ni desactiva DM, segundo canal o ajustes avanzados. Este incremento no introduce activación masiva, generación por guild ni un sistema nuevo de jobs.

## Evidencia local

Comprobaciones temporales ejecutadas por stdin, sin restaurar archivos de tests o scripts retirados:

- Reproducción previa: una operación retenida en autorización escribía después del flush; la aserción falló antes del cambio.
- Función real de shutdown extraída mediante AST y ejecutada con dependencias aisladas: el cierre espera la escritura y después vacía sesiones/Mongo y desconecta; las seis operaciones anteriores rechazan nuevas llamadas. Drenaje repetido devuelve la misma promesa.
- Errores de repositorio y de política liberan el contador y conservan el error original. Cierre sin actividad, flag externo e inicialización repetida no reabren el servicio ni duplican recursos.
- Mongo real aislado, SyncMap y composición real: una escritura aceptada antes del cierre termina antes del flush y desconexión; aliases y ajustes avanzados se conservan. HTTP devuelve 503 durante el cierre.
- Consulta de canales pendiente: el drenaje la espera; la política conserva solo texto visible y hace un fetch del miembro. HTTP real comprueba 200 autorizado, 403 revocado y 503 cerrado, sin una nueva llamada al proveedor tras cerrar la admisión.
- Plazo global de 20 segundos simulado mediante su callback: salida 1, operación todavía `draining`, sin marcarla completada ni desconectar Mongo antes de ese callback. No se esperaron 20 segundos ni se terminó el proceso real.
- Recuperación con Mongo: una segunda instancia del servicio lee y reproduce el último recibo ya confirmado mientras la respuesta de la instancia anterior permanece retenida. La revisión sigue siendo 1. Es una nueva instancia aislada; no demuestra un reinicio real de proceso.

Los dos almacenes temporales de Mongo se verificaron vacíos antes de usarlos y se eliminaron al terminar; conexiones y servidores HTTP de prueba cerrados. `npm test`: 25/25 casos originales; `npm run typecheck:welcome`, sintaxis de los cuatro archivos JS y `git diff --check` pasan. La evidencia JSON registra hashes de los cuatro archivos modificados y límites de comprobación.

## Límites y continuación

Se conserva el deadline global existente de 20 segundos y su salida por error. Un fallo anterior en cards/jobs puede impedir alcanzar este drenaje; agotar el plazo puede interrumpir una operación. No hay cancelación ni garantía de entrega de la respuesta. Tras un resultado desconocido se debe consultar el recibo publicado antes de reintentar; el almacenamiento actual conserva únicamente el último recibo, sin un historial ilimitado de operaciones.

El seguimiento empieza al entrar en el servicio: middleware HTTP de sesión/autorización previa, registro de manifests y caminos legacy externos a estas operaciones quedan fuera. No se cambian login, ready/dbReady ni el bootstrap recibido en el ZIP. Entrega de bienvenida, DM, tarjetas y handlers avanzados conservan sus propietarios actuales.

Pendientes: ciclo de vida global ARCH-04, resto de recursos/políticas TECH-05, resto de contratos/API legacy (ver [TECH-06 parcial posterior](API_BIENVENIDA.md)), OAuth/Gateway reales y reinicio/cierre de producción. No se tocó el motor musical, el nodo privado ni datos de producción. No hubo publicación remota o despliegue.

Rollback: revertir el commit del incremento. No hay cambios de esquema, migraciones ni datos que borrar; vuelven las limitaciones previas del cierre. Los commits de configuración y formulario anteriores permanecen compatibles.

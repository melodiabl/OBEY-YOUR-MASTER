# Sincronización del reproductor y respuesta del panel · 17/10/2026

El usuario informó que el audio cambiaba de canción mientras Discord seguía mostrando la anterior y que los botones tardaban en cambiar. Se corrigieron fallos del reloj y trabajo pendiente del panel, manteniendo GDjkhp y los respaldos públicos actuales.

## Estado confirmado por el nodo

Shoukaku 4.3.0 devuelve `Promise<void>` en `Player.update`, aunque su `Rest.updatePlayer` recibe el reproductor completo. Se utilizan sus estructuras extensibles `StatePlayer`/`StateRest` para conservar únicamente posición, tiempo, pausa, volumen e identidad de reproducción de la misma respuesta PATCH. Cada operación usa su propio contexto asíncrono: no se agrega un GET por botón, no se comparten respuestas entre controles concurrentes y no se propagan tokens de voz ni el encoding.

Pausa/reanudación, seek y filtros reanclan el reloj compartido con el estado confirmado. Reanudar una sesión restaurada ya no conserva `status=paused`; los filtros aplican su nueva velocidad al reloj desde el punto confirmado. Se conservan la protección contra el cero inicial del proveedor y las muestras anteriores a un seek. Solo se compensa tránsito plausible de hasta dos segundos para no confundir diferencias de reloj de los públicos con tiempo de reproducción.

Una respuesta de reproducción confirmada puede publicar el estado antes del evento de inicio; un inicio tardío no reinicia ese reloj. Las correcciones WebSocket de al menos un segundo se publican al panel y a los consumidores existentes sin guardar Mongo por cada paquete. Un mensaje recién renderizado usa la posición actual, en lugar de forzar `0:00`. No cambia el proveedor ni la búsqueda de letras.

`stop` envía primero la orden de cortar audio. Las ediciones de Discord dejan de bloquear esa orden. La desconexión espera las escrituras de volumen pendientes para evitar recrear un player remoto después de salir. Si el nodo rechaza detenerse, se conservan pista y cola y se comunica el error.

## Publicación de Discord

El panel existente se edita por ID. Los cambios de pista dejan de detener y esperar el refresco anterior para borrar/enviar mensajes. Las publicaciones simultáneas conservan una en curso y una actualización con el estado más reciente, incluyendo el caso de creación inicial lenta. Los botones confirmados solicitan el refresco inmediatamente, sin el debounce de 200 ms; los ticks periódicos mantienen cinco segundos, pero se omiten mientras hay una edición pendiente. Los cambios reales conservan su petición de refresco. Un error transitorio no crea otro panel: la reposición de setup exige el error de mensaje inexistente.

La prueba de 21 publicaciones durante un envío retenido pasó de 21 envíos + 20 borrados a un envío + una edición final, en tres ejecuciones. Los tiempos completos del adaptador de 20 ms por escritura fueron 635/523/565 ms frente a 572/133/74 ms. El primer resultado nuevo coincidió con otras verificaciones y presenta ruido; la reducción estable es de 41 a dos escrituras, no una promesa de latencia en Discord real.

El transporte REST tenía `pipelining: 0`, que desactiva keep-alive. Ahora usa una solicitud por conexión a la vez y reutiliza conexiones inactivas hasta 15 s. Se mantienen timeout, reintentos y señales de cancelación. Comparación de solo lectura desde el mismo contenedor: tres rondas alternadas, cuatro consultas por configuración, 12 conexiones frente a tres y mediana de las nueve muestras calientes 56 → 25 ms. El dato preliminar de 52 ms no era la mediana consolidada. El ensayo no invocó botones ni envió mensajes reales.

## Demora observada en producción

Tras la primera corrección del panel, la instrumentación registró ocho operaciones lentas entre 1.942 y 10.656 ms; varias tardaron 5–10 s. Las primeras comparaciones sobre JSON serializado no se usan como prueba de desfase, porque podían confundir caracteres escapados con otra canción; la comprobación posterior compara directamente descripción y URI. Los tiempos de operación todavía no distinguían cola interna de HTTP. No se atribuyó automáticamente a Lavalink ni a un 429.

Se corrigió además la presión periódica: con una edición lenta, cada tick volvía a marcar un refresco pendiente, manteniendo trabajo continuo. Una regresión con el reloj controlado reproduce y evita esa repetición. Se registran por separado órdenes al nodo, operación completa de panel, HTTP de edición superior a un segundo y límites de Discord. Los registros de límites están acotados a uno cada diez segundos; contienen identificadores aleatorios, canal/guild con hash y tiempos, sin URL, credenciales, cuerpo, título o excepción del proveedor. Se conserva el transporte de Discord.js, sin consumir ni duplicar respuestas. La versión instalada puede reintentar un 429 inesperado sin emitir `rateLimited`; se observa también ese HTTP y su `Retry-After`, incluso si respondió rápido. Se mide aparte la lectura JSON con el mismo identificador de petición, conservando resultado, identidad y una única lectura. Un perfil con recursos reales descartó el render como causa principal: 6–18 ms, 23 lecturas y 68.812 bytes por panel. No se agregó un caché de assets sin una mejora medida.

La separación HTTP confirmó respuestas reales 429 con `Retry-After` de 1–2 s mientras operaciones de panel completaban en 8–12 s; la lectura JSON no registró demoras superiores a un segundo en esa muestra. El evento habitual de la librería no había mostrado estos reintentos. Se añadió una pausa adaptativa del progreso periódico del canal: al recibir cada 429, cede al menos diez segundos, o el doble de una espera mayor anunciada por Discord. Esto reduce la competencia de las actualizaciones de fondo; cambios de pista y botones conservan sus solicitudes inmediatas. Se respetan los reintentos del SDK. La prueba con reloj controlado verifica suspensión del tick, refresco explícito durante esa pausa y reanudación posterior.

## Verificación y recuperación

Suite final: 575/575; imagen aislada sin red externa: 95/95; 31 hashes comprobados, UID 1000 y sin `.env`. Los fallos iniciales reprodujeron reloj pausado, posición descartada, stop detrás de Discord, publicaciones acumuladas, lectura previa y ticks pendientes. Las pruebas del transporte usan Discord REST y un servidor local real, no solo inspección de opciones. Los casos de generación se adaptaron a la edición directa: una petición ya enviada puede terminar, pero el refresco siguiente usa la generación actual.

Código `cd336f8bec50091fb861661e0ef358134f46c5e0`, imagen `234ca907361e49e870ff0f7efb8b1c76e3119daab76d1803bf592866a7f24c8b`, etiqueta `release-panel-backoff-20261017`. Etapas anteriores de esta corrección: `cba8b52`, `390f10e`, `aa61812` y `65175f3`. Se recreó exclusivamente el bot con cierre y recuperación de sesión existentes. El resultado operativo actualizado está en [la evidencia redactada](evidence/player-state-sync-runtime.json).

Se preservan los 19 comandos raíz, Fun con 22 opciones, el mapa de 295 emojis y los Me gusta. La lectura de la aplicación devolvió 330 emojis totales: no confundir ese total con los 295 mapeados. GDjkhp continúa seleccionado; Serenetia/MilloHost respaldan. Privado apagado/excluido, sin WARP ni puerto 2333; Images/Redis y las 16 entradas locales previas se conservan. No hubo cambios de dependencias, permisos ni autenticación.

Recuperación vigente: `.runtime/bot-recovery-public-only.yml`. Rollback previo a estas correcciones: `release-control-latency-20261017`; la imagen intermedia `release-panel-response-20261017` conserva el reloj y la reutilización del panel, pero no evita la presión periódica ni distingue HTTP de cola. Recrear solo bot con principal GDjkhp, registro actual y privado excluido; no revertir Mongo. La observación de arranque y del panel no equivale a una medición de latencia humana de todos los botones.

Contratos: [estado WebSocket Lavalink](https://lavalink.dev/api/websocket#player-state), [Update Player](https://lavalink.dev/api/rest#update-player), [estructuras de Shoukaku](https://github.com/shipgirlproject/Shoukaku), [MessageManager.edit](https://discord.js.org/docs/packages/discord.js/14.27.0/MessageManager%3AClass), [keep-alive de Undici](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md), [límites de Discord](https://docs.discord.com/developers/topics/rate-limits).

## Cierre solicitado y limpieza

El usuario pidió finalizar esta intervención, eliminar los scripts de pruebas y también los tests automatizados añadidos, y actualizar la rama para preparar su propio plan fuera de esta sesión. Las cifras 575/95 son la verificación histórica anterior a esa limpieza; los archivos pueden recuperarse del historial. En la rama actual quedan los tres archivos de tests originales del proyecto: 25 casos pasan. Se retiraron 122 archivos de pruebas/ayudantes y 28 scripts auxiliares; CI conserva las comprobaciones originales y el build, sin apuntar a verificadores borrados.

La última muestra tras la pausa adaptativa todavía registra HTTP 429 y tres ediciones de 3.357/6.605/4.444 ms en 149 s. El panel consultado coincide en título y URI con la canción, pero la latencia de todos los botones no quedó verificada. La propuesta de usar respuestas de interacción para las ediciones del panel no se implementó, al cambiar la tarea a limpieza y entrega. Véase [el estado para retomar](HANDOFF.md).

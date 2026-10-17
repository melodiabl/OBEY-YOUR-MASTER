# Música: continuidad de audio, botones y mensajes

Investigación del 17/10/2026. Propuesta para Codex basada en fuentes primarias y lectura del paquete OBEY. No se cambiaron nodos, configuración ni código; no se ejecutó una prueba conectada. El objetivo es reducir latencia y cortes con medición, sin prometer ausencia absoluta de fallos de red o límites de Discord.

## 1 Separar los problemas antes de configurar

| Síntoma | Ruta que hay que medir | No confundir con |
| --- | --- | --- |
| Audio entrecortado durante una pista | Fuente → motor de audio → transporte de voz → cliente oyente | Frecuencia de edición de embeds |
| Pausa/skip tarda en aplicarse | Recepción, autorización, cola de acciones, petición al nodo y confirmación | Tiempo que tarda el mensaje en reflejarlo |
| El audio cambia pero el título queda anterior | Estado confirmado → cola de publicación → REST Discord → cliente | Que Lavalink no cambió la pista |
| El botón muestra interacción fallida | Tiempo de ACK y resultado del endpoint de interacción | Estado final de reproducción |
| Silencio entre canciones | Fin de pista, selección, resolución/autoplay, inicio y primer audio | Cortes dentro de una canción |

Ningún único parámetro de buffer resuelve las cinco rutas. Registrar por separado latencia de control, presentación y audio. El RTT bot–nodo no mide por sí solo la ruta de voz nodo–Discord–oyente.

## 2 Qué usan los proyectos consultados

Estas son configuraciones o patrones visibles en sus fuentes, no una clasificación de popularidad ni una prueba comparativa de que no tengan lag.

| Proyecto y fuente | Configuración/patrón observado | Aplicación propuesta en OBEY |
| --- | --- | --- |
| Red-DiscordBot, `managed_node/ll_server_config.py` [M1] | Defaults de buffer 400 ms, frame buffer 1000 ms y playerUpdateInterval 1 | Referencia de estado frecuente; el buffer corto requiere comprobar estabilidad de la fuente y carga |
| JMusicBot, `NowplayingHandler.java` [M2] | Refresco programado cada cinco segundos cuando no usa imágenes NP; guarda canal/messageId y edita por ID | Conservar mensaje persistente y separar ritmo del panel del estado del nodo |
| Muse, `services/player.ts` y recuperación de voz [M3] | Reproducción local con voice/FFmpeg, caché, reconocimiento de audio utilizable antes de resolver inicio y control de intentos/generaciones | Reutilizar ideas de recuperación y descarte de resultados viejos; no copiar su pipeline a Shoukaku |
| Discord Player, guía oficial de rendimiento [M4] | Recomienda evitar bloqueo del event loop, trabajo/filtros innecesarios y consultas costosas repetidas | Perfilar el proceso del bot; no trasladar flags de otra biblioteca a Lavalink |
| Lavalink, ejemplo de configuración [M5] | NAS 400 ms, frame buffer 5000 ms, Opus 10, resampling LOW y estado cada cinco segundos | Referencia para un nodo Java propio, no configuración automática del bot |
| NodeLink, configuración `dev` [M6] | Cluster y workers de fuente especializados; `playback.playerUpdateInterval: 2000` y audio high/best en la muestra | Separar cómputo de fuentes y audio; verificar versión, unidades y esquema antes de adaptar |

Las fuentes de Red/Muse/NodeLink son ramas de desarrollo consultadas. Registrar tag/commit exacto antes de reproducir un despliegue. Rythm/Hydra no se usaron como evidencia de parámetros internos: no se dispone aquí de su configuración privada verificada.

## 3 Evidencia específica del paquete OBEY

Se revisó la copia del ZIP basada en c8ba6d3 con el refactor local descrito en la entrega, no el estado de un servidor en vivo.

| Archivo | Conducta visible | Decisión |
| --- | --- | --- |
| `handlers/music/liveupdate.js` | Tick de cinco segundos; una edición en curso y una petición del estado más reciente; pausa de progreso tras 429 | Conservar agrupación; ampliar coordinación a otros productores de mensajes |
| `handlers/music/index.js` | ACK `deferUpdate` iniciado temprano; control de nodo puede avanzar en paralelo; refresco inmediato tras acciones | Medir ACK, nodo y publicación por separado; no atribuir toda demora al control |
| `handlers/music/lyricsLive.js` | Tick de 500 ms; compara payload, guarda busy y permite edición tras al menos 1000 ms; no consulta `progressDeferred` del panel | Integrar letras en la política de publicación; conservar guardas existentes |
| `handlers/project/discord-rest.js` | Reutiliza conexiones, observa PATCH de mensajes y 429; callback de backoff al progreso del panel | No duplicar el parche keep-alive; ampliar métricas si se usan callbacks/webhooks |
| `handlers/music/node-player.js` | Conserva estado de la respuesta PATCH en contexto por operación | Mantener; no agregar GET para cada botón |
| `handlers/music/playback-clock.js` | Reloj anclado con posición confirmada y estado de pausa/velocidad | Mantener interpolación; no esperar cada paquete WS para pintar posición |
| `handlers/music/nodes.js` | Ordena preferencia, visibilidad y prioridad antes de penalties | Selección por salud como propuesta; evitar migrar una sesión continuamente por ping |

El informe incluido `docs/platform/PLAYER-STATE-SYNC.md` documenta históricamente 429 con esperas de uno/dos segundos y, tras el backoff, tres ediciones de 3357/6605/4444 ms en una muestra de 149 s. El handoff mantiene pendiente verificar toda latencia de botones. Son mediciones anteriores; no se presentan como ensayos de esta investigación.

[Inferencia] Cuando letras y panel comparten canal, el bucle de letras puede seguir ejerciendo presión mientras el progreso del panel cede. Debe correlacionarse con buckets/429 y A/B de letras antes de afirmarlo como causa del retraso actual.

[Inferencia] Las prioridades del pool pueden mantener un nodo preferido aunque otro tenga mejor condición de carga; no demuestra que esté causando cortes, pero hace insuficiente recomendar solo el menor ping.

## 4 Política propuesta de botones y publicación

Discord exige una respuesta inicial de interacción dentro de tres segundos. `deferUpdate` confirma recepción y permite editar el mensaje de componente después; no confirma que la pausa o el skip hayan ocurrido [M7].

1. Resolver guardas locales y comenzar ACK sin esperar búsquedas, Mongo, letras o una edición de progreso. Si la autorización requiere consulta lenta, diferir sin ejecutar la acción hasta validarla.
2. Serializar acciones que cambian sesión por guild y conservar `sessionId/playbackId/generation`. No compartir la cola de acciones de negocio con toda la espera REST del panel.
3. Ejecutar la orden al nodo y usar la confirmación ya conservada por StatePlayer. Diferenciar estado deseado, pendiente y confirmado; no mostrar éxito por haber hecho ACK.
4. Solicitar la publicación del estado confirmado con prioridad de acción. Mantener un solo escritor por mensaje y una única revisión pendiente reciente.
5. Coordinar el presupuesto de mensajes por bucket/recurso observado: el panel, letras y otras actualizaciones de fondo no deben competir sin conocerse. No suponer que todos los endpoints comparten el mismo bucket ni que editar dos mensajes permite eludirlo.
6. Si llega 429, respetar Retry-After y el SDK. Posponer progreso y letras de fondo; conservar el estado más reciente pendiente y evitar reintentos paralelos de la aplicación.
7. En cargas normales, proponer progreso cada 10–15 s en lugar de cinco como variante A/B. Los cambios de pista/pausa/loop son eventos y no esperan al tick periódico. Es un parámetro del panel, no del nodo.
8. El mismo payload no necesita otra edición. El timestamp relativo de Discord puede expresar cuándo termina una pista sin refrescar ese texto cada segundo [M9]; la barra textual de progreso sigue necesitando ediciones si se desea moverla.

Los callbacks de interacción no están sujetos al límite global de bots, pero esto no demuestra que carezcan de límites de ruta/recurso [M8]. Evaluar `deferUpdate → editReply` para el mensaje que originó el botón con métricas comparables. No usarlo como promesa de quitar todo 429.

Un endpoint distinto no debe crear un segundo escritor: una edición de canal antigua en curso podría terminar después y sobrescribir un estado nuevo. Compartir revisión/generación y garantizar el refresco final vigente. Una petición enviada no se considera cancelada solo por cambiar un contador local.

Si se guardan referencias a interacciones para publicar, mantenerlas solo en memoria, con plazo y limpieza; no persistir/loguear tokens. Al vencer la interacción o cambiar el mensaje del panel, usar el transporte permitido para el destino actual o pedir un nuevo panel, sin repetir la acción de negocio.

No usar `interaction.update` después de diferir la misma interacción. Para una acción verdaderamente rápida puede responderse con actualización directa, siempre tras obtener el resultado y dentro del plazo; los controles de red usan la vía diferida por defecto.

## 5 Letras sincronizadas sin saturar el panel

La muestra actual ya evita solapamiento del mismo bucle y payloads iguales. Conservar eso. Añadir prioridad inferior a los controles, última línea vigente y pausa compartida de fondo cuando el canal esté limitado.

Durante congestión, proponer una ventana de letra más amplia, actualización menos frecuente o letras estáticas. Mostrar el estado degradado de sincronización cuando corresponda. No intentar una edición por sílaba; el cliente Discord y sus límites no son un reloj de karaoke de precisión.

El scheduler debe descartar vistas viejas de letras, no acciones de usuario. `skip` repetidos no equivalen a un solo `skip`; un cambio absoluto de volumen puede agruparse hacia el valor final, conservando los incrementos solicitados. Stop invalida recomendaciones/búsquedas tardías y prioriza cortar audio; la limpieza de mensajes puede terminar aparte.

Separar la espera de fin de audio de la limpieza del panel con un contrato de resultado claro. El stop actual ya envía al nodo antes de esperar el panel, pero su método aún espera limpiezas posteriores: auditar el tiempo total antes de declarar resuelto el bloqueo de acciones siguientes.

## 6 Perfil inicial para un Lavalink Java propio

Ejemplo parcial de evaluación, no archivo listo para desplegar ni configuración del nodo público actual. Conciliar con la versión exacta, fuentes/plugins, credenciales y límites del host. No encender el nodo privado retirado por incluir este ejemplo.

```yaml
lavalink:
  server:
    bufferDurationMs: 400
    frameBufferDurationMs: 5000
    opusEncodingQuality: 10
    resamplingQuality: LOW
    nonAllocatingFrameBuffer: false
    useSeekGhosting: true
    playerUpdateInterval: 2
```

Este perfil conserva los valores del ejemplo oficial salvo proponer estado cada dos segundos. Su propósito es una línea base, no certificar que funcione mejor. `playerUpdateInterval` en Lavalink se expresa en segundos y publica estado, no obliga a editar embeds [M5, M10].

| Ajuste | Ensayo propuesto | Qué medir |
| --- | --- | --- |
| Frame buffer | Empezar 5000 ms; evaluar 1000–2000 solo con fuente estable | Cortes, rebuffer, memoria e inicio/seek percibidos |
| NAS | Empezar 400 ms; aumentar solo si las pausas/GC lo justifican | Frames deficit/nulled y pausas GC |
| Opus | Empezar con calidad 10 si hay CPU; comparar 7 o 5 ante saturación | CPU por carga, continuidad y evaluación auditiva |
| Resampling | Empezar LOW; comparar MEDIUM/HIGH solo con margen | CPU y mejora audible, sin asumir que más alto reduce lag |
| Frame buffer no asignante | Mantener false inicialmente | CPU/GC frente a efectos sobre cambios de volumen |
| Estado del nodo | Probar dos segundos; uno si hay motivo y capacidad | Carga WS, corrección de reloj y latencia de confirmación |

La documentación oficial advierte el costo CPU de calidad alta y el compromiso de buffers [M5]. No reducir buffers a cero o aumentar todos a la vez. Tampoco llamar timeout al tiempo que un audio puede estar en buffer: aumentar timeouts no acelera ninguna operación.

## 7 NodeLink y nodos públicos

El material de OBEY identifica históricamente GDjkhp como NodeLink 3.10.0-dev; eso no verifica su versión o salud actuales. Un YAML Java no configura ese motor. La fuente NodeLink consultada tiene `config.default.ts` en rama `dev`; otras versiones usan `config.js`. Confirmar esquema y unidades en la versión del operador antes de transferir parámetros [M6].

Si el nodo es público, desde OBEY puede elegirse y monitorizarse, pero no cambiarse su CPU, buffering, workers o red. Seleccionar por compatibilidad y estabilidad de reproducción: errores, jitter, carga, déficit de frames y ruta de voz además de RTT. La región del usuario, del bot y del nodo de voz no son el mismo punto de red.

No cambiar de nodo ante cada fluctuación. Proponer enfriamiento, umbral sostenido y recuperación por sesión con cancelación. Conservar preferencia explícita del gestor cuando sea viable; si se aplica fallback por fallo, explicarlo y registrar el motivo.

En nodo propio: aislar audio del trabajo pesado de fuentes cuando el motor lo permita; controlar CPU realmente disponible al contenedor, memoria, GC y UDP de salida. No fijar workers por núcleos anunciados sin medir CPU compartida/throttling. No habilitar todos los filtros o plugins para buscar estabilidad.

## 8 Medición y aceptación

Instrumentar un mismo operationId, con reloj monotónico, en recepción, ACK, entrada/salida de cola, petición al nodo, confirmación, solicitud de publicación y final REST. Separar tiempo total del SDK, intentos HTTP y espera por rate limit; no sumar spans paralelos como si fueran secuenciales.

Para voz, registrar ping que informa el nodo, reconexiones, eventos stuck/exception y frames cuando estén disponibles. Lavalink diferencia ping de voz y stats de frames; `frameStats: null` o éxito HTTP no acreditan audio continuo [M10]. La audición final requiere un oyente o captura autorizada; no habilitar grabación de usuarios de forma implícita.

| Objetivo propuesto | Condición y límite |
| --- | --- |
| ACK p95 <500 ms | Desde recepción del handler hasta callback completado; además contar fallos y plazos de tres segundos |
| Control confirmado p95 <1000 ms | Sesión ya conectada y carga nominal; medir nodo y cola aparte |
| Panel confirmado p95 <1500 ms | Subconjunto sin rate limit y resultado del control ya conocido; publicar también percentiles globales |
| Menos 429 y sin backlog creciente | Comparar solicitudes/minuto, backlog, errores y estado mostrado, con y sin letras |
| Continuidad | Cero cortes observados en una sesión de prueba definida, sin convertirlo en garantía futura |

Son metas de ingeniería pendientes, no resultados ni garantías de Discord. Registrar N, duración, número de players, nodo, fuente, filtros, región, carga y desconexiones. Mantener los fallos/timeouts en los resultados; no mejorar percentiles eliminándolos silenciosamente.

Prueba acotada propuesta: misma pista/fuente y condiciones, 30 minutos de base y variante con al menos 30 controles distribuidos, sin spam; después probar la concurrencia real autorizada. Separar letras apagadas/encendidas. Para comprobar scheduler bajo 429, usar transporte simulado local; no provocar límites de Discord con carga artificial.

No declarar resuelto por una única canción, ping bajo, cero reinicios o respuesta 200 a búsqueda. Autoplay requiere su propia prueba de candidatos, cancelación y avance; precargar metadatos del siguiente track puede ensayarse con TTL y concurrencia limitada, sin duplicar reproducción o descargar catálogos enteros.

## 9 Trabajo concreto para Codex

1. Reconfirmar SHA/runtime y reproducir el síntoma en entorno aislado.
2. Medir las tres rutas antes de tocar buffers o dependencias.
3. Unificar la política de publicación del panel/letras y probar la variante de progreso 10–15 s.
4. Evaluar transporte de respuesta de interacción dentro del escritor único, preservando Soundy y doce IDs.
5. Corregir dependencias de presentación que bloqueen el camino crítico; mantener resultado confirmado y limpieza diferida explícitos.
6. Si persisten cortes de voz, evaluar nodo/fuente con métricas de audio; aplicar perfil solo en un nodo propio autorizado y compatible.
7. Comparar A/B y registrar p50/p95/p99, fallos y límites; conservar rollback de código y configuración por separado.

Estas tareas amplían la ficha music, no autorizan implementar otro motor, reactivar el nodo privado, publicar comandos ni desplegar. No restaurar las herramientas retiradas. Estado de todas: pendiente de implementación/medición.

## 10 Fuentes y trazabilidad

| ID | Fuente primaria |
| --- | --- |
| M1 | [Red: configuración del nodo](https://github.com/Cog-Creators/Red-DiscordBot/blob/V3/develop/redbot/cogs/audio/managed_node/ll_server_config.py), blob `f16eef42fc6db24b0895f868cafda7fb10d21220`, leído por GitHub |
| M2 | [JMusicBot: NowplayingHandler](https://github.com/jagrosh/MusicBot/blob/master/src/main/java/com/jagrosh/jmusicbot/audio/NowplayingHandler.java), blob `e09e3e643227df650b1ebd0c4c76efe01e0e3ad4`, leído por GitHub |
| M3 | [Muse: player](https://github.com/museofficial/muse/blob/master/src/services/player.ts), blob `453eb3fe9a5bad80cdacdcefed93fcd34d5fd1ca`; [recuperación](https://github.com/museofficial/muse/blob/master/src/services/voice-connection-recovery.ts), blob `675954b4e5809509991045e17a5ee5d771fd8f27` |
| M4 | [Discord Player: optimización](https://discord-player.js.org/docs/faq/performance_optimization) |
| M5 | [Lavalink: archivo de configuración](https://lavalink.dev/configuration/config/file) |
| M6 | [NodeLink: configuración](https://nodelink.js.org/docs/config); [defaults dev](https://github.com/PerformanC/NodeLink/blob/dev/config.default.ts), blob `bf5f98b92f2f71f41e20673f47add7af7992c68d`, leído por GitHub |
| M7 | [Discord: respuestas de interacción](https://docs.discord.com/developers/interactions/receiving-and-responding) |
| M8 | [Discord: rate limits](https://docs.discord.com/developers/topics/rate-limits) |
| M9 | [Discord: formatos de timestamp](https://docs.discord.com/developers/reference#message-formatting-timestamp-styles) |
| M10 | [Lavalink: estado, ping y frames](https://lavalink.dev/api/websocket) |
| M11 | [Node: medición de rendimiento](https://nodejs.org/api/perf_hooks.html), usar solo APIs compatibles con el runtime fijado |

En OBEY se leyeron los archivos enumerados en la sección 3, además de action-queue, nodes-runtime, stop/pause/volume y los informes PLAYER-STATE-SYNC/HANDOFF/PUBLIC-NODE-RESEARCH. Las mediciones históricas de esos informes no se volvieron a ejecutar. No se consultaron credenciales privadas de terceros ni se probaron nodos públicos en esta investigación.

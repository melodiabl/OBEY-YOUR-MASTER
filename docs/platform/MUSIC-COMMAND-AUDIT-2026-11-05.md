# Comandos de música: referencias Lavalink y adaptación de OBEY

El problema de OBEY no se limita al catálogo web. Los comandos conservan comportamientos distintos entre prefix y slash y algunos confirman acciones después de ocultar errores. Esta revisión compara sus recorridos con implementaciones públicas y corrige primero pausa, reanudación, salto y detención. No acredita que todos los comandos ni los nodos públicos funcionen sin errores.

## Referencias y alcance

Se consultaron 73 archivos mediante GitHub, fijando revisión y hash. La [evidencia](evidence/music-command-audit-20261105.json) incluye todos los archivos consultados y el mapa individual de los 104 adaptadores registrados en Music, Playlist y Filter. El mapa es una revisión estructural; las aceptaciones funcionales del inventario mantienen su estado anterior.

| Proyecto | Revisión y fecha | Alcance consultado |
| --- | --- | --- |
| [Lavamusic](https://github.com/fandyahmd/lavamusic/tree/8c1edf0ae95f70887ce2e54e9f4e3e9429aa8bac/src/commands) | `8c1edf0a`, 22/10/2025 | Todos los archivos de comandos music, filters y playlist; eventos de pista/cola/error, contexto compartido y dependencias. Usa lavalink-client. |
| [Discord-Lavalink-Music-Bot](https://github.com/tsukache/Discord-Lavalink-Music-Bot/tree/3bacc84d232ce251e605c6d81658e5fd539bfee0/commands) | `3bacc84d`, 14/10/2025 | Todos los archivos de commands, arranque y dependencias. Usa lavalink-client. |
| [Red-DiscordBot](https://github.com/Cog-Creators/Red-DiscordBot/tree/8c726ff446960a0bf7857b6b94f4a2e05c16c31b/redbot/cogs/audio/core/commands) | `8c726ff4`, 25/10/2026 | Player, controller, queue, equalizer y playlists. Referencia de validación de acceso y operaciones del reproductor Lavalink. No se revisó todo Red. |

Los dos primeros snapshots tienen más de un año. Sirven para estudiar recorridos, no como recomendación de instalar sus versiones de dependencias. No se ejecutó código de las referencias ni se incorporó a OBEY. La adaptación se escribió sobre NyxLink 0.1.0-dev.2 ya instalado.

## Comparación por recorrido

| Recorrido | Patrón encontrado | OBEY y adaptación necesaria |
| --- | --- | --- |
| play, playnext/playtop, playskip | Lavamusic separa añadir la primera coincidencia, añadir una colección e insertar al frente. | OBEY play abre el mismo selector que search. Playtop/playskip conservan rutas distintas. Unificar la inserción y su cancelación antes de simplificar play. Pendiente. |
| search | Las referencias reservan un menú para elegir un resultado. | Mantener artistas/álbumes como navegación explícita. No conectar voz por abrir una búsqueda. El picker compartido ya consulta por categoría. |
| pause, resume | Estado solicitado explícito; el bot tsukache espera el resultado y captura el fallo. | Prefix pause alternaba pausa; resume ocultaba fallos. Corregido: estado explícito e idempotente en ambos transportes. El botón de pausa conserva la alternancia. |
| skip, skipto/jump | Validar cantidad/posición y avanzar con el motor. | Slash skip repetía la operación y podía reproducir canciones intermedias. Corregido skip por lote con una única reproducción; jump sigue siendo un recorrido distinto pendiente de aceptación. |
| stop, leave | Diferenciar detener de destruir el reproductor según el producto. | OBEY stop detiene, vacía y desconecta. Se conservó esa semántica; slash también puede cancelar durante una carga sin pista activa. Se informa si guardar la detención sigue pendiente. |
| queue, clearqueue, remove, move, duplicates | Leer y modificar la cola que posee el cliente. | Mantener Queue nativa y posiciones comprobadas. Revisar confirmaciones de los adaptadores antiguos; no crear una segunda cola. |
| nowplaying, history, grab | Mostrar el estado del reproductor o datos persistidos según la operación. | No anunciar la siguiente pista basándose solo en el primer elemento anterior de la cola. Los comandos centrales corregidos confirman únicamente la acción aplicada. |
| seek, forward, rewind, replay | Comprobar duración, seekable y emisión en directo. | OBEY ya tiene runSeek y posición confirmada. Conservar milisegundos internos y límites de streams. |
| loop, shuffle, unshuffle | Modos explícitos y operaciones de cola diferentes. | Unshuffle llama a shuffle: su nombre no ofrece restaurar el orden. Resolver el contrato y la implementación en una unidad propia. Pendiente. |
| autoplay y mezclas | El modo requiere un proveedor de recomendaciones, no solo un booleano. | Conservar autoplay nativo y la política de grabaciones; validar con las fuentes del nodo público. No añadir otro planificador que avance pistas. |
| filters, equalizer, volumen | Esperar la actualización antes de confirmarla. | Varios prefix de filtros reaccionan con éxito incluso después de capturar un error. Pendiente corregir sus respuestas y validar capacidades. |
| lyrics | El soporte puede proceder de plugins o un proveedor independiente. | Consultar la capacidad del nodo y la identidad de la grabación; no asumir letras sincronizadas por tener websocket conectado. |
| playlist, Me gusta | Persistencia y autorización separadas de resolver/enviar pistas. | Mantener las playlists y Me gusta de OBEY; usar el mismo recorrido cancelable al reproducirlas. La revisión no modifica datos. |
| join, reconnect, moveme, 247 | Conexión y cambio de canal con estado y permisos comprobados. | Conservar voice-session y los permisos frescos ya implementados. No cambiar de canal por una consulta de catálogo. |
| radio y proveedores retirados | El protocolo de audio y la lista de fuentes son decisiones independientes. | Mantener radio HTTP y los proveedores permitidos de OBEY. Los ejemplos con archivos locales, SoundCloud u otros servicios no habilitan esas fuentes aquí. |
| voteskip, forceskip, removevoteskip | Red diferencia votos y privilegios dentro de su control de salto. | OBEY voteskip llama directamente a skip y removevoteskip dice que no hay sistema de votación. Se necesita una implementación real o una retirada compatible; no presentar el salto directo como una votación. Pendiente. |

Las referencias también contienen riesgos: Lavamusic Pause/Resume/Seek llaman operaciones sin await; su Search conecta antes de seleccionar. El Search de tsukache también conecta al abrir resultados. Su Resume introduce recarga de pistas/archivos locales. Esos comportamientos no se trasladan a OBEY.

Fuentes de los recorridos centrales: [Lavamusic Play](https://github.com/fandyahmd/lavamusic/blob/8c1edf0ae95f70887ce2e54e9f4e3e9429aa8bac/src/commands/music/Play.ts), [Search](https://github.com/fandyahmd/lavamusic/blob/8c1edf0ae95f70887ce2e54e9f4e3e9429aa8bac/src/commands/music/Search.ts), [Pause](https://github.com/fandyahmd/lavamusic/blob/8c1edf0ae95f70887ce2e54e9f4e3e9429aa8bac/src/commands/music/Pause.ts), [tsukache Pause](https://github.com/tsukache/Discord-Lavalink-Music-Bot/blob/3bacc84d232ce251e605c6d81658e5fd539bfee0/commands/pause.js), [Skip](https://github.com/tsukache/Discord-Lavalink-Music-Bot/blob/3bacc84d232ce251e605c6d81658e5fd539bfee0/commands/skip.js), [Red controller](https://github.com/Cog-Creators/Red-DiscordBot/blob/8c726ff446960a0bf7857b6b94f4a2e05c16c31b/redbot/cogs/audio/core/commands/controller.py).

## Contrato para nuestros nodos públicos

1. NyxLink conserva Player, Queue y la cola nativa de operaciones. Los adaptadores no implementan otra reproducción paralela.
2. Pausa y reanudación de comandos son estados explícitos. Solo el botón compartido alterna. Una segunda petición de pausa no reanuda la música.
3. El salto múltiple elimina los candidatos intermedios mediante Queue y solicita una sola transición. Si el backend la rechaza, restaura los candidatos únicamente en la misma sesión vigente. Stop invalida el trabajo y evita restauraciones tardías.
4. El éxito se publica después de completar la operación. Un fallo del nodo no se convierte en una confirmación verde ni expone su respuesta privada.
5. Lavalink v4 define las operaciones comunes del reproductor y su información de fuentes, filtros y plugins. NodeLink amplía esa API. No se supone que dos nodos públicos ofrezcan las mismas extensiones.
6. Spotify/Apple aportan metadatos y pueden necesitar resolver audio en otra fuente; una búsqueda correcta no demuestra reproducción. Mantener la comprobación de grabación y la distinción entre error de catálogo y salud del nodo de audio.

Fuentes de protocolo: [Lavalink Update Player](https://lavalink.dev/api/rest#update-player), [Info](https://lavalink.dev/api/rest#get-lavalink-info), [NodeLink API](https://nodelink.js.org/docs/api). La firma y semántica concretas usadas se comprobaron además en Player.js y Queue.js de NyxLink instalado: skip(position) no equivale a saltar repetidamente N canciones y no elimina automáticamente todos los elementos anteriores.

## Verificación y orden siguiente

Se reprodujeron seis fallos antes del cambio. Tras corregirlos pasan 74 pruebas, incluidas las anteriores, los comandos prefix/slash y Player/Queue reales de NyxLink con transporte externo simulado. Se comprueban solicitudes simultáneas de pausa, un único envío al saltar varias canciones, límites, rechazo del backend, recuperación para reintentar y Stop durante el salto. Los textos se comparten en ES/EN.

El orden siguiente es: unificar play/playtop/playskip y separar play de search; resolver la semántica de votos y unshuffle; corregir respuestas de filtros y el resto de adaptadores antiguos; comprobar capacidades y errores con ambos backends públicos; realizar aceptación con audio real. El rediseño visual del player sigue siendo una unidad distinta. Ninguna prueba aislada cierra por sí sola la aceptación operativa de P1.

## Estructura migrada en esta unidad

El catálogo compartido, su acceso a nodos, el selector Discord y sus vistas se trasladaron a `bot/modulos/musica/{servicios,datos,comandos,vistas}`. La entrada HTTP está en `api/rutas/musica/http.js`. Se actualizaron los consumidores y se retiraron las cinco ubicaciones antiguas, sin reexportaciones. También se eliminó `handlers/music/searchui.js`, una vista duplicada sin consumidores activos. [Árbol real y frontera temporal](../../bot/modulos/musica/LEER.md).

El contrato HTTP del catálogo se comprueba con Express y peticiones HTTP reales en loopback: conserva tipo y fuente, deniega acceso y mantiene los códigos 400/429/503 sin exponer errores privados. Los middleware existentes permanecen en el registro de rutas. La migración conserva las funciones del player EJS hasta contar con su reemplazo React; no se presenta esta unidad como toda la arquitectura terminada.

## Aclaración de producto: búsqueda y catálogo web

El propietario distingue dos entradas: los comandos parten de una consulta; la web ofrece tanto búsqueda como un catálogo inicial navegable sin escribir nada. La carga inicial debe consumir datos del proveedor, con recursos y secciones que puedan abrirse, sin listas de canciones/artistas incrustadas en el código ni consultas genéricas presentadas como tendencias oficiales. La interfaz web no reutiliza el selector de Discord ni necesita un iframe de Spotify.

Los servicios compartidos trasladados en esta unidad resuelven consultas y operaciones de selección. No implementan por sí solos el catálogo inicial. La entrada HTTP conserva por ahora la búsqueda; la navegación inicial y la sustitución del player EJS siguen pendientes.

Se comprobaron, sin voz, dos filtros de álbumes Spotify mediante los nodos públicos: `tag:new` y `year:2026`. Ambos devolvieron un álbum. Esto prueba acceso parcial al catálogo por filtros, no un feed inicial completo ni paginación. La documentación de Spotify permite filtros de búsqueda como `tag:new`; su guía de febrero de 2026 también limita las funciones Browse disponibles para aplicaciones Development Mode. No debe suponerse que habilitar una credencial o conectar un nodo proporcione automáticamente todas las secciones de Spotify.

Fuentes: [filtros de búsqueda Spotify](https://developer.spotify.com/documentation/web-api/reference/search), [cambios Development Mode](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide). La implementación siguiente debe confirmar el contrato y los datos disponibles del proveedor antes de presentar la portada como terminada.

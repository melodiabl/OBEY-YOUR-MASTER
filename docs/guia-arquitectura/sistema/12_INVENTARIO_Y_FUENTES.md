# Inventario y fuentes

Fecha: 17/10/2026. Rama: `feature/obey-main-implementation`. Árbol remoto consultado: `c8ba6d3ee86515813e68a028e1221d093301e91b`. No se cambió el código del bot en esta ampliación documental.

Revisado directamente: package.json; registro de capacidades; registro de comandos; servicio común de configuración; manifest musical; player-events; liveupdate; registro y presentación de assets; HANDOFF; plan maestro vigente. Se leyó el árbol del repositorio y las fichas del ZIP para conciliar rutas. No se revisó línea por línea cada comando ni se ejecutaron servicios conectados. Los hallazgos de auditorías previas se conservan con su fecha y no cuentan como verificación nueva.

## Hechos observados

Shoukaku ^4.3.0 figura en package.json; lavalink-client aún no. Los doce IDs musicales están en el manifest. El servicio común declara bienvenida con canal/mensaje. El publicador musical tiene un intervalo de cinco segundos y agrupa ediciones en vuelo. Player-events ya contiene protecciones de identidad: conservarlas al migrar, no asumir que no existen.

El plan anterior describe diferencias entre ZIP y remoto y bootstrap local 887bb6e. Esta revisión no vuelve a atribuir todo ese trabajo al SHA remoto. El ZIP incluye el material base anterior y esta guía; la migración no está implementada.

## Inventario estático de archivos de comandos

Estos conteos son archivos del árbol por carpeta, no número de comandos registrados o funciones listas. Incluyen utilidades/rutas que deben leerse y conciliarse. Usar buildCommandCatalog del registro para conocer las entradas efectivamente cargadas.

| Carpeta o archivo de primer nivel | Archivos |
| --- | --- |
| `commands/Administration` | 73 |
| `commands/Anime-Emotions` | 34 |
| `commands/Custom-Queue` | 1 |
| `commands/Economy` | 26 |
| `commands/Filter` | 17 |
| `commands/Fun` | 69 |
| `commands/Info` | 47 |
| `commands/MiniGames` | 39 |
| `commands/Music` | 55 |
| `commands/Owner` | 19 |
| `commands/Programming` | 6 |
| `commands/Ranking` | 15 |
| `commands/School-Commands` | 5 |
| `commands/Settings` | 21 |
| `commands/Setup` | 59 |
| `commands/Soundboard` | 102 |
| `commands/Voice` | 1 |
| `slashCommands/Admin` | 2 |
| `slashCommands/Anime` | 1 |
| `slashCommands/Birthday` | 4 |
| `slashCommands/Config` | 10 |
| `slashCommands/Economy` | 8 |
| `slashCommands/Favorites` | 2 |
| `slashCommands/Fun` | 22 |
| `slashCommands/Giveaway` | 6 |
| `slashCommands/Info` | 25 |
| `slashCommands/Invites` | 4 |
| `slashCommands/Moderation` | 12 |
| `slashCommands/Music` | 25 |
| `slashCommands/Playlist` | 7 |
| `slashCommands/Rank` | 3 |
| `slashCommands/Soundboard` | 1 |
| `slashCommands/Ticket` | 4 |
| `slashCommands/Welcome` | 5 |
| `slashCommands/chat.js` | 1 |
| `slashCommands/nodes.js` | 1 |

## Fuentes primarias consultadas

- [Repositorio OBEY](https://github.com/melodiabl/OBEY-YOUR-MASTER/tree/feature/obey-main-implementation).
- [Paquete lavalink-client](https://github.com/Tomato6966/lavalink-client/blob/main/package.json): main declara 2.11.0 y exports require/import; esto no prueba que esa versión esté publicada o probada con OBEY.
- [Configuración del cliente](https://tomato6966.github.io/lavalink-client/home/configuration/).
- [Reanudación del cliente](https://tomato6966.github.io/lavalink-client/extra/resuming/).
- [Lavalink REST](https://lavalink.dev/api/rest) y [WebSocket](https://lavalink.dev/api/websocket).
- [Discord componentes](https://docs.discord.com/developers/components/reference), [interacciones](https://docs.discord.com/developers/interactions/receiving-and-responding), [comandos](https://docs.discord.com/developers/interactions/application-commands), [emojis](https://docs.discord.com/developers/resources/emoji) y [rate limits](https://docs.discord.com/developers/topics/rate-limits).
- [Requisito de Node de voice](https://discord.js.org/docs/packages/voice/stable): la documentación consultada requiere >=22.12.0; conciliar la versión instalada completa.
- [Ejemplo JMusicBot](https://jmusicbot.com/) y [FlaviBot](https://flavibot.xyz/docs/modules/music/06-now-playing-and-controller): referencias de presentación, no aprobación visual ni verificación de un despliegue de OBEY.

Todas las decisiones de los capítulos de sistema son propuestas prescriptivas de implementación. Ninguna casilla de aceptación se acredita por este documento. Una inferencia sobre funcionamiento no verificado se debe marcar [Inferencia] en los informes de ejecución; no convertir una propuesta en un hecho operativo.

## Catálogo integrado de eventos · edición 0.6

Consultar [capítulo 15](15_CATALOGO_EVENTOS.md) y la ruta única assets/obey/catalog-eventos/. Contiene 117 entradas de diseño (113 eventos y cuatro auxiliares), dos variantes y mapa de claves/consumidores. Las escenas y seis GIF están en expansion-20261020; la muestra anterior de 24 iconos de registros se retiró. Los registros y bindings actuales permanecen como autoridad hasta integrar los nuevos recursos. No confundir eventos documentados, emojis publicados y funciones implementadas.


## Conciliación de materiales 0.7

La ampliación vigente está en [16 · Estados](16_ESTADOS_Y_ANIMACIONES.md), [17 · Mapa de reemplazos](17_MAPA_REEMPLAZOS.md), [18 · ES/EN y publicación](18_I18N_Y_PUBLICACION.md) y [19 · Recetas](19_RECETAS_POR_RECORRIDO.md). Abrir también el índice único MATERIALES.md de la raíz. A01–A12 están aprobados visualmente; B/C son propuestas nuevas. Los deltas y los mapas no se cargan automáticamente por el runtime. Antes de editar un consumidor, comprobar su hash y audiencia. Conservar el registro único, la lógica de juegos, datos del usuario y las tareas de implementación pendientes.

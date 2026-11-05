# Auditoría P1 — pistas, álbumes, artistas y Spotify (05/11/2026)

**Clase:** revisión estática de código real de la rama de implementación, contrastada con documentación pública. **No se ejecutó audio ni se probaron credenciales o nodos reales en esta auditoría.** El usuario reporta fallos al abrir artista/álbum y al cargar Spotify; los motivos siguientes son hallazgos de código, dependencias y posibles causas, no un diagnóstico de red confirmado.

## Flujo real y puntos de fallo

1. Discord: bot/modulos/musica/comandos/buscar.js → servicios/catalogo.js → handlers/music/node-search.js → datos/catalogo.js → nodos NyxLink; selección de artista → handlers/music/artists.js → nodo REST. Los componentes se construyen en bot/modulos/musica/vistas/catalogo.js.
2. Web: dashboard/views/pages/player.ejs → POST /api/player/:guildId/search → api/rutas/musica/http.js → mismo catálogo. Abrir artista → kind=artist → getArtist. Abrir álbum → POST /api/player/:guildId/preview → dashboard/index.js → music.search(uri). La web muestra errores muy generales.
3. Motor: handlers/music/nodes-runtime.js crea NyxLink 0.1.0-dev.2. NyxLink usa Player/Queue; el proveedor y metadatos siguen sujetos a capacidades de Lavalink/NodeLink. No volver a Shoukaku ni crear segundo manager.

## Hallazgos individualizados

| ID | Severidad inicial | Evidencia directa | Diagnóstico y siguiente prueba |
|---|---|---|---|
| CAT-01 | Alta | handlers/music/nodes-runtime.js configura spotify.enabled=false en las opciones propias de NyxLink. datos/catalogo.js sigue usando spsearch. | No asumir que Spotify está deshabilitado globalmente: los nodos públicos pueden tener LavaSrc. Instrumentar por nodo qué backend/proveedor respondió y cuál rechazó; comparar spsearch: consulta y enlace de pista Spotify. |
| CAT-02 | Alta | datos/catalogo.js, rama albums/artists: consulta /loadsearch con types para nodos no NodeLink, o resolve de prefijo tipo spsearch:artist:... en NodeLink. | /loadsearch requiere LavaSearch; no está garantizado por Lavalink base. Inspeccionar /v4/info plugins y capacidades reales, decidir rama por capacidades, no solo isNodeLink. |
| CAT-03 | Alta | handlers/music/artists.js getArtist requiere loadType=playlist y pluginInfo.type=artist o nombre Top Tracks NodeLink, además de pistas. | Un artista puede existir y tener metadatos pero carecer de Top Tracks, o retornar formato distinto. Separar perfil de artista de canciones populares; aceptar carga parcial con razón y fallback verificable. |
| CAT-04 | Alta | api/rutas/musica/http.js kind=artist delega a getArtist; player.ejs openArtist captura cualquier error como un mismo mensaje. | Devolver códigos específicos: unsupported, provider_auth, timeout, empty, rate_limited, malformed_result; presentar ayuda contextual con nombre del nodo/proveedor seguro (sin credenciales). |
| CAT-05 | Alta | dashboard/index.js preview requiere loadType playlist/album y tracks no vacías para aceptar álbum. | Un álbum buscable por metadata no garantiza que el nodo resuelva su URL y sus pistas. Verificar URL, extensión, source manager y plugin; previsualización no debe prometer reproducción ni marcarlo vacío sin causa. |
| CAT-06 | Media-alta | datos/catalogo.js: presupone dos nodos, dos segundos por proveedor en auto, 3.5 s por fuente seleccionada, plazo conjunto 6.5 s y máximo cuatro búsquedas activas. | Una fuente con latencia mayor o cuota limitada se ve como no disponible. Medir p50/p95/timeout por tipo/fuente/nodo y añadir estrategia de presupuesto sin bloquear todo el catálogo. |
| CAT-07 | Alta | datos/catalogo.js usa catch sin registrar causa dentro de las consultas y combina errores en estados empty/unavailable. | Instrumentar error con categoría, correlación, duración, fuente y backend; nunca loguear URLs secretas ni credenciales. Distinguir respuesta vacía de error. |
| CAT-08 | Media | nodePool.supportsPlugin depende de obtener info y solo busca nombres. La decisión sobre isNodeLink se utiliza separadamente para elegir la ruta. | Una conexión lista puede no tener info de plugins; mostrar capacidad unknown hasta comprobarla. La inferencia de backend no es un contrato de formatos de búsqueda. |
| CAT-09 | Alta | getArtist valida URL/ID y exige Top Tracks; datos/catalogo.js puede devolver perfiles de búsqueda sin un proveedor que soporte recuperar pistas de artista. | No habilitar el botón Ver artista para un backend que no soporta el recorrido completo; o abrir perfil de solo metadatos con aviso explícito. |
| CAT-10 | Media | player.ejs busca álbumes/artistas en pestañas independientes y muestra texto general tras fallar request. | Preservar canciones encontradas aunque álbumes/artistas no estén disponibles, sin interpretar la falta de metadatos como problema del motor musical entero. |
| CAT-11 | Alta | test/musiccatalog.test.js y test/discordmusiccatalog.test.js verifican respuestas sintéticas de LavaSearch/NodeLink, pero no son prueba de compatibilidad real con nodos usados. | Guardar fixtures de respuestas reales anonimizadas y contratos de plugins por versión. Nunca usar mocks como aceptación de Spotify/album/artist. |
| CAT-12 | Alta | El endpoint GET /api/music/search en handlers/music/apiRoutes.js consulta música por otra ruta y proyecta solo tracks. | Inventariar consumidores y evitar dos semánticas distintas en /api/music/search y /api/player/:guildId/search; autorización, límites, caching y categorías deben quedar documentados. |

**No confirmado:** la causa puntual de una búsqueda fallida en un servidor específico, tasas de 401/403/429 de Spotify, disponibilidad de credenciales, geobloqueo, capacidades de los nodos configurados, audio audible ni respuesta real de un artista concreto. Requieren logs anonimizados y pruebas en entorno autorizado.

## Factores de Spotify y Lavalink

- La API de Lavalink v4 garantiza búsqueda de pistas por sus fuentes, pero las búsquedas avanzadas de álbumes/artistas corresponden a plugins como LavaSearch. Documentación: https://lavalink.dev/api/rest y https://lavalink.dev/plugins.
- El complemento LavaSrc puede aportar Spotify/Apple Music. Que un nodo acepte spsearch NO garantiza /loadsearch, artista Top Tracks ni acceso a su álbum. Obtener y mostrar matriz real de plugins/capacidades.
- Spotify anunció en febrero de 2026 restricciones para Development Mode: Premium del propietario, hasta cinco usuarios autorizados, búsqueda con límite máximo de 10, eliminación de algunas rutas Browse y Top Tracks para nuevas apps; ciertos cambios de endpoints de apps existentes se aplazaron el 09/03/2026. Estas condiciones afectan credenciales Web API de una app, no equivalen automáticamente al diagnóstico de un nodo público ajeno. Fuentes: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide y https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security.
- No presentar metadatos de Spotify como streaming de audio de Spotify; la reproducción se resuelve por capacidades y política permitida del nodo. Respetar licencias y términos de los servicios.

## Plan correctivo por entregas

**CAT-G0 — Capturar sin modificar producción:** versión Node/NyxLink/nodo, backend detectado, info plugins y sourceManagers, respuesta a búsqueda pistas/álbumes/artistas en cada fuente, códigos y duración por operación. Secretos fuera de reportes; no inspeccionar cuentas personales.

**CAT-G1 — Contratos y normalizadores:** definir SearchResult discriminado (track, album, artist, playlist, unsupported, unavailable, timeout) con proveedor y capacidades; normalizar variantes reales NodeLink/LavaSearch en un único adaptador.

**CAT-G2 — Artistas y álbumes:** separar metadatos/Top Tracks/tracklist; fallback limitado según fuente verificable; paginación y duración; hacer preview de álbum solo cuando URI sea resoluble y evitar falsos mensajes vacíos.

**CAT-G3 — Spotify:** comparar fuente seleccionada, credenciales del proveedor propio, LavaSrc del nodo, disponibilidad de spsearch, URI Spotify y resolución musical; categorizar 400/401/403/404/429 y timeout sin mostrar credenciales. En fuente automática, degradar a fuente compatible sin afirmar que Spotify funcionó.

**CAT-G4 — Interfaces Discord/web:** mismo estado por categoría, reintento, disabled razonado y mensajes ES/EN. Nunca conectar voz al abrir una búsqueda/artista. No suprimir otras categorías por fallos de una.

**CAT-G5 — Verificación:** pruebas permanentes con formatos reales, componentes, API 401/403/409, timeout, 429, backend sin LavaSearch, NodeLink con respuesta distinta, álbum sin pistas, artista sin Top Tracks, y dos servidores. Luego prueba autorizada con nodos reales.

## Criterio de cierre

Pista por enlace y texto, álbum por búsqueda y URL, perfil de artista y canciones populares en fuentes compatibles, Spotify con errores diagnosticables, navegación pista/álbum/artista en Discord y web, zero falsas confirmaciones y sin cambios de materiales visuales. La función no compatible se señala como tal, no como error desconocido ni como resultado vacío.

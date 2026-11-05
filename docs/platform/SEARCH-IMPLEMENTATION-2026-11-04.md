# Contrato compartido del buscador

Implementación autorizada tras la auditoría del 04/11/2026. La cola y la reproducción siguen perteneciendo a NyxLink. El catálogo procede exclusivamente de los nodos públicos configurados; los adaptadores opcionales de Spotify/Deezer en el cliente permanecen desactivados.

Entrada: query y contexto guildId, signal, kind y source. kind admite tracks, albums, artists y all; source admite auto, spotify, applemusic, ytmusic y youtube. Se conserva all como alias de auto en source por compatibilidad con las secciones del panel. Los enlaces directos conservan su plataforma y su recorrido de resolución. Los prefijos explícitos de fuente se validan para evitar una elección contradictoria.

Salida: arrays tracks, albums, artists y playlists (este último sin búsqueda nueva en esta entrega), más statuses y sources por categoría. Estados: ready, empty, unavailable y unsupported. Los artistas y álbumes requieren identidades reales de Spotify/Apple Music. Una fuente sin esa capacidad se comunica como unsupported; no se sustituye por vídeos o canales etiquetados como artistas.

Las pistas pasan por Manager.search de NyxLink y su validación. Un resolver del propio cliente admite los prefijos estándar LavaSrc en nodos Java, que la versión instalada clasifica de forma demasiado restrictiva como extensiones NodeLink. Los recursos de catálogo usan modificadores de tipo en NodeLink o /v4/loadsearch en Lavalink.

Auto prioriza Spotify, Apple Music, YouTube Music y YouTube para pistas. Para metadatos utiliza Spotify y Apple Music. Una plataforma explícita no cambia a otra. Se consulta como máximo a dos nodos candidatos por ronda y se conserva el primer resultado válido, cancelando el otro. Los tiempos y la concurrencia están limitados. Las consultas y previews no fijan ni penalizan nodos de audio.

La caché se aísla por cliente, consulta, tipo, plataforma, nodo y sesión del backend. No contiene identidad del solicitante. Cada llamada incorpora después su propio requester. Cancelar una espera no cancela el resultado compartido que necesita otro usuario.

Discord carga las categorías al elegirlas y ofrece elección de fuente y reintento. La web utiliza los mismos campos. Los menús de búsqueda son temporales; el cierre invalida respuestas pendientes. La navegación por artista conserva su identidad y no encola hasta elegir una pista o colección y comprobar permisos actuales.

Verificación: pruebas de contratos, SDK real con transportes de prueba, navegación de Discord, lógica del navegador, consultas reales a los nodos y validación de la imagen. No se acredita audición ni failover real en voz con pruebas de catálogo.

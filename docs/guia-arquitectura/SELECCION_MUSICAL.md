# Selección musical · 19/10/2026

Este cambio corresponde al reproductor. El centralizador `/setup` tiene su implementación y documentación separadas en [Facilidad de setups](FACILIDAD_SETUP.md).

Las búsquedas excluyen enlaces de YouTube `/shorts/`, pistas marcadas positivamente como Short por el proveedor y títulos de YouTube con `#shorts`. Los enlaces directos se rechazan antes de consultar al nodo. La misma política se aplica al catálogo, al autoplay, a la cola y a la recuperación de sesiones antiguas. Una pista antigua identificada como Short se salta; los Me gusta y playlists guardados no se borran.

Para consultas de texto, se compara la coincidencia de título/artista y se prefieren señales de catálogo, ISRC, autor Topic/VEVO y audio/vídeo oficial. Las versiones cover, karaoke, remix, nightcore, aceleradas, ralentizadas y en vivo pierden prioridad cuando no se pidieron; una petición explícita de esas versiones se respeta. Las colecciones y los enlaces directos conservan su orden. Esta clasificación no añade consultas HTTP al recorrido de búsqueda.

Al resolver una pista guardada o cambiar de proveedor se comprueba la identidad: ISRC si existe, título/artista y duración con tolerancia del mayor entre cinco segundos y 6 %. Una URI idéntica se conserva si no contradice ISRC/duración; así se mantienen streams cuyo título cambia. Las versiones indicadas en el título no se eliminan al comparar. Si no se encuentra una grabación compatible, no se sustituye por el primer resultado arbitrario. Se conservan solicitante, estado de reproducción, volumen y filtros.

## Límites

La API estándar de [Lavalink](https://lavalink.dev/api/rest) proporciona duración, autor, título, URI, ISRC y datos adicionales del plugin, pero no exige una bandera Short. Un enlace `watch` sin metadatos suficientes puede corresponder a un Short sin que el bot lo identifique. La duración por sí sola no se usa para bloquear canciones: [YouTube](https://support.google.com/youtube/answer/15424877?hl=en) también clasifica Shorts por formato y fecha, y existen canciones completas breves. Las señales de clasificación tampoco acreditan que una subida pertenezca al artista.

No se cambian nodos, credenciales, relojes, sincronización de letras ni el transporte de audio. El nodo privado permanece deshabilitado. La comprobación de identidad es conservadora y puede rechazar una alternativa cuyos metadatos difieran demasiado.

## Verificación y reversión

[Evidencia local](../platform/evidence/music-recordings-local.json): 48 grupos temporales cubren URLs, metadatos, canciones completas breves, versiones explícitas, identidad/duración, orden de playlists/enlaces, catálogo, autoplay, cancelación, cola antigua y restauración con/sin siguiente pista. Pasan los 25 tests originales, tipos y reglas de dependencias. Dos consultas de lectura al nodo público seleccionado devolvieron como resultados elegidos los vídeos oficiales de Rick Astley y Daft Punk; no se reprodujo audio ni se abrió Gateway para estas pruebas. Los verificadores temporales se retiraron, conservando sus hashes.

No hay migraciones ni modificaciones masivas de datos. Revertir el commit de selección musical restaura el comportamiento anterior sin retirar `/setup`. El despliegue y su imagen de reversión se documentan aparte.

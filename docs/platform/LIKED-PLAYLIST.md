# Tus Me gusta de OBEY

Al guardar con el corazón desde Discord o el panel web, la canción forma parte de una colección personal automática. Aparece fija en la barra lateral y como playlist en Tu Biblioteca, incluso vacía. Abrirla muestra canciones, artistas, duración, contador y acciones para reproducir o quitar el corazón.

Se reutiliza LikedSongs, sin crear otra playlist ni copiar favoritos a otra colección. La identidad nueva usa la URI de la grabación para sobrevivir a cambios de encoding/nodo. Las claves antiguas siguen siendo legibles. El listado agrupa duplicados de la misma URI; quitar un corazón elimina sus copias del usuario actual, sin tocar las de otras personas. El guardado web expresa el estado deseado para que repetir una petición no deshaga el corazón. Los errores de almacenamiento no se presentan como éxitos.

La API deriva el propietario de la sesión Discord. GET /api/music/liked es privado/no-store; POST /api/music/like valida valores y admite liked=true/false, conservando el toggle antiguo cuando falta ese campo. POST /api/music/liked/play/:guildId consulta los favoritos de esa sesión, valida permisos frescos y canal del mismo servidor y descarta enlaces/orígenes no musicales. El middleware CSRF existente protege las escrituras.

La acción Reproducir conecta y encola la lista completa en orden usando el motor existente y resolución diferida. Si ya suena una canción, el botón dice Añadir a la cola y conserva la reproducción/cola previas. Una lista manual tiene prioridad sobre una recomendación pendiente de autoplay. Detener durante la conexión cancela el agregado posterior. No se usa un reproductor ni un sistema de nodos nuevo.

La web actualiza corazones y contador después de guardar/quitar y consulta cambios externos cada 15 segundos mientras la pestaña está visible, además de al volver a ella. Las filas sin cambios conservan su DOM/foco. Las playlists ordinarias siguen funcionando. Esta colección usa los corazones de OBEY, según confirmó el usuario; no conecta una cuenta Spotify.

Verificación: 514 pruebas Node, con regresiones de identidad, privacidad, reintentos, fallos de almacenamiento, prioridad frente a autoplay y cancelación al detener. MongoDB real prueba persistencia tras recrear el servicio, deduplicación y separación de propietarios en una colección temporal eliminada al terminar. Chromium usa EJS/JS reales con API aislada para comprobar biblioteca, lista, corazones, vacío, guardado, actualización externa, recarga, playlists ordinarias y escritorio/móvil. La prueba existente de letras también pasa. No se reproduce audio en servidores de usuarios como parte de estas pruebas.

Evidencia: [navegador](evidence/liked-browser.json), [MongoDB](evidence/liked-storage.json), [escritorio](evidence/liked-playlist-1280.png), [móvil](evidence/liked-playlist-390.png) y [biblioteca](evidence/liked-library-1280.png).

# Letras completas y consultas tardías

`slashCommands/Music/lyrics.js` y el fallback `mp_lyrics` en `handlers/music/index.js` utilizan `handlers/music/lyrics-pagination.js`. Se mantienen el comando, su búsqueda opcional y el karaoke sincronizado. El slash comparte proveedor/cache con el karaoke; se elimina el cliente LRCLIB duplicado.

La letra plana deja de recortarse y todas sus páginas son accesibles con Anterior/Siguiente y contador. Se conserva cada carácter, incluso líneas vacías, espacios, líneas de más de 1800 caracteres y Unicode con pares surrogate. Descripciones de máximo 1800 caracteres; título limitado sin partir Unicode; menciones deshabilitadas. Cada vista tiene un UUID opaco, propietario, guild y mensaje; los controles solo operan esa vista y expiran a los cinco minutos. Cerrar desactiva navegación sin borrar el texto. Las ediciones se serializan, deduplican por interacción y se limitan a 500 acciones por vista.

Para canción actual se captura referencia de pista, playbackId y sessionId antes de consultar. Se rechaza una respuesta vieja antes/después de publicar y al navegar. El karaoke añade guards equivalentes en lookup/envío, generación por lookup y cancelación de consulta pendiente. Una nueva consulta invalida una anterior; un envío tardío se elimina sin instalar intervalo. El toggle reconoce también consultas pendientes. Las recargas del karaoke mantienen guard de sesión/pista tras consultar. Se conservan pausa, seek, tiempos, ventanas y cadencias originales.

El adaptador HTTP compartido tiene deadline de ocho segundos, límite de respuesta de 512 KiB y cierre de requests al fallar; el cache de proveedor está limitado a 256 entradas. No se cambian proveedores ni engine. Los fallos esperados conservan el contrato anterior de Discord (`null`), y `fetchLyricsResult` distingue ausencia (404) de caída/timeout; una caída se cachea solo 10 segundos. Consultas simultáneas Discord/web de la misma canción comparten una promesa; no se imprimen credenciales de Lavalink.

## Verificación reproducible

```sh
node --test test/lyrics-pagination.test.js test/lyrics-command.test.js test/lyrics-live-lookup.test.js test/lyrics-http.test.js
npm test
```

Regresiones: 13 de paginación, 5 de command/router real con proveedores simulados, 6 de lookups/envíos/cancelación concurrente de karaoke y 3 de transporte. Las pruebas no consultan letras de canciones reales ni conectan Discord. Los fallos originales se reprodujeron antes de corregirse.

## Pendiente explícito

La web ya incluye panel Letras en el reproductor real. `GET /api/music/lyrics/:guildId` exige sesión y permisos actuales antes de consultar el proveedor compartido. Captura sesión/playback/pista y descarta resultados tardíos. La proyección pública añade `playbackId` para distinguir repeticiones de una misma canción.

El panel carga al abrirse, cambiar de reproducción, reconectar o reintentar; no consulta proveedores con cada tick. Todas las páginas, anterior/siguiente y contador están disponibles; sincronización sigue la posición/pausa del mismo estado HTTP/Socket.IO. Leer otra página desactiva seguimiento hasta pulsar Seguir reproducción. Texto completo conserva el fallback plain aunque difiera del texto sincronizado. Desconexión congela extrapolación; denegación borra el texto. Contenido del proveedor se inserta con textContent.

Regresiones web/proveedor: paginación completa, última página, respuestas fuera de orden, misma pista reproducida otra vez, nueva sesión, pausa/seek, desconexión, ausencia/stream/error, retry y permisos antes de lookup. Chromium usa EJS real y fixtures aislados; capturas/report `evidence/lyrics-web-*`.

No se probó en un servidor real ni con APIs musicales reales. T19 sigue parcial para aceptación canary de pausa/seek/cambio desde Discord. No se declara terminada fase 3 ni plataforma.

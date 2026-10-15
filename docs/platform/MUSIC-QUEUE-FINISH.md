# Fin de pista ignorado y cola bloqueada · 15/10/2026

Dominio `music`, criterio: al finalizar la pista actual debe avanzar la cola antes de buscar autoplay, sin aceptar eventos de reproducciones anteriores. Incidencia del usuario: canción terminada con una pista esperando.

## Evidencia y causa

El bot registró `Ignored end event: finished playbackMatches= true trackMatches= false`. Recibió el fin real con `obeyPlaybackId` correcto, pero `isCurrent` exigía también igualdad de la cadena `encoded`. El nodo devolvió otra codificación y el callback descartó el evento. El mismo guard intervenía en inicio, excepciones y stuck.

La identidad de reproducción creada por OBEY es ahora autoritativa cuando viene en `track.userData`; `encoded` sigue siendo fallback para eventos sin ella. Se conserva la validación del objeto player actual y el descarte de operaciones diferidas cuando cambia la reproducción. Un evento viejo con la misma grabación no puede adelantar la cola. No se elimina la protección por identidad ni se cambia de fuente de música.

Dos regresiones en `test/music-lifecycle.test.js`: evento finished actual con otra codificación avanza una sola pista; evento antiguo con codificación idéntica no avanza. La primera falló antes del cambio con First en lugar de Second. Se agregaron registros breves de inicio nativo y transición con cantidades de cola para observar el recorrido sin letras, URLs, codificaciones ni credenciales.

La cola tuvo actividad posterior durante el diagnóstico: la lectura del 15/10 a las 00:32:13 UTC mostraba reproducción activa, cola vacía, autoplay activado, volumen 100 y posición 79404/229848 ms. No se reemplaza música activa por canciones de prueba. Se observará la reproducción ordinaria después de instalar la corrección.

## Protocolo

[TrackEndEvent](https://lavalink.dev/api/websocket#trackendevent) y [Track/userData](https://lavalink.dev/api/rest#track). Shoukaku entrega el objeto track del evento del nodo; las pruebas anteriores solo usaban la codificación enviada y no cubrían esta variante real. Un health check correcto y una búsqueda HTTP válida no prueban que se haya aceptado el evento de fin.

## Operación

Solo requiere actualizar el bot. Se conservan las preferencias, música/cola y credenciales; no se activa el nodo privado, WARP ni fuentes adultas. La recuperación seguirá fijada a la versión pública verificada. Comprobación final y evidencia se agregan después de verificar ejecución.

# Respuesta de botones y sincronización · 17/10/2026

El usuario aclaró que el retraso aparece al pulsar los controles musicales. Se mantuvo GDjkhp, que había mejorado la continuidad observada, y se corrigieron esperas y acumulación de trabajo en el bot.

## Órdenes al nodo

Antes, el handler comprobaba acceso, esperaba `deferUpdate()` y después enviaba pausa/salto/parada/volumen al nodo: dos peticiones independientes en serie. Ahora comienza la confirmación inmediatamente y ejecuta los controles autorizados mientras esta está en curso. Se conservan las comprobaciones previas de DJ/solicitante y mismo canal, la serialización musical por guild y el resultado real de la operación. No se muestra éxito anticipado ni se altera la cola musical. Los errores y demás respuestas a la interacción esperan la confirmación; el handler también la espera antes de finalizar, incluidas las ramas con retorno temprano. Navegación de cola, corazones y letras conservan su espera de confirmación antes de usar la respuesta.

La prueba falló con el handler anterior. Tres regresiones comprueban que pausa/salto/parada/volumen llegan al adaptador mientras Discord confirma, que acceso denegado no confirma ni opera y que un fallo del nodo no genera una respuesta antes de la confirmación. En tres comparaciones con adaptadores fijos de 60 ms para cada petición, tiempos totales anteriores 125/124/130 ms y nuevos 62/66/61 ms; mediana 125 → 62 ms. Es evidencia del cambio de dependencia, no una medición de botones reales ni un compromiso de latencia audible.

## Actualización del panel

`liveupdate` encadenaba cada actualización a la anterior sin límite de pendientes. Ante una edición lenta, ticks y cambios rápidos podían acumular solicitudes redundantes. Ahora conserva una edición en curso y una marca de refresco pendiente que vuelve a leer el estado actual. Los cambios intermedios se agrupan; se conserva el estado final y se invalidan generaciones detenidas. La parada espera la edición en curso; una reproducción nueva puede solicitar su propio refresco sin recuperar la pista vieja.

Caso reproducido: primera edición retenida y otras cien solicitudes; antes, 101 ediciones, ahora dos. La cancelación durante fetch y el cambio de generación están cubiertos. Comparación inicial con 10 ms por edición: 1752 → 41 ms. Repeticiones con la misma carga: 1584/1398/1380 → 26/27/24 ms, siempre 101 → 2 ediciones. Son adaptadores controlados, sin acceso a Discord; la reducción estable es del número de escrituras, no una afirmación sobre el ping real. Se conservan los intervalos existentes (panel periódico 5 s y cambios agrupados a 200 ms); no se aumenta la frecuencia de peticiones.

## Ping medido

El prefijo dividía incorrectamente el tiempo entre diez y mezclaba mediciones. La versión slash ejecutaba `ping` a localhost con `spawnSync`, sumaba/restaba magnitudes diferentes y fabricaba un valor aleatorio al fallar. En la imagen desplegada no estaba disponible el ejecutable `ping`: ese camino no medía el host. No se atribuye a ese proceso ausente la latencia real de esta sesión.

Las dos variantes ahora miden con reloj monotónico el tiempo de confirmar la respuesta, muestran `client.ws.ping` por separado y obtienen el ping de voz del reproductor del servidor, con etiqueta de nodo público. Valores ausentes/negativos se muestran no disponibles. Sin subprocess, números aleatorios ni suma de pings; ediciones esperadas y salida de error traducida. `/info ping`, prefijo `ping` y alias `latency` se conservan.

Durante la revisión se observaron 124 ms de gateway y 337–338 ms de voz. Después del despliegue, gateway 126 ms y voz 345–348 ms. Estas cifras son muestras de conexiones diferentes; no se afirma que el cambio haya reducido el ping físico del proveedor. Tampoco se atribuye un timeout a un rate limit: la única mención de ese término en los logs revisados no era un evento 429. Los controles continúan sujetos al RTT del nodo y a búsquedas/acciones musicales que realmente necesiten completarse.

## Verificación y operación

Cinco fallos iniciales reprodujeron la acumulación/mediciones incorrectas y otro reprodujo la espera serial del botón. Suite final 545/545, 48 pruebas aisladas en la imagen sin red y 20 hashes comprobados. Imagen con UID 1000, sin `.env` ni NSFW; 19 raíces slash, subcomandos ping/botinfo, Fun 22 y 295 emojis confirmados. No se modificaron endpoints web, autenticación, permisos, fuentes musicales o dependencias.

Código final `868c65ffbd6bb465e5d223cdf09e53a2b198e626`, imagen `4879dca40e62fe39a0eb363bc1fdc7e0251266332d7ac8c9e196e19b609ccb55`, etiqueta `release-control-latency-20261017`. Despliegue exclusivo del bot con cierre/recuperación existentes: healthy/cero reinicios, Mongo/música listos, sesión recuperada y tres públicos conectados. GDjkhp principal; Serenetia/MilloHost respaldan. Imágenes/Redis conservan fecha de inicio e imagen; privado apagado/excluido, restart=no y sin puerto 2333. Las 16 entradas locales previas quedaron fuera de ambos payloads y se conservaron exactamente.

Recuperación `.runtime/bot-recovery-public-only.yml` fija esta imagen y default GDjkhp. Rollback preparado: `release-sync-latency-20261017` conserva el panel y ping nuevos pero restaura la espera serial del botón; recrear solo bot y mantener GDjkhp, el registro y privado excluido. No revertir Mongo. No se enviaron interacciones o mensajes de prueba mediante una cuenta real: queda pendiente confirmar con el usuario el retraso que siente al pulsar.

[Evidencia redactada](evidence/control-latency-runtime.json). Contratos de medición: [Discord.js WebSocketManager.ping](https://discord.js.org/docs/packages/discord.js/14.27.0/WebSocketManager%3AClass#ping), [estado del reproductor Lavalink](https://lavalink.dev/api/websocket#player-state).

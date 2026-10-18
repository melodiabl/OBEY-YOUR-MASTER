# OBEY desconectado tras reinicio del host

Comprobación de solo lectura del 18 de octubre de 2026, solicitada porque el bot aparecía desconectado. Horarios de Berlín (CEST).

- El host se apagó aproximadamente a las 16:29 y arrancó a las 17:08; coinciden last -x, uptime -s y los dos boots del journal.
- obey_bot terminó a las 16:28:47 con código 0, OOMKilled=false y sin error del motor de contenedores. El último heartbeat anterior al cierre fue reconocido; el log muestra el manejador shutdown y el cierre del Gateway con código 1000. No se observa una excepción fatal en el tramo final.
- Redis e images se detuvieron en el mismo intervalo. OBEY continúa Exited; conserva la imagen release-panel-backoff-20261017. Los únicos bind mounts del bot corresponden a runtime-nodes y runtime-emojis: el código del checkout de setups no se está montando sobre /app.
- La política de los tres contenedores es unless-stopped. El podman-restart.service activo ejecutó a las 17:08 `/usr/bin/podman start --all --filter restart-policy=always`. Ese filtro no incluye estos contenedores.

La desconexión está explicada por el apagado del servidor y la falta de recuperación automática de esos contenedores. Estos datos no identifican quién solicitó el apagado ni su motivo. Los cambios de setups son locales y no se han desplegado.

No se iniciaron/recrearon contenedores de producción ni se modificaron políticas o unidades para este diagnóstico. Una recuperación posterior debe usar los contenedores/versiones existentes de bot y sus dependencias, y corregir su arranque de forma específica. No debe usar un arranque indiscriminado de todos los contenedores: el Lavalink privado debe conservarse apagado.

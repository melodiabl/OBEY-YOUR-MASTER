# HeavenCloud · candidato aportado por el usuario

Comprobación del 18/10/2026 desde el host de OBEY, sin tocar nodos o sesiones de producción. Destino aportado: `free-lava.heavencloud.in:4000`, sin TLS. El [operador publica esa misma configuración](https://heavencloud.in/service/public-lavalink-servers); se usó la contraseña pública recibida solo para las sondas y no se guarda en esta evidencia.

DNS resolvió a `109.230.233.91`. Las tres consultas autenticadas `/version`, `/v4/info` y `/v4/stats` agotaron ocho segundos (8.004, 8.007 y 8.003 ms respectivamente). Después, conexión TCP al puerto 4000 agotó cuatro segundos (4.075 ms), una búsqueda `ytsearch` agotó cinco (5.006 ms) y el handshake WebSocket v4 agotó aproximadamente cinco (5.030 ms), sin establecer sesión.

No hubo respuesta HTTP, ni rechazo de contraseña que permita juzgarla. No se pudieron confirmar versión, plugins, fuentes, resultados, audio, letras, RTT de un servicio operativo o estabilidad. La observación indica inaccesibilidad desde este servidor en esas sondas; no demuestra una caída mundial ni permite distinguir un servicio apagado de un filtrado de red.

Las consultas siguieron las rutas de la [API REST](https://lavalink.dev/api/rest) y [WebSocket](https://lavalink.dev/api/websocket) oficiales. El handshake utilizó un ID sintético y ningún token Discord, canal de voz, player o sesión del bot. Sin pruebas de carga ni audio guardado.

Además, la política existente de OBEY rechaza públicos `secure: false` con `public_node_requires_tls`, comprobado con su validador aislado. No se modificó esa política para registrar un destino que tampoco respondió. El anuncio de disponibilidad del operador no sustituye estas comprobaciones desde el host del bot.

Resultado: candidato pendiente de una dirección accesible y compatible; no se añade como principal o respaldo. Principal/respaldos existentes y nodo privado apagado siguen con su configuración anterior, sin nueva comprobación de salud en vivo de esos otros nodos. Sin cambios de imagen o despliegue. [Resultados redactados](evidence/heavencloud-20261018.json).

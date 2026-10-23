# Continuidad y recuperación · P1 · 23/10/2026

El proceso y la salud HTTP estaban activos, sin reinicios. Los registros muestran 16 errores «Player not found» y paquetes repetidos de salida/entrada del propio bot. El recuperador forzaba leave/join al confundir pérdida del player remoto con pérdida de conexión Discord; reintentaba snapshots cada cinco segundos sin presupuesto ni enfriar ese nodo.

Se conserva la conexión Discord cuando canal, sesión y endpoint siguen válidos. La recuperación reconstruye el player remoto; el cambio de nodo retira el remoto anterior y reutiliza el handshake, resolviendo la misma grabación en el destino. No se abre otro gestor de cola ni otra conexión Discord para esa guild. Un 404 del player remoto enfría ese nodo para permitir respaldo público. Si hace falta una conexión nueva, usa el shard real de la guild.

Presupuesto automático: cinco intentos por sesión, esperas 5/10/20/40 segundos y cancelación por stop. Al agotarlo se mantiene estado recovering y el snapshot para reintento manual; no hay bucle automático infinito. Una solicitud manual de conexión reinicia el presupuesto. Stop revoca la generación antes de esperar la cola de acciones; las resoluciones tardías ya no reproducen ni reponen el snapshot.

La restauración conserva cola, historial, posición, volumen, filtros y pausa. Una respuesta sin confirmación no fuerza playing; permanece loading hasta evidencia del nodo. El fallo del panel se registra aparte y conserva el audio. Eventos de un player retirado se ignoran incluso cuando el mapa ya no contiene un sustituto.

Verificación local: diez casos temporales (seis regresiones vistas antes de corregir), con restore real sobre repositorio/voz simulados; veinticinco originales conservados. Incluye stop durante resolución, panel caído, cola/posición, pausa de reintento, generación, cambio de nodo y player retirado. Sin mensajes Discord, eventos de guild artificiales o entrada a canales de voz de prueba.

Referencia: [REST de Lavalink](https://lavalink.dev/api/rest) e implementación instalada Shoukaku 4.3.0. Es un incremento de continuidad de P1 antes del cambio de cliente. No declara migración a lavalink-client, aceptación total de P1 o escucha sin cortes. [Evidencia local](../platform/evidence/music-continuity-local-20261023.json). Desplegado en `6d5b666`, imagen `6191934`, contenedor saludable y cero reinicios automáticos. [Evidencia de despliegue](../platform/evidence/music-continuity-deployment-20261023.json).


Observación real de 23:55:39 a 23:57:39 UTC del 22/10 (23/10 local): doce muestras, cero salidas de voz y cero errores de recuperación; una sesión se restauró en Serenetia y se observó conectada con posición 11.440 ms y ping de voz 134 ms. El principal configurado sigue siendo Trinium 02; el nodo privado permanece apagado. Son datos de una ventana acotada y actividad existente, no una prueba de escucha continua.

Imagen y runtime: 42 hashes coincidentes; 25 casos originales pasan dentro de la imagen. Backup de Mongo terminado con exit 0 y CRC gzip válido; imagen anterior y argumentos privados de reversión conservados. Verificadores temporales retirados al guardar evidencia.

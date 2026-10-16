# Información del bot y reinicio musical · 17/10/2026

Se atendió el comando que quedaba cargando y el reinicio musical pedido por el usuario, conservando el motor, las sesiones y la selección de nodos actual.

## Corrección del comando

El registro de producción mostraba `TypeError: Cannot read properties of undefined (reading 'voice')` en `slashCommands/Info/botinfo.js:51`, llamado por el temporizador de cpu-stat. Las dos variantes consultaban `guild.me.voice`, propiedad incompatible con la versión instalada, y el error asíncrono escapaba del try/catch exterior. El prefijo tenía además una ruta de error con constructor no importado.

Las dos entradas usan ahora `handlers/project/bot-info.js`, `guild.members.me?.voice?.channelId`, muestreo de CPU del proceso con espera de 250 ms y edición esperada de la respuesta. Incluye servidores, miembros sumados, usuarios en caché, tiempo activo, recursos, conexiones y ping de Discord; nodo público y ping de voz corresponden únicamente al servidor que ejecuta el comando. Los valores ausentes se indican como no disponibles. Las versiones corresponden al runtime real, sin la referencia antigua a Enmap. Ante un fallo de lectura se sustituye la carga por un error traducido sin detalles privados. Se añade el alias de prefijo `infobot`; slash conserva `/info botinfo`.

Cuatro pruebas fallaron con la implementación anterior. Las regresiones comprueban respuesta final de prefijo y slash, caché de miembros incompleta, contadores reales y salida de error que termina la carga. No se enviaron mensajes de prueba a canales Discord. La API de registro sí confirmó el subcomando desplegado.

## Música: observaciones y límites

Antes del reinicio no había reinicios del proceso ni eventos de pista atascada en la ventana revisada; el proceso no mostraba saturación de memoria. Veinte ping/pong de control por nodo dieron medianas de 110 ms en Serenetia, 194 en GDjkhp y 191 en MilloHost; el último varió hasta 899 ms. Se conserva Serenetia como principal, con GDjkhp y MilloHost de respaldo. Estos datos no miden audio hacia Discord.

El cierre del bot guarda las sesiones antes de abandonar voz. Se recreó únicamente `obey_bot`; imágenes y Redis conservaron sus fechas de inicio e imágenes. La recuperación existente registró una sesión activa reproduciendo desde 117257 ms, sin errores de restauración. La comparación de los cinco registros de sesión mantuvo los hashes de sus colas. La pista se vuelve a resolver en el nodo como ya hacía el motor; un hash del objeto completo no acredita identidad musical porque puede cambiar el encoding y la metadata. No hubo migración ni restauración de base de datos.

La instrumentación nueva atiende tres preguntas: ¿sigue conectada la voz?, ¿qué ping publica el reproductor?, ¿qué recursos y frames informa su nodo? Usa el evento `music_playback_health` en actualizaciones del reproductor vigente, con correlación de guild resumida por SHA-256; permite posición, nodo, conexión, ping y estadísticas agregadas de CPU/frames. No incluye pista, credenciales ni voz/token/sessionId. Se limita a una muestra cada 30 segundos, salvo cambio de condición de aviso; desconexión o ping mayor de 250 ms produce warn informativo, sin cambiar nodos ni reiniciar. Valores ausentes/negativos quedan nulos. Sin temporizadores o dependencias adicionales.

La sesión recuperada produjo cuatro muestras de voz, siempre conectada; tras el cero inicial del proveedor, ping de 169–172 ms. La última muestra informó 224 frames deficitarios del nodo entre 2776 enviados. Los frames son agregados del proveedor: no se atribuyen al bot ni prueban pérdida de paquetes de esta sesión. Las muestras no son un reloj de audio y sus intervalos de llegada varían. No hubo eventos stuck, excepciones o fallos de restauración observados durante esta comprobación. La causa audible de los cortes sigue sin confirmar; no se afirma que el reinicio los haya resuelto.

Para una recurrencia, correlacionar la hora con `Playback health`, cambios de pista, stuck/exception y restauraciones; distinguir datos del reproductor de agregados del proveedor. Si cambia `connected`, revisar recuperación de voz; si solo crecen frames del nodo, contrastar proveedores antes de cambiar la selección. `infobot` ofrece el nodo/ping de voz actual para contrastar ese momento. No concluir que el RTT de control o el self-deaf explican por sí solos cortes de audio.

## Entrega y recuperación

536/536 pruebas completas, 37 focalizadas dentro de la imagen sin red y 16 hashes de fuentes verificados. Se mantienen 19 raíces slash, Fun con 22 opciones, 295 emojis y exclusión de NSFW. El nodo privado sigue apagado/excluido, restart=no y puerto 2333 cerrado. Las 16 entradas locales preexistentes quedaron fuera del payload y se conservaron exactamente.

Código `05fcaae` (comando) y `7650e56` (telemetría); imagen `edb8a5e2a7c30b4ea1753fd74646b1fafd996c37229a8d5c07662b9c0164bc6d`, etiqueta `release-botinfo-music-20261017`. Runtime healthy/cero reinicios. `.runtime/bot-recovery-public-only.yml` apunta a esta versión. Ante regresión, recrear solo bot con `release-node-performance-20261017`, conservando registro público y privado excluido; esa reversión reintroduce el defecto de botinfo. No revertir Mongo ni arrancar Lavalink privado.

[Evidencia redactada](evidence/botinfo-music-runtime.json). Fuentes de los contratos: [Discord.js GuildMemberManager.me](https://discord.js.org/docs/packages/discord.js/14.27.0/GuildMemberManager%3AClass#me) y [WebSocket Lavalink](https://lavalink.dev/api/websocket).

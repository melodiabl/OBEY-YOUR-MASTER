# Implementación y verificación de OBEY

Alcance: OBEY; MelodiaAPI queda fuera. Landing conservada. No se activó SoundCloud.

## Arquitectura aplicada

- `handlers/music/index.js`: servicio compartido por comandos, botones y web. Las operaciones sobre un reproductor se ordenan por servidor; las búsquedas tienen su propia cola para no bloquear controles. Una solicitud pendiente no puede reabrir una sesión detenida.
- `player-events.js`: identifica cada reproducción y descarta eventos tardíos. Publica el estado antes de esperar una edición de Discord.
- `state.js`, `sessions.js`: estado con revisión, sesión e identidad de reproducción; MongoDB conserva canción, posición, pausa, volumen, cola y filtros. El cierre espera las escrituras; el reinicio vuelve a resolver la canción y entrega la conexión de voz al nodo nuevo.
- `liveupdate.js`: ediciones serializadas y cancelables; el panel presenta portada, canción y progreso. Letras sincronizadas en mensaje separado cuando el proveedor ofrece tiempos.
- `player-volume.js`: respuesta visual inmediata, solicitudes ordenadas, última entrada conservada frente a respuestas antiguas y restauración del volumen confirmado al fallar.
- `track-artwork.js`: portadas de proveedor o miniatura de YouTube; imagen local si falla; una portada fallida no se vuelve a solicitar en cada actualización del estado.
- `sync-map.js`: compatibilidad con los módulos existentes y escrituras serializadas. Borrar una ruta elimina ese campo, no el documento entero.
- Playlists: repositorio único; migración aditiva e idempotente que conserva la colección anterior. Campos heredados preservados en los esquemas.
- Inicializadores antiguos: arranque condicionado a MongoDB disponible; errores asíncronos visibles y trabajo suspendido durante el cierre.

## Docker

El bot instala mediante `npm ci --omit=dev` y un `package-lock.json` versionado. La imagen corre como `node`. Compose declara las imágenes del bot, Lavalink y el servicio local de imágenes; comprueba salud y concede 30 segundos de cierre al bot. `/health` devuelve 503 si MongoDB o Lavalink no están listos.

El servicio de imágenes escucha solo en `127.0.0.1:3203`; incluye licencia y procedencia de sus recursos. Lavalink mantiene el proxy WARP aplicado a HTTP, sin interceptar la voz de Discord. Audio: Opus 10, remuestreo HIGH, actualizaciones de posición cada segundo; filtros opcionales y desactivados por defecto.

## Evidencia obtenida

| Comprobación | Resultado |
| --- | --- |
| Inventario de comandos | 810 cargados, sin errores ni conflictos de nombre canónico |
| Pruebas de código previas a portadas | 65 pruebas de código, incluidas búsqueda lenta, cancelación, recuperación tras fallo de conexión y conservación de posición pausada |
| Portadas | 2 pruebas de código y 3 comprobaciones en navegador: respaldo visible y portada siguiente cargada |
| Generadores de imágenes | 49/49 llamadas locales completadas |
| Web | Seis páginas a 390, 768 y 1440 px; controles de volumen y cambio de canción con respuestas demoradas y eventos de Socket.IO |
| MongoDB | Backup restaurado en instancia aislada; migración repetida sin duplicación y conservación de colección anterior |

La carga de 810 comandos no demuestra su ejecución completa. Las pruebas web usan datos controlados y no sustituyen el acceso OAuth real. Desplegado: salud HTTP 200. Reinicio de Lavalink verificado: sesión restaurada en pausa, volumen 0, una canción en cola y posición 4200 ms. La primera comprobación de transición tras reiniciar el bot falló. Se añadieron cierre explícito de los reproductores anteriores, conservación de posición pausada y recuperación de conexiones de voz; su repetición en producción sigue pendiente.

## Límites y dependencias externas

Algunos endpoints NSFW de Nekos fueron retirados; conservar el comando no recupera ese proveedor. La auditoría de dependencias quedó en 0 avisos críticos, 3 altos y 32 moderados. Los altos restantes pertenecen a la cadena HTTP heredada de `random-puppy` y `translatte`; se requiere reemplazar esas integraciones para eliminarlos sin romper comandos. No se aplicaron actualizaciones forzadas que cambien sus contratos.

WARP es gratuito, pero YouTube puede rechazar su salida. La prueba inicial encontró ese rechazo; tras renovar la conexión, los dos vídeos de prueba resolvieron y descargaron audio. No se garantiza que una salida permanezca aceptada. La segunda prueba larga decodificó 3558,54 segundos de audio sin excepción del proveedor, pero no alcanzó el requisito de 3600 segundos dentro del plazo; no se registra como prueba de continuidad aprobada.

## Recuperación del despliegue

Backup previo: `/home/backups/obey-releases/2026-10-03T19-37-34-463Z` (privado). Imágenes conservadas: `localhost/obey-bot:rollback-20261003` y `localhost/obey-lavalink:rollback-20261003`.

Ante una regresión: detener el bot con plazo de 30 segundos, guardar los logs de forma privada, recuperar los archivos Compose/configuración originales del backup y recrear con las imágenes de rollback. La migración es aditiva; no restaurar MongoDB automáticamente porque borraría cambios posteriores de usuarios. Si una restauración de datos resulta necesaria, detener escrituras primero y usar el archivo privado `mongo.archive.gz`.

El chequeo de voz `scripts/live-music-check.js` solo se habilita con variables de entorno explícitas, en un canal vacío donde el bot ya estaba conectado. El volumen se mantiene en cero durante los tramos de audio y las variables de chequeo se retiran al finalizar.


## Plataforma OBEY — continuación en el proyecto principal

El workspace activo es `/home/OBEY-YOUR-MASTER`, rama `feature/obey-main-implementation`. Recursos/controles/letras de la entrega anterior están incorporados; registry musical, OAuth/API y compatibilidad de bienvenida tienen avances locales. La fuente de estado actual es `docs/platform/CHECKPOINT.md`; la matriz y todas las tareas centrales permanecen en `docs/platform/requirements.json` y `tasks/todo.md`. CI incorpora requisitos de compilación Canvas para Node 22 y verifica código/assets/schemas/build sin iniciar servicios. No equivale a despliegue ni plataforma terminada.

Tiempo real musical: autorización de sesión almacenada por envío, permisos con TTL 15 s y fail closed, logout local y snapshots al reconectar. Suite actual: 193 tests en 48 archivos; instalación limpia y build Docker completados. Alcance y límites en docs/platform/CHECKPOINT.md.

Architect añade lectura fresca de estructura, editor web/preview y borradores Mongo privados con revisión; `/config architect` consulta el mismo servicio. Alcance actual y continuación del plan en docs/platform/ARCHITECT.md.
Jobs de análisis Architect: BullMQ 5.81.5 y registro Mongo con outbox de entrega, idempotencia, checkpoint, fencing y cancelación. Web y `/config architect accion:analizar` comparten servicio; workers requieren habilitación y Redis explícitos. Ver `docs/platform/JOBS.md` y ADR 001. Redis dedicado configurado por petición expresa; leases por guild, puntos privados de estructura y aplicación confirmada de nombres/temas/colores con guard/journal duraderos implementados. Ver `docs/platform/REDIS.md`, `RESTORE-POINTS.md` y `APPLICATIONS.md`. Creaciones/movimientos/permisos/configuración, restore/rollback y canary real siguen pendientes. No se reinició ni desplegó el bot.

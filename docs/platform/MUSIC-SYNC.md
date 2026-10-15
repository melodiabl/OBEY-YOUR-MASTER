# Letras sincronizadas y autoplay público

Dominio `music`, contratos: letras completas con identidad de reproducción, pausa/seek/reanudación coherentes y autoplay conservado. Fuente adicional recibida el 15/10/2026: `/home/OBEY_Documentacion_actualizada_2026-10-15/OBEY_Documentacion`; SHA-256 del ZIP `ca088d85cdf3a062216043dd87629de1297325dab7515b06b5eefac01c963668`. Extracción íntegra de 4130 entradas / 152563722 bytes; comprimido eliminado. El handoff contiene una auditoría histórica del 10/10, no sustituye la evidencia de ejecución vigente ni declara cerrados los 32 contratos.

## Corrección

Discord, web, embeds y persistencia usan `handlers/music/playback-clock.js`: posición anclada al reproductor, velocidad × rate, congelación durante pausa/carga/recuperación. Los cambios de filtros conservan posición. Los timestamps del nodo se comparan entre sí; el reloj de un público diferente al host ya no invalida sus correcciones. Cada reproducción reinicia ese comparador.

Las letras consultan la grabación codificada del nodo activo mediante LavaLyrics, con sus propias credenciales; no consultan el privado apagado. LRCLIB recibe duración/álbum cuando existen, y rechaza letras de una grabación cuya duración difiere más de dos segundos. Caché y solicitudes compartidas separan grabaciones. Se conservan timestamps repetidos y silencios instrumentales; antes del primer verso no se resalta una línea anticipadamente.

Discord revisa la posición cada 500 ms, edita solo cambios y limita las ediciones a una por segundo. La web aplica los ticks autorizados del servicio, su velocidad y estado de carga; descarta revisiones antiguas y congela la proyección al desconectar. Mantiene paginación y texto completo.

Autoplay usa el buscador musical compartido con los públicos configurados y sus respaldos, en lugar de depender exclusivamente de `ytsearch` de un nodo. Busca artista y una segunda consulta musical si hace falta; evita títulos/URLs recientes, conserva la identidad del nodo de resolución, respeta la cola manual y cancela resultados posteriores a detener. No añade fuentes adultas ni reactiva privados. Una búsqueda sin candidatos todavía termina en estado inactivo; no se inventa una canción.

## Comprobación

405 pruebas pasan, incluidas regresiones reproducidas antes de corregir reloj/LRC/proveedor/autoplay. El fixture de navegador ejecuta el EJS y JS reales con datos de prueba: posición, ticks, revisión antigua, velocidad, recuperación, pausa, paginación completa, desconexión y denegación. Reproducible con `node scripts/verify-lyrics-browser.js <ruta-a-playwright>`. [Resultado](evidence/lyrics-sync-browser.json), [escritorio](evidence/lyrics-sync-desktop.png), [móvil](evidence/lyrics-sync-mobile.png).

HTTP real de Nazha: búsqueda con 10 resultados, candidato distinto para autoplay y letras sincronizadas disponibles con 58 entradas. [Resultado sin letras ni credenciales](evidence/music-provider-check.json). No implica escucha humana ni exactitud universal de los timestamps del proveedor.

La prueba optativa `scripts/autoplay-music-check.js`, fase `autoplay` del comprobador de release, comprueba una transición natural con cola vacía en la conexión inactiva del bot o un canal vacío del servidor autorizado, volumen cero y sin mensajes. Guarda resultado privado y restaura el estado previo; si había reproducción activa no la toca. Solo se inicia con variables explícitas de release, sin endpoint público.

La última prueba de voz se omitió porque THZ tenía una canción y una pista en cola, volumen 100. Los intentos iniciales del verificador chocaron con la protección contra mover una conexión existente; se corrigió el verificador, no se debilitó ese guard. No se afirma transición natural/audición de autoplay en vivo en esta entrega. [Resultado y alcance](evidence/autoplay-thz.json).

Desplegado código `8b1725a8` (producto `e5ea8253` más correcciones del verificador), imagen `849b2ebff87f45089c2bc10b856a12b4f8f2d055dbcd210eeb44ed24f6e920c4`. Las capas posteriores modifican exclusivamente el comprobador; 16 archivos musicales del contenedor coinciden por SHA-256 con Git. Bot healthy, cero reinicios y errores de arranque, salud 200 y JS de letras publicado idéntico al verificado. Nazha/Serenetia/MilloHost conectados; privado apagado/excluido/restart=no/2333 cerrado. Imágenes y Redis conservan imagen y fecha de inicio. Variables y montaje de prueba retirados; recuperación `.runtime/bot-recovery-public-only.yml` fija la imagen actual con privados excluidos. [Estado final](evidence/music-sync-runtime.json).

## Fuentes de protocolo y operación

[LRCLIB](https://lrclib.net/docs) y [LavaLyrics](https://github.com/topi314/LavaLyrics). El endpoint `java-timed-lyrics /lyrics/search` devuelve resultados de búsqueda, no las líneas asumidas por el código anterior; [documentación](https://github.com/DuncteBot/java-timed-lyrics).

Permisos Discord/web, sesión, CSRF y suscripciones autorizadas se conservan. Configuración privada de nodos permanece fuera del DTO público y de Git. El nodo privado debe seguir apagado, sin reinicio automático ni puerto 2333. Recuperar únicamente una imagen verificada de la configuración pública; no restaurar MongoDB ni los overrides históricos que reactivaban privados.

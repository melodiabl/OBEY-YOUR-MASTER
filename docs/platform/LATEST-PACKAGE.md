# Paquete del 15/10 y recuperación de letras

La fuente vigente es `/home/OBEY_Documentacion_actualizada_2026-10-15/OBEY_Documentacion`. El comprimido actualizado se extrajo y verificó (4130 entradas, SHA-256 `ca088d85cdf3a062216043dd87629de1297325dab7515b06b5eefac01c963668`) y se eliminó. La extracción del 14/10 quedó reemplazada y fue retirada. Se conserva el paquete original del usuario.

Se integró el parche backend de 1392 rutas mediante comparación con su base Git `9f11a850`, preservando los cambios posteriores del proyecto. El resultado modifica 1252 archivos: recursos, traducciones, presentación y mejoras funcionales. No se reintrodujeron comandos NSFW ni generadores Fun retirados. Se excluyó el icono adulto y se renombraron los dos archivos nuevos con prefijo module-. La tipografía local, la estructura musical actual y las preferencias privadas se conservaron.

El registro conserva tarjetas/variantes existentes y añade los recursos nuevos: 301 materiales, 89 aliases de compatibilidad y 280 emojis seleccionados (270 PNG, diez GIF). La sincronización real completó los 280 sin fallos; conserva recursos ajenos, hashes, validación de aplicación y formato, mapas v2 y recuperación tras respuesta perdida. La imagen nueva resolvió los 280 y el arranque no informó fallbacks por falta de mapa/verificación. Los 32 contratos del plan no se declaran terminados por aplicar el paquete.

## Música y letras

Se mantiene la corrección del evento finished: el identificador propio de reproducción es autoritativo aunque cambie el encoding del proveedor. Las pruebas cubren cola, repetición, mezcla, eventos duplicados/cleanup, fallos REST y recuperación. El autoplay usa búsqueda compartida con nodos públicos, excluye grabaciones recientes y encodings repetidos y puede cancelar una consulta que nunca responde, sin revivir música tras Stop. Una recuperación no sustituye una canción por un resultado no relacionado.

El panel de letras de THZ dejó de editarse justo antes de un reinicio anterior. Ahora se guardan activación, canal y mensaje en MusicGuild y se recupera el mismo panel al iniciar. Se migró únicamente la referencia al mensaje anterior, comprobando que su autor era el bot. Tras desplegar, ese mismo mensaje volvió a editarse y quedó en espera de reproducción. No se enviaron mensajes de prueba ni se cambió la música de los usuarios. En la web, el verso activo permanece dentro de su área visible y se conserva el desplazamiento manual.

La comprobación final encontró THZ sin pista activa. La coincidencia audible verso/audio y una transición natural con nueva recomendación quedan pendientes de reproducir una canción real; las comprobaciones HTTP, unitarias y del navegador no prueban audición. El arranque también registró un aborto de conexión en una restauración 24/7; no se afirma que todas las sesiones 24/7 hayan recuperado voz. Los tres nodos públicos quedaron conectados y el panel de THZ recuperado.

## Verificación y despliegue

494 pruebas pasan, sin canceladas ni omitidas. Se comprobaron 723 archivos JavaScript y Chromium ejecutó EJS/JS reales en escritorio/móvil con transporte simulado, sin errores. El proveedor real devuelve diez resultados de música, un candidato distinto de autoplay y 58 líneas sincronizadas. La imagen verifica los hashes de 1246 archivos de su contexto, corre como UID 1000 y no contiene .env. Smoke aislado: 19 comandos raíz, 22 opciones Fun, sin comandos adultos y PNG nativo de 1772×720.

Código activo `078a55b86bebcf672f917eab6901380d67e6708a`, imagen `e37d538ea9840c2020ee1b10cb917f913c6c21af92649f2a677d5a296742d096`, etiqueta `release-package-20261015` y `latest`. Solo se recreó el bot: healthy, sin reinicios y sin errores de handlers/no controlados; Mongo/música listos. Imágenes/Redis mantienen sus contenedores. Un PNG optimizado del servicio separado está actualizado en Git; no se recreó ese servicio por una optimización de archivo.

Nazha es principal; Serenetia/MilloHost están conectados como respaldos. Privado apagado/excluido, restart=no, sin 2333 ni WARP. Recuperación vigente `.runtime/bot-recovery-public-only.yml` fija esta imagen pública; la imagen anterior de fin de cola se conserva como respaldo. Las configuraciones históricas citadas por entregas anteriores fueron retiradas. No restaurar MongoDB ni activar el privado como efecto de una reversión.

## Limpieza

Retirados temporales antiguos, extracción anterior, tres worktrees obsoletos y 17 etiquetas de versiones anteriores. Los cambios no guardados de dos copias antiguas se conservaron en stashes locales antes de retirar sus carpetas. Se eliminaron tres verificadores de voz y su modo especial de arranque. Se conservan el ZIP extraído vigente, mapas/configuración/datos activos, backups y las 16 entradas locales previas del proyecto principal.

Evidencia: [integración](evidence/latest-package-integration.json), [ejecución](evidence/latest-package-runtime.json), [panel real de letras](evidence/lyrics-panel-recovery.json), [proveedor](evidence/music-provider-check.json), [nodos públicos](evidence/public-nodes-current.json), [navegador](evidence/lyrics-sync-browser.json), [limpieza](evidence/unused-cleanup.json) y [etiquetas retiradas](evidence/unused-images-cleanup.json).

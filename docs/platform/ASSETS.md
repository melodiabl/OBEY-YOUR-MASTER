# Recursos aprobados e integración musical

El contrato se conserva en `assets/obey/registry.json`; las claves musicales históricas se resuelven en `assets/obey/music-keys.json`. La selección del paquete consolidado está en `registry.selected`: 103 claves, 89 aliases y 82 entradas de emoji. Sus 324 archivos seleccionados por destino están en `assets/obey/selected/`, nombrados por hash; Docker los incluye con `COPY . .`. El material histórico se conserva para leer mapas v1. Las maquetas de tarjetas siguen identificadas como fixtures: no son tarjetas de usuarios ni una implementación del renderer.

`handlers/assets/registry.js` resuelve rutas semánticas, fallbacks y mapas de IDs. Los doce controles de `handlers/music/controls.js` son la fuente común del reproductor activo (`embeds.js`, usado por `index.js` y `liveupdate.js`) y panel vacío (`setup.js`). Mantienen custom IDs, estados de pausa/historial/loop/autoplay/volumen y etiquetas en español. Los permisos y temporizadores continúan en el servicio/router existente.

## Estado vigente · 15 de octubre de 2026

El ZIP actualizado amplía el registro a 316 materiales y 295 emojis (285 PNG, diez GIF). Se sincronizaron los 295 con la aplicación sin errores y se verificaron dentro del bot desplegado. El icono adulto del paquete no forma parte de esta instalación. Los materiales iniciales y sus variantes siguen disponibles para tarjetas y compatibilidad. Los 15 recursos añadidos son logos de plataformas y no sustituyen los controles propios. Ver [integración actual](PLATFORMS.md).

## Validación sin credenciales ni llamadas externas

```sh
node scripts/obey-assets.js
node scripts/obey-assets.js --keys=play,pause,queue
node --test test/obey-assets.test.js test/setup-panel.test.js
```

El primer comando valida los 295 recursos seleccionados: 285 PNG y diez GIF, firma, decodificación real, 128×128, peso ≤256 KiB, nombres válidos y hash SHA-256. El modo por defecto es exclusivamente local. Los nombres usan storageKey y hash del plan seleccionado; aliases como repeat/icon.loop no generan copias. `validateAssets()` conserva la validación de los 89 PNG anteriores para compatibilidad; la CLI usa `validateSelectedAssets()`.

El registro ampliado y sus archivos están versionados en Git. El importador inicial `import-obey-materials.js` reproduce únicamente la selección histórica de 82 emojis: no debe ejecutarse sobre el registro ampliado. La CLI de validación/sincronización anterior es la entrada operativa actual y comprueba los 295 recursos antes de cargar.

## Carga explícita y estado de Discord

El 13 de octubre se cargaron las 82 entradas en la aplicación `1460818547193417931` (OBEY YOUR MASTER): 72 estáticas y diez animadas, cero fallos. Listados posteriores confirmaron 117 emojis en total y reutilización de las 82 entradas; los 35 recursos anteriores se conservaron. El contenedor activo resolvió las 82 claves tras contrastar el mapa con Discord. Evidencia y despliegue en [RELEASE-2026-10-13.md](RELEASE-2026-10-13.md).

```sh
# Variables suministradas por el operador; nunca en git ni argumentos del proceso.
# DISCORD_CLIENT_ID, BOT_TOKEN y, opcionalmente, OBEY_EMOJI_MAP_FILE.
node scripts/obey-assets.js --apply --keys=play,pause,skip
```

Sin `--keys` se seleccionan los 295 emojis. La carga lista los emojis de la aplicación antes de crear; reutiliza los nombres de contenido ya existentes, rechaza ambigüedades/IDs renombrados y nunca elimina ni modifica emojis remotos. No usa endpoints de guild ni modifica servidores. Una respuesta perdida se reconcilia mediante listado, sin repetir el POST a ciegas. Si el listado confirma que no se creó, el mapa v2 registra upload_failed sin guardar detalles privados y continúa con otros recursos. La CLI devuelve estado parcial y código de salida 1 cuando hay fallos; un nuevo intento reutiliza los recursos confirmados. El REST adapter desactiva reintentos de errores del servidor para creaciones. Los rate limits del cliente REST siguen activos.

El mapa se escribe atómicamente después de cada recurso y permite reanudar. Un lock por archivo impide dos sincronizaciones locales simultáneas; no es coordinación distribuida: no ejecutar operadores en distintos hosts a la vez. Un proceso terminado a la fuerza puede dejar `.lock`; comprobar que no está activo antes de retirarlo. Tras cambios de imagen no se borra la versión anterior automáticamente.

El mapa por defecto de la CLI es `assets/obey/application-emojis.json`, ignorado por git y excluido del contexto Docker. El despliegue actual usa `.runtime/emojis/application-emojis.json`, montado de solo lectura en `/app/runtime-emojis`; Compose fija `OBEY_EMOJI_MAP_FILE` a ese destino. Directorio 0750 y archivo 0640 con grupo 1000 permiten leerlo al usuario `node`. Una nueva ejecución de la CLI debe usar el destino del host; tras su escritura atómica con 0600 hay que restaurar grupo/lectura y reiniciar el bot para recargarlo. Existe copia privada del mapa junto al backup de la entrega. El mapa v2 guarda claves canónicas; legacyEmojis conserva recursos v1 existentes hasta reemplazarlos. El resolver comprueba app ID, nombre, hash actual y tipo PNG/GIF; nunca acepta el hash anterior como el nuevo contenido. El mapa es un artefacto de operador de confianza; no se admite desde peticiones de usuarios. Sin mapa, con mapa corrupto o de otra aplicación utiliza Unicode.

El handler assets consulta la lista de la aplicación al recibir ClientReady y cada cinco minutos, con una única consulta pendiente. Antes de la primera comprobación, y ante un fallo, usa fallbacks. Un recurso borrado/renombrado/indisponible deja de resolverse al actualizar la lista. Los controles y textos musicales consultan el resolver actualizado; el apagado retira listener/timer y descarta respuestas tardías. La comprobación no reescribe el historial: paneles previamente enviados conservan su contenido hasta que el flujo normal los actualice. Puede haber hasta cinco minutos entre una eliminación remota y su detección; no se promete reparación inmediata de todos los mensajes.

## Evidencia y límites

Ver [entrega de remodelación](REMODELACION.md) para el incremento inicial y [despliegue actual](RELEASE-2026-10-13.md). La carga y resolución remotas están confirmadas. La inspección visual de emojis y controles dentro del cliente Discord sigue pendiente. El renderer compartido y los fondos/preview web ya están implementados y desplegados según [CARDS.md](CARDS.md); el resto del proyecto conserva sus criterios pendientes.

Fuentes primarias verificadas el 2026-10-04: [Emoji Resource](https://docs.discord.com/developers/resources/emoji) (endpoints de aplicación, imagen y tamaño) y [Component Reference](https://docs.discord.com/developers/components/reference) (filas, botones y formato legacy). Este incremento conserva embeds+ActionRow; no mezcla Components V2 con embeds.

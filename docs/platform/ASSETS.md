# Recursos aprobados e integración musical

El contrato se conserva en `assets/obey/registry.json`; las claves musicales históricas se resuelven en `assets/obey/music-keys.json`. La selección del paquete consolidado está en `registry.selected`: 103 claves, 89 aliases y 82 entradas de emoji. Sus 324 archivos seleccionados por destino están en `assets/obey/selected/`, nombrados por hash; Docker los incluye con `COPY . .`. El material histórico se conserva para leer mapas v1. Las maquetas de tarjetas siguen identificadas como fixtures: no son tarjetas de usuarios ni una implementación del renderer.

`handlers/assets/registry.js` resuelve rutas semánticas, fallbacks y mapas de IDs. Los doce controles de `handlers/music/controls.js` son la fuente común del reproductor activo (`embeds.js`, usado por `index.js` y `liveupdate.js`) y panel vacío (`setup.js`). Mantienen custom IDs, estados de pausa/historial/loop/autoplay/volumen y etiquetas en español. Los permisos y temporizadores continúan en el servicio/router existente.

## Validación sin credenciales ni llamadas externas

```sh
node scripts/obey-assets.js
node scripts/obey-assets.js --keys=play,pause,queue
node --test test/obey-assets.test.js test/setup-panel.test.js
```

El primer comando valida los 82 recursos seleccionados: 72 PNG y diez GIF, firma, decodificación real, 128×128, peso ≤256 KiB, nombres válidos y hash SHA-256. El modo por defecto es exclusivamente local. Los nombres usan storageKey y hash del plan seleccionado; aliases como repeat/icon.loop no generan copias. `validateAssets()` conserva la validación de los 89 PNG anteriores para compatibilidad; la CLI usa `validateSelectedAssets()`.

Importación reproducible desde el paquete conservado junto al repositorio:

```sh
node scripts/import-obey-materials.js /home/OBEY_Documentacion
node scripts/import-obey-materials.js /home/OBEY_Documentacion --check
```

El importador comprueba rutas reales, hashes, peso declarado, destinos, aliases y nombres antes de escribir. Solo incorpora las variantes seleccionadas en production-materials.json; conserva secciones existentes del registro. `selectedAsset(key, destination)` devuelve la variante concreta y sus metadatos, incluida `fixtureOnly`; no envía por sí mismo imágenes ni publica el paquete en el dashboard.

## Carga explícita, pendiente de ejecución en Discord

```sh
# Variables suministradas por el operador; nunca en git ni argumentos del proceso.
# DISCORD_CLIENT_ID, BOT_TOKEN y, opcionalmente, OBEY_EMOJI_MAP_FILE.
node scripts/obey-assets.js --apply --keys=play,pause,skip
```

Sin `--keys` se seleccionan los 82 emojis. La carga lista los emojis de la aplicación antes de crear; reutiliza los nombres de contenido ya existentes, rechaza ambigüedades/IDs renombrados y nunca elimina ni modifica emojis remotos. No usa endpoints de guild ni modifica servidores. Una respuesta perdida se reconcilia mediante listado, sin repetir el POST a ciegas. Si el listado confirma que no se creó, el mapa v2 registra upload_failed sin guardar detalles privados y continúa con otros recursos. La CLI devuelve estado parcial y código de salida 1 cuando hay fallos; un nuevo intento reutiliza los recursos confirmados. El REST adapter desactiva reintentos de errores del servidor para creaciones. Los rate limits del cliente REST siguen activos.

El mapa se escribe atómicamente después de cada recurso y permite reanudar. Un lock por archivo impide dos sincronizaciones locales simultáneas; no es coordinación distribuida: no ejecutar operadores en distintos hosts a la vez. Un proceso terminado a la fuerza puede dejar `.lock`; comprobar que no está activo antes de retirarlo. Tras cambios de imagen no se borra la versión anterior automáticamente.

El mapa por defecto es `assets/obey/application-emojis.json`, ignorado por git. En Docker debe montarse persistente y legible por el usuario `node` (o configurar `OBEY_EMOJI_MAP_FILE`). Reiniciar el bot de prueba para recargarlo. El mapa v2 guarda claves canónicas; legacyEmojis conserva recursos v1 existentes hasta reemplazarlos. El resolver comprueba app ID, nombre, hash actual y tipo PNG/GIF; nunca acepta el hash anterior como el nuevo contenido. El mapa es un artefacto de operador de confianza; no se admite desde peticiones de usuarios. Sin mapa, con mapa corrupto o de otra aplicación utiliza Unicode.

El handler assets consulta la lista de la aplicación al recibir ClientReady y cada cinco minutos, con una única consulta pendiente. Antes de la primera comprobación, y ante un fallo, usa fallbacks. Un recurso borrado/renombrado/indisponible deja de resolverse al actualizar la lista. Los controles y textos musicales consultan el resolver actualizado; el apagado retira listener/timer y descarta respuestas tardías. La comprobación no reescribe el historial: paneles previamente enviados conservan su contenido hasta que el flujo normal los actualice. Puede haber hasta cinco minutos entre una eliminación remota y su detección; no se promete reparación inmediata de todos los mensajes.

## Evidencia y límites

Ver [entrega de remodelación](REMODELACION.md) para pruebas y límites actuales. No se han cargado emojis, probado su legibilidad en el cliente Discord ni comprobado los controles en un servidor real. La composición de tarjetas, pipeline de previews y renderer unificado se mantienen pendientes; importar materiales no los implementa.

Fuentes primarias verificadas el 2026-10-04: [Emoji Resource](https://docs.discord.com/developers/resources/emoji) (endpoints de aplicación, imagen y tamaño) y [Component Reference](https://docs.discord.com/developers/components/reference) (filas, botones y formato legacy). Este incremento conserva embeds+ActionRow; no mezcla Components V2 con embeds.

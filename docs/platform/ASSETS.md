# Recursos aprobados e integración musical

El contrato aprobado se conserva en `assets/obey/registry.json`; las claves musicales históricas se resuelven en `assets/obey/music-keys.json`. Los PNG, SVG y fuentes del paquete están incluidos en `assets/obey/assets/` y Docker los copia con `COPY . .`. Las fuentes originales y los adaptadores permanecen en `OBEY_Diseno_Completo_Codex/`. Las propuestas de pantallas se conservan en la copia local del paquete: no son funcionalidad implementada.

`handlers/assets/registry.js` resuelve rutas semánticas, fallbacks y mapas de IDs. Los doce controles de `handlers/music/controls.js` son la fuente común del reproductor activo (`embeds.js`, usado por `index.js` y `liveupdate.js`) y panel vacío (`setup.js`). Mantienen custom IDs, estados de pausa/historial/loop/autoplay/volumen y etiquetas en español. Los permisos y temporizadores continúan en el servicio/router existente.

## Validación sin credenciales ni llamadas externas

```sh
node scripts/obey-assets.js
node scripts/obey-assets.js --keys=play,pause,queue
node --test test/obey-assets.test.js test/setup-panel.test.js
```

El primer comando valida los 89 PNG: firma, decodificación real, 128×128, peso ≤256 KiB, nombres válidos y hash SHA-256. El modo por defecto es exclusivamente local. El nombre remoto incluye clave y hash del contenido; un cambio de imagen crea una nueva versión y conserva las anteriores.

## Carga explícita, pendiente de ejecución en Discord

```sh
# Variables suministradas por el operador; nunca en git ni argumentos del proceso.
# DISCORD_CLIENT_ID, BOT_TOKEN y, opcionalmente, OBEY_EMOJI_MAP_FILE.
node scripts/obey-assets.js --apply --keys=play,pause,skip
```

Sin `--keys` se seleccionan todos los emojis. La carga lista los emojis de la aplicación antes de crear; reutiliza los nombres de contenido ya existentes, rechaza ambigüedades y nunca elimina ni modifica emojis ajenos. No usa endpoints de guild ni modifica servidores. Una respuesta perdida se reconcilia mediante listado: si no puede confirmar la creación, se detiene sin repetir el POST a ciegas. El REST adapter desactiva reintentos de errores del servidor para creaciones. Los rate limits del cliente REST siguen activos.

El mapa se escribe atómicamente después de cada recurso y permite reanudar. Un lock por archivo impide dos sincronizaciones locales simultáneas; no es coordinación distribuida: no ejecutar operadores en distintos hosts a la vez. Un proceso terminado a la fuerza puede dejar `.lock`; comprobar que no está activo antes de retirarlo. Tras cambios de imagen no se borra la versión anterior automáticamente.

El mapa por defecto es `assets/obey/application-emojis.json`, ignorado por git. En Docker debe montarse persistente y legible por el usuario `node` (o configurar `OBEY_EMOJI_MAP_FILE`). Reiniciar el bot de prueba para recargarlo. El resolver solo usa IDs con app ID coincidente, nombre esperado, imagen/hash actuales y formato válido. El mapa es un artefacto de operador de confianza; no se admite desde peticiones de usuarios. Sin mapa, con mapa corrupto o de otra aplicación utiliza Unicode. No inventa IDs ni asume que los IDs históricos siguen existiendo.

## Evidencia y límites

Validación local de los 89 PNG: máximo 29.560 bytes. Pruebas de controles, aislamiento de app, mapa corrupto, reutilización, respuesta perdida y nombres ambiguos. No se han cargado emojis, probado su legibilidad en el cliente Discord ni comprobado los controles en un servidor real. La composición de tarjetas, pipeline de previews y renderer unificado se mantienen pendientes; copiar bases/fuentes no los implementa.

Fuentes primarias verificadas el 2026-10-04: [Emoji Resource](https://docs.discord.com/developers/resources/emoji) (endpoints de aplicación, imagen y tamaño) y [Component Reference](https://docs.discord.com/developers/components/reference) (filas, botones y formato legacy). Este incremento conserva embeds+ActionRow; no mezcla Components V2 con embeds.

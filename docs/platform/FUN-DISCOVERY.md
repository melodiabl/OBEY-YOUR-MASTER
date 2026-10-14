# Corrección de Fun para descubrimiento · 14 de octubre de 2026

El usuario pidió conservar Fun y transcribió el aviso de Discord: «Tus comandos no deben contener lenguaje dañino o malsonante /fun». El schema publicado contenía `shit` como nombre de subcomando y en su descripción. No era suficiente eliminar la categoría NSFW.

## Cambios

- `/fun shit` pasa a `/fun facepalm`, con descripción neutral que corresponde al meme facepalm que ya generaba. No se conserva el nombre anterior como alias.
- Retirado el comando de prefijo `shit`; el comando de prefijo `facepalm` existente se conserva.
- Retirado `brazzers` de Fun y del facade de memes. Se eliminan los generadores y carpetas de assets `brazzers` y `shit` del servicio de imágenes, no solo los nombres de comandos.
- El cargador y el catálogo rechazan estos nombres retirados aunque vuelvan a una carpeta ordinaria. Las expresiones y memes ordinarios de Fun se conservan.
- Eliminadas las traducciones de NSFW, setup-autonsfw y los dos comandos retirados en los cinco idiomas, así como la entrada de ayuda legacy de esa categoría. Se conservan las demás traducciones y las claves inertes de configuración antigua.

## Verificación

La regresión con comandos sintéticos bajo una carpeta ordinaria reprodujo el problema antes del cambio. Suite completa: **368/368**, sin fallos/skips. Fun conserva 22 subcomandos; las 18 raíces y 25 subcomandos musicales permanecen. Se comprueban nombres/descripciones sin los términos retirados y el método adulto ausente del facade.

Auditoría: 671 archivos de comandos cargados, cero errores/conflictos; catálogo de 672 invocaciones (530 de prefijo, 142 slash). Todos los builders de ayuda/schema validan sin publicar desde los scripts de prueba.

## Despliegue y registro

Desplegado el snapshot `ee93d41a80e705ee3c57cffa70c842448bfafa50`, construido desde Git, excluyendo las 16 entradas locales previas de Architect/evidencias. Bot: `localhost/obey-your-master_bot:release-fun-clean-20261014`, imagen `2c9271d18273dca6b973be120e78ad03621b29feb6294137ea113a0b1c7185cb`, iniciado a `2026-10-14T00:13:18.265347177Z`. Imágenes: `localhost/obey-images:release-fun-clean-20261014`, imagen `14a43c1b47063619759f5543febbe67f37d354da953b1cef6571e13de4dfdf69`, iniciado a `2026-10-14T00:12:54.386242902Z`. Ambos healthy y sin reinicios. Lavalink y Redis conservan los arranques anteriores.

Prueba de imagen del bot sin red: 18 raíces, 22 subcomandos Fun con facepalm, métodos retirados ausentes, 82 IDs del mapa y PNG de tarjeta aislada. Prueba de imagen del servicio sin red: 43 generadores ordinarios, rutas retiradas 404 y render de wanted 736×959. La misma comprobación HTTP pasó en el servicio activo, sin enviar mensajes a Discord; evidencia [fun-images-live.json](evidence/fun-images-live.json).

Después del arranque, Discord devolvió `/fun facepalm`, ningún nombre/descripción de los términos retirados, `nsfw: false` y ninguna traducción de comandos almacenada. El usuario confirmó que el portal todavía mostraba el aviso. Se inspeccionaron los permisos de Fun en los cuatro servidores y se respaldó su registro en un archivo privado: no había permisos personalizados. Se renovó exclusivamente ese registro, preservando default_member_permissions, dm_permission, contexts e integration_types, sin cambiar su nombre ni retirar la categoría.

Registro anterior `1517003173716561945`; registro nuevo `1559723149858312272`. Discord confirma 18 raíces y Fun con 22 subcomandos/facepalm y flag adulto falso. Los 98 registros de comandos de servidor en total se conservan, sin NSFW. Evidencia [fun-registration-refresh.json](evidence/fun-registration-refresh.json). No se borra configuración, canales ni mensajes. La renovación no demuestra que el aviso de elegibilidad se haya reevaluado o desaparecido; se solicitó al usuario comprobar de nuevo Discovery → Status.

## Límites y recuperación

El aviso se corrige en el código y en el registro de comandos. No se afirma que Discord haya reevaluado o aprobado el estado de descubrimiento: esa aceptación corresponde a Discord y al propietario en Discovery → Status. Se aplica la [política oficial de contenido](https://support-dev.discord.com/hc/en-us/articles/9489299950487-App-Discovery-Content-Requirements-Policy).

Las imágenes anteriores conservan los nombres/plantillas de esta incidencia. `.runtime/bot-recovery-no-nsfw.yml` y `.runtime/images-recovery-fun-clean.yml` fijan las imágenes nuevas de ambos servicios; no restaurar versiones que vuelvan a exponerlas. Los logs de Compose se conservan privados. Evidencia consolidada en [fun-release.json](evidence/fun-release.json).

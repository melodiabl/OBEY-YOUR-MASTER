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

Esta continuación requiere actualizar bot y servicio de imágenes para retirar también los generadores activos. Los 16 cambios locales previos de Architect/evidencias siguen excluidos del snapshot. No se eliminan canales, configuración ni mensajes de servidores. Estado final e IDs de imágenes se registrarán después de comprobar el despliegue y la API de Discord.

## Límites y recuperación

El aviso se corrige en el código y en el registro de comandos. No se afirma que Discord haya reevaluado o aprobado el estado de descubrimiento: esa aceptación corresponde a Discord y al propietario en Discovery → Status. Se aplica la [política oficial de contenido](https://support-dev.discord.com/hc/en-us/articles/9489299950487-App-Discovery-Content-Requirements-Policy).

Las imágenes anteriores conservan los nombres/plantillas de esta incidencia. La recuperación debe mantener estas retiradas y fijar las imágenes nuevas de ambos servicios; no restaurar versiones que vuelvan a exponerlas. Los logs de Compose se conservan privados.

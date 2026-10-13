# Retirada de comandos NSFW · 14 de octubre de 2026

El usuario pidió eliminar los comandos NSFW o impedir su registro para poder solicitar descubrimiento en el directorio de aplicaciones de Discord. Se retira la funcionalidad completa, sin un interruptor para reactivarla por servidor.

## Alcance

- Eliminados 112 comandos de prefijo y 25 subcomandos slash, junto a sus 66 archivos de datos.
- Eliminados `setup-autonsfw` y el envío automático; retirados del arranque, la recarga y los menús de configuración.
- Eliminado el control Auto-NSFW del panel y su writer HTTP. Las claves antiguas `NSFW`, `autonsfw` y `autoNsfw` quedan inertes: no se borra configuración ni historial de los servidores. El campo legacy del schema se conserva para evitar una migración destructiva.
- Los cargadores y el catálogo rechazan categorías/nombres NSFW y metadata `nsfw: true`, incluso dentro de una carpeta ordinaria. La ayuda no puede volver a ofrecerlos con flags antiguos o un canal marcado +18.
- Se conserva la API ordinaria de expresiones de Nekos.life; se retira su shim adulto. La propiedad `nsfw` de canales Discord sigue siendo metadata estructural para backups/Architect, no un proveedor de contenido adulto.

## Verificación local

Las regresiones nuevas fallaron antes de la retirada y pasan con el cambio. La suite completa pasa 367/367, sin skips. Una prueba de inventario esperaba 19 raíces; ahora comprueba 18 y ausencia de NSFW, conservando los 25 subcomandos musicales y su manifest.

Auditoría: 673 archivos de comandos cargados sin errores/conflictos, 532 invocaciones de prefijo y 142 slash, 674 en el catálogo. Builders de Discord validados: 18 raíces, 141 subcomandos/grupos y una raíz independiente; no se publica desde estas verificaciones.

Chromium con el template real y datos ficticios confirma la retirada del control y la pestaña Otros ajustes a 1440 y 320 px, sin errores de página/consola ni recursos locales fallidos. No utiliza sesiones OAuth ni datos de producción. Evidencia: [nsfw-browser.json](evidence/nsfw-browser.json), [escritorio](evidence/nsfw-settings-1440.png), [móvil](evidence/nsfw-settings-320.png).

## Registro y despliegue

Antes del cambio, la API de Discord devolvió 19 raíces globales, incluida `/nsfw` aunque su flag `nsfw` era falso. Se comprobaron los cuatro servidores del bot: 98 comandos registrados por servidor, ninguno identificado como NSFW. La limpieza remota solo elimina comandos restringidos; conserva los demás registros.

La publicación se realiza desde un snapshot Git que excluye las 16 entradas locales previas de Architect/evidencias. Solo se recrea `obey_bot`, conservando el mapa de 82 emojis y los servicios de imágenes, Lavalink y Redis. Estado efectivo y comprobaciones posteriores se registrarán al finalizar el despliegue.

## Recuperación

Las imágenes y archivos de rollback anteriores contienen la funcionalidad retirada. No deben usarse para recuperar producción después de esta entrega: volverían a publicar `/nsfw` y a iniciar el envío automático. Ante un fallo, corregir sobre este snapshot o construir una recuperación que mantenga la retirada y pasar los mismos controles antes de arrancar. No se necesita restaurar Mongo ni borrar canales/mensajes para esta entrega.

## Descubrimiento

La [política oficial de contenido para descubrimiento](https://support-dev.discord.com/hc/en-us/articles/9489299950487-App-Discovery-Content-Requirements-Policy) prohíbe comandos y contenido restringidos por edad en aplicaciones con descubrimiento habilitado. Quitar solo el flag de los comandos no cumple este requisito. Esta entrega no garantiza aprobación del directorio: el propietario debe revisar **Discovery → Status** y los demás requisitos de verificación, contenido, términos y privacidad del Developer Portal. No se afirma haber habilitado descubrimiento ni aprobado la aplicación.

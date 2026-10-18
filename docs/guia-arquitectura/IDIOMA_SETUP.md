# Idioma · código y menú remodelados

Incremento local `f4163778677b3b893bde2308c1a328e8d24111e5`, 18/10/2026. Segunda entrada de los [63 setups inventariados](REMODELACION_SETUPS.md). [Evidencia y hashes](../platform/evidence/setup-language.json).

`setup-language` muestra en un mensaje el idioma actual, la selección pendiente y Guardar/Usar inglés/Cerrar. Seleccionar o preparar inglés no escribe: Guardar confirma la persistencia. El panel distingue pendiente, confirmado, conflicto, indisponibilidad y caducidad; no encadena un menú inicial, botones en otro mensaje y otra consulta de estado.

Solo ofrece códigos soportados con catálogo realmente cargado: Español (`es`), English (`en`), Deutsch (`de`) e हिन्दी (`in`). `temp` y los idiomas que el código antiguo anunciaba sin cargar no aparecen. Las traducciones legacy de alemán/hindi pueden recurrir al catálogo inglés como antes; no se promete traducción completa. El nuevo panel tiene textos es/en y el resto conserva su política de fallback. Restablecer conserva inglés como valor predeterminado explícito; una guild sin campo se lee con el default existente español, sin crear datos al consultar. El código heredado `sp` se reconoce al presentar Español y no se reescribe por abrir el panel.

El adaptador de 13 líneas conserva nombre, categoría, permiso Administrator, cooldown y aliases. Su descripción deja de hablar del porcentaje de mayúsculas. Las precedencias efectivas de aliases del inventario se compararon sin cambios: `setup-caps` continúa resolviéndose por el registro de anticaps cuando está cargado.

El controlador `handlers/setup-language.js` posee la sesión del mensaje y los componentes. `handlers/setup-access.js` comparte con la navegación el guard de actor/guild/canal, Administrator, visibilidad, permisos del bot y estado del proceso. Revalida en cada acción, confirma el ACK antes de consultas y ordena los controles por sesión. El collector del SDK caduca a los 180 segundos o 90 de inactividad; finaliza y limpia después de cualquier edición pendiente. No se conserva el listener global manual del código antiguo ni su timeout adicional.

`handlers/language-settings.js` es el escritor canónico de esta operación. Usa el mismo SyncMap/modelo y su cola `exclusive`, lectura real de Mongo, revisión derivada exclusivamente de presencia/valor de `language` y CAS de ese campo. Actualiza solo `$set: { language }`; no añade colecciones, campos de revisión o migraciones. Conserva ajustes de bienvenida, prefijo y demás datos. Los escritores legacy de idioma ajenos a este comando siguen existiendo: el CAS detecta un valor actual distinto, sin atribuir una migración global.

Dos paneles concurrentes no se sobrescriben en silencio: el perdedor conserva su selección, vuelve a leer el idioma actual con autorización y muestra el conflicto. Un segundo Guardar es una nueva decisión después de ver ese estado. No se trata la revisión como un historial de cambios: si el valor vuelve al mismo idioma, el hash vuelve a ser el mismo. No se guardan recibos o auditoría nuevos para esta preferencia escalar.

La caché solo recibe el valor confirmado si no apareció una escritura legacy más nueva mientras esperaba la respuesta. Las escrituras aceptadas entran sin una espera previa en la cola de persistencia; el flush existente las incluye aunque empiece el cierre después. La compuerta de cierre impide nuevas escrituras, incluidas las que todavía estaban autorizándose. No se rediseña el cierre global del proceso.

Si Mongo pudo guardar y se perdió su respuesta, el panel no anuncia éxito ni permite seguir escribiendo a ciegas: cierra controles y pide abrir de nuevo para consultar el valor actual. Cerrar antes de guardar descarta la selección local; caducar después de aceptar una escritura no la cancela ni revierte. No hay efectos Discord que deshacer por guardar el idioma.

## Verificación local

21 grupos con Mongo real aislado, SyncMap real y collectors/builders de discord.js 14.27.0. Miembros, transporte Discord y proveedores son fixtures. Incluye selección sin escritura, guardado/inglés confirmado, cierre sin guardar, idioma falso o no cargado, actor ajeno/revocado, acceso a canal, conflicto con selección conservada, doble Guardar, ACK fallido, caducidad, cierre durante autorización, CAS entre stores, documento/campo ausente, idioma desconocido/`sp`, inputs inválidos, flush de una escritura aceptada, caché legacy más nueva y respuesta perdida después del commit. El guard compartido se comprobó también sobre el catálogo de navegación. 100 ciclos del SDK dejan cero listeners y restauran su límite; cero rechazos no manejados.

Pasaron 25/25 tests originales, tipos/imports del piloto de bienvenida, sintaxis y diff. El grafo registra 1.024 módulos y 3.201 dependencias sin infracciones de las reglas activas; esas reglas no equivalen a tipado o auditoría de todos los setups. Los fixtures y dos bases creadas vacías en las ejecuciones completas se retiraron; el script temporal fue eliminado. No se restauraron tests o verificadores permanentes.

Límites: no se envió ningún mensaje a Discord, ni se comprobó la apariencia en su cliente, OAuth/Gateway, arranque completo, imagen o producción. Los asistentes restantes y la cobertura completa de otros escritores de idioma siguen pendientes. La investigación de HeavenCloud es independiente y no cambia este guardado.

Rollback: revertir el commit de esta entrega. El campo sigue siendo el string legacy compatible, sin datos que borrar. Las preferencias guardadas no se revierten automáticamente. Cambios solo locales, sin publicación remota o despliegue. Siguiente entrada: setup-embed, con código y menú juntos.

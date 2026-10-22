# OBEY · Catálogo completo de equivalentes por evento

Fecha: 20/10/2026 UTC. Revisión visual pendiente. Esta edición integrada sustituye las muestras anteriores de símbolos de registros. Ruta de proyecto: assets/obey/catalog-eventos/.

## Qué está completo y qué no

Se cubrieron los 113 tipos de registro de la lista pública de Quark, más cuatro funciones auxiliares cuyos originales se verificaron: ayuda, facturación, error y situación inesperada. Esto es cobertura completa de esa lista de eventos, NO una verificación del inventario total de emojis originales que el bot de Quark usa internamente.

No se obtuvo una lista exhaustiva de sus IDs de emojis, variantes animadas, iconos de campos o recursos privados. Las capturas compartidas verifican ejemplos de voz e invitaciones, pero no demuestran toda esa biblioteca. No se hicieron pasar diseños de OBEY por originales de Quark.

## Archivos

- 117 entradas de diseño con PNG transparente y SVG editable.
- Dos variantes por entrada: `dorado` (#FFD36F) y `estado` (verde/rojo/azul/dorado según acción).
- 234 exports PNG y 234 SVG. Hay 222 hashes PNG distintos; algunos eventos y variantes reutilizan símbolo. Los aliases están en manifest.json. No interpretar el número de exports como número de emojis que hay que subir.
- Dos láminas con los 113 equivalentes: dorado y por estado.
- Una lámina comparativa con los CUATRO originales públicos verificados, atribuidos a Quark, y sus equivalentes de OBEY. Esa lámina es referencia de investigación, no un recurso del bot.
- Galería `index.html`, inventario por evento, CSV, manifest y guía de integración.

## Cómo revisar

Extraer el ZIP completo y abrir `index.html`. Filtrar por palabra o categoría, cambiar la variante y pulsar Descargar PNG/SVG. La galería muestra archivos reales. Todos los recursos de este catálogo son ESTÁTICOS; no contiene nuevas animaciones ni se verificó que los originales de Quark tengan GIF correspondientes.

Los cuatro originales visibles en la referencia provienen de `quark-bot-discord/content/icons/assistance/`. No se copian sus archivos a las carpetas de emojis de OBEY. Las figuras de OBEY son vectores propios; mantienen la función comunicativa y se adaptan a la paleta de la marca. Sin cuadros navy incrustados detrás de cada símbolo.

## Uso por superficie

Título de registro: símbolo del evento + título traducido, a tamaño pequeño; cuerpo con actor, canal y datos confirmados. Campos: seleccionar símbolos auxiliares solo si ayudan a leer. Botones: etiqueta clara y emoji opcional; nunca depender de un recurso sin binding. Una figura de usuario no concede permiso para mostrar datos privados.

`dorado` ofrece la marca uniforme; `estado` conserva diferencias de creación/entrada, retirada/salida y cambio. El texto siempre explica la acción. Fondo y botones nativos siguen las capacidades reales de Discord; el PNG no cambia el CSS del cliente.

## Integración posterior

Elegir diseños y variantes aprobados → resolver claves con el registro canónico existente → mapear consumidores y aliases → validar tamaños/formatos → publicar emojis autorizados que falten → registrar sus IDs reales → probar en mensajes y componentes. Una entrada del manifest no acredita que exista un listener para ese evento.

Estado actual de TODAS las entradas: included-for-implementation, runtimeRegistered=false, applicationEmojiId=null. Se autorizó su inclusión; la comprobación visual final y conectada sigue pendiente. No se publicaron en Discord y no se reescribieron comandos o backend. El catálogo no convierte automáticamente OBEY en un logger con 113 funciones terminadas.

Las claves son propuestas de diseño. Mantener compatibilidad con las claves existentes al integrarlas; no sustituirlas por una numeración que dependa de Quark. La referencia qNNN sirve para trazabilidad, no para diseñar el dominio de OBEY alrededor de un producto externo.

## Traducciones y fallback

Las etiquetas del inventario son metadatos de revisión. En ejecución, títulos, alt, mensajes y botones deben salir del catálogo i18n del módulo en el idioma de la guild. Si falta un emoji, omitir la imagen y conservar la etiqueta traducida. No mostrar markup roto ni un ID como texto sustituto.

No se traduce automáticamente contenido de miembros, motivos o títulos musicales. Los números del inventario son referencias de eventos y jamás se muestran como si fueran IDs reales de emoji.

## Fuentes primarias

- https://docs.quark.bot/logs/types — lista pública de 113 tipos en nueve categorías, consultada el 20/10/2026 UTC.
- https://docs.quark.bot/logs/overview — estructura de registros y botones.
- https://github.com/quark-bot-discord/content/tree/main/icons/assistance — los cuatro PNG originales verificados.
- Capturas del usuario: ejemplos visibles de entrada/salida de voz e invitación creada. No se incluyen copias de esas capturas personales en la entrega.

El inventario completo de emojis originales de Quark queda no verificado. Una limitación de acceso a archivos públicos no permite concluir que no existan otros recursos.

## Entrada para implementar

Consultar `integration-map.json` y `docs/guia-arquitectura/sistema/15_CATALOGO_EVENTOS.md` desde la raíz del proyecto. El mapa propone claves semánticas y consumidores; no es un segundo registro runtime ni instala aliases automáticamente. Conciliar y extender los registros existentes al programar.

Para consultar el catálogo fuera del proyecto completo, esta misma guía de integración está incluida en docs/INTEGRACION.md. La entrega principal ya contiene esta carpeta y no requiere copiar archivos a mano.

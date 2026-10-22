# Catálogo de eventos integrado · edición 0.6

Ruta única de los nuevos símbolos: `assets/obey/catalog-eventos/`. Abrir index.html, consultar manifest.json, inventario.csv e integration-map.json. La carpeta se integra ya en el ZIP principal; no hay que aplicar un parche o combinar archivos a mano.

## Alcance comprobado

113 tipos de registro de la documentación de Quark tienen un equivalente propuesto; se añaden cuatro auxiliares. Hay dos variantes por entrada: 234 PNG y 234 SVG. El manifest documenta 222 hashes PNG distintos y aliases para no multiplicar subidas de exports iguales. No se acreditó un inventario completo de emojis originales de Quark, animaciones o IDs privados. Los cuatro archivos originales visibles se muestran solo como referencia atribuida.

Incluir archivos no implementa listeners: todas las entradas mantienen runtimeRegistered=false y applicationEmojiId=null. Estado included-for-implementation significa selección para el trabajo, sin afirmar QA conectada o publicación. No inventar 113 funciones activas de registros porque exista un recurso para cada evento de referencia.

## Precedencia de recursos

1. Para nuevas vistas de registros: este catálogo compacto, elegido por significado y contexto.
2. Para escenas grandes y movimiento: expansion-20261020, ahora limitada a nueve entradas (tres escenas y seis GIF).
3. Para controles musicales, marcas, tarjetas y recursos no cubiertos: conservar sus recursos canónicos existentes. El catálogo de logs no sustituye los doce controles Soundy, avatar/banner o plataformas musicales.

Los 24 iconos previos de registros y sus láminas se retiraron; no tienen bindings ni consumidores runtime. No se retiraron recursos de producción con ID ni material ajeno a esa muestra. El historial fuera de este ZIP no es una segunda fuente de implementación.

## Mapa de integración

integration-map.json propone 117 claves semánticas distintas, consumidores candidatos, variante y claves de título/alt. IDs qNNN son trazabilidad de investigación; referenceEventType NO es applicationEmojiId. Al implementar, reconciliar cada proposedSemanticKey con los aliases/registro existentes. No cargar un segundo resolvedor de recursos ni renombrar claves activas sin compatibilidad.

Logs consume información confirmada; moderación controla sus acciones; voz administra salas; AutoMod y seguridad exponen solo las capacidades implementadas. Un icono de facturación es material auxiliar y no crea una función de pagos o suscripciones. Las fichas de módulos describen dónde aplica el nuevo catálogo y dónde conservar recursos existentes.

## Variantes y textos

Por defecto de diseño, registros usan estado: verde para altas/entradas, rojo para retiradas/salidas, azul para cambios y dorado para estados neutros. El tema dorado está disponible como alternativa de marca. El título y cuerpo explican la acción, sin depender del color. No recolorear todos los errores como éxito ni perder las etiquetas de permiso.

Los labels del inventario son revisión en español, no cadenas runtime. Añadir las claves de título, alt y acciones al resolvedor único ES/EN; comprobar variables y audiencia. No usar el nombre técnico de una clave, un ID o markup roto como fallback: conservar texto traducido y omitir el emoji.

## Operaciones antes de producción

Relacionar cada vista real con evento/operación y recurso → verificar permisos/audiencia → resolver clave canónica/alias → revisar a 20/32/128 px → deduplicar exports por hash y variante elegida → publicar solo recursos autorizados que falten → registrar respuesta real de Discord → comprobar texto, botones y actualizaciones en móvil/escritorio.

La publicación usa el pipeline existente de assets. Los ejemplos no contienen secretos. Ante timeout o recurso borrado, conciliar antes de duplicar subidas. La lista de PNG no es el número exacto a publicar: depende de qué vistas estén implementadas, la variante elegida, los hashes repetidos y los emojis que ya existan.

## Aceptación

No mostrar eventos no implementados como activos; no exponer contenido privado en logs; actor desconocido se declara desconocido; doble evento no duplica publicaciones; errores del CDN/emoji conservan texto; dos guilds no comparten configuración por accidente. No presentar un GIF como prueba de entrega o progreso musical.

La entrega actual actualiza archivos, documentación y mapas de implementación. No reescribe comandos, cambia el cliente de audio o despliega el bot. La migración a lavalink-client conserva su contrato y sigue pendiente de programación y pruebas reales.

## Correspondencia con fuentes Discord · edición 0.13

Los 117 recursos se revisan en [materiales CSV](../cobertura-eventos/materiales.csv). Un material puede representar evento, diferencia derivada, operación interna OBEY o auxiliar; no hay 117 eventos Discord independientes. [Capítulo 25](25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) define la captura y sus límites.

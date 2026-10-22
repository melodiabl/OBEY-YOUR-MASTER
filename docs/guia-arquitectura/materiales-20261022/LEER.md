# Materiales OBEY · tanda 0.15

Fecha: 22/10/2026, America/Asuncion. Se extiende el catálogo existente con variantes nuevas pendientes de aprobación. No se reemplaza el personaje ni se retira ningún recurso aprobado.

## Entrega concreta

- 12 familias M01–M12: 24 PNG estáticos transparentes, en 128 y 256 px; 12 fuentes SVG editables; 12 GIF transparentes a 128 px.
- Una ilustración PNG de tickets con el personaje de referencia, creada con la herramienta integrada de generación de imágenes. Prompt íntegro adjunto. Propuesta sin revisión del usuario.
- Una lámina PNG, una vista GIF de conjunto y una galería local con comparaciones. Los previews no son recursos para subir como emojis.

Los iconos se extienden directamente desde sus SVG originales del proyecto; no se trazaron imágenes de competidores. El objeto permanece dorado y su indicador se vuelve azul, manteniendo el símbolo de la acción. Los estáticos dorados/de estado anteriores se conservan.

## Módulo y aplicación

| IDs | Módulo | Mensajes |
| --- | --- | --- |
| M01–M02 | Miembros / logs | Entrada y salida de miembros |
| M03–M08 | Voz / logs | Entrada, salida, micrófono habilitado/silenciado y transmisión iniciada/terminada |
| M09–M10 | Mensajes / logs | Edición y borrado |
| M11–M12 | Roles / logs | Concesión y retirada |
| character.tickets.proposal | Tickets / soporte | Thumbnail o ilustración del panel y ayuda de soporte |

Abrir galeria.html. El manifest de motion incluye sourceKey, propuesta semántica, origen, usos y fallback. Son aliases propuestos: Codex debe reconciliarlos con el resolvedor real antes de conectarlos. Ningún campo null es un ID de Discord válido.

## Reglas de integración

1. En logs, representar un evento confirmado y el estado observado. Una animación del altavoz no significa que se esté grabando, escuchando o midiendo audio. La animación es decorativa.
2. Preferir estático en canales con mucho volumen y en movimiento reducido. Mantener título traducido: el icono no es el único indicador de significado.
3. En botones, solo mapear un recurso si la acción coincide. No usar el emoji de «mensaje borrado» para un cierre de ticket. Una imagen no recibe clics por sí misma.
4. El backend puede editar un mensaje tras recibir una interacción y sustituir un recurso según su estado real. Discord decide la reproducción del GIF; no se garantiza que empiece desde el primer cuadro al hacer clic ni que todos los clientes lo animen.
5. Subir únicamente lo aprobado; validar tamaño, nombre, hash y animación mediante el flujo actual. Registrar snowflakes reales en el mapa existente. No ejecutar publicación automática desde este manifest.
6. La ilustración de tickets se sirve como imagen/attachment con acceso adecuado. No se publica como emoji de botón ni demuestra que el ticket ya fue creado. El texto del panel debe describir el recorrido y las condiciones reales.

## Alcance

No se cambió el runtime, Soundy, sus doce controles, favoritos/datos, la landing o la identidad del bot. Esta tanda no certifica cobertura completa de eventos ni creación de tickets. El resto de módulos y sus recursos previos siguen en MATERIALES.md; no se reinició el trabajo desde cero.

## Corrección visual M05 · revisión 2

Se sustituye la diagonal en un círculo separado por un micrófono tachado, con diagonal azul atravesando el micrófono dorado. El trazo de silencio permanece visible en toda la animación. Las demás familias mantienen su diseño. Estado: propuesta corregida, pendiente de revisión.

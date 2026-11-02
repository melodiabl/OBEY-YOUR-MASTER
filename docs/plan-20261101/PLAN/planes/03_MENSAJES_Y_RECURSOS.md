# 03 · Mensajes de Discord, componentes y recursos (NO destinados a la web)

**Alcance explícito:** este inventario es para experiencias del bot en Discord. La web usará React/Next.js y no requiere un pack de estos materiales.

## Biblioteca visual oficial

1. **A01–A12** = materiales aprobados: conservar exactamente el mismo archivo y hash. En esta entrega se copian desde el ZIP original sin regenerar.
2. **B01–B65** = propuestas, deben pasar revisión visual y semántica antes de publicación. Se incluyen PNG 128 solo para previsualizar, no autorizan uso runtime.
3. Recursos de eventos, banners, personaje y tarjetas existentes = mantener el catálogo actual y su procedencia; no sustituir por iconos neón inventados.
4. Emojis de aplicación publicados = resolver siempre con `handlers/assets/registry.js` + `assets/obey/registry.json.selected` mientras se planifica la migración del único registro. Nunca inventar IDs.

## Animación de estado

Reposo → pendiente → resultado confirmado / error / desconocido. No usar GIF en todas las acciones. A03 = actividad de reproducción, A11 = confirmación, otros A deben aplicarse según su rol. Reducir movimiento accesible y fallback PNG. GIF no demuestra progreso real.

## Components V2

Documentación: https://discordjs.guide/legacy/popular-topics/display-components y https://github.com/discord/discord-api-docs/blob/main/developers/components/overview.mdx

`IsComponentsV2` obliga a usar cuerpo compuesto: no combinar `content`/`embeds` tradicionales con V2 en el mismo mensaje. Prever límites de componentes/textos, validación de builders y degradación. Menciones con `allowedMentions` seguros. Botones con customId versionado, modal/permiso/auditoría, estados caducados.

## Diseño y legibilidad

Jerarquía: título claro, subtítulo descriptivo, un color semántico, separadores cuando hagan falta. Unicode legible (│ ━ ─ •) sin deformar letras ni confiar en glifos inconsistentes. Emoji Unicode como fallback y emoji custom solo si el registro lo confirma. Textos personalizados por guild bajo esquema validado, preview antes de publicar, límites y control de menciones.

## Inventario de pantallas

La galería `previsualizaciones/index.html` contiene cuatro estados de ejemplo para **los 32 módulos** (128 composiciones ilustrativas), además del catálogo A aprobado y los B propuestos. No son screenshots de la API; aprobar el estilo no certifica funcionalidad.

# GiveawayBot → OBEY

Categoría: Sorteos. Evidencia: documentación. Nivel: comparativa. Consulta: 22/10/2026.

## Comprobado y alcance

La página oficial documenta creación interactiva, inicio, finalización, borrado y reroll, incluido menú contextual sobre un sorteo terminado.

Fuente primaria: [GiveawayBot](https://giveawaybot.party/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Reutilizar la misma operación para slash y menú contextual; persistir elegibilidad y resultado.

Módulos de destino: giveaways. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Reroll debe excluir ganadores según política y dejar trazabilidad, sin prometer aleatoriedad auditada no implementada. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

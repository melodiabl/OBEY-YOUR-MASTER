# Pokétwo → OBEY

Categoría: Colecciones y mercado. Evidencia: código + documentación. Nivel: profunda-codigo. Consulta: 22/10/2026.

## Comprobado y alcance

La introducción describe captura, intercambio y batalla. Se revisaron trading.py y market.py: hay confirmación, estado de trades y comunicación de cancelaciones mediante Redis entre clusters.

Fuente primaria: [Pokétwo](https://docs.poketwo.net/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Intercambio consentido por ambas partes, caducidad, exclusión mutua y registro de cambios de saldo/propiedad.

Módulos de destino: collections,economy. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

La presencia de Redis no demuestra atomicidad o entrega única. No reutilizar personajes Pokémon ni su economía. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

# Rythm → OBEY

Categoría: Música y escucha social. Evidencia: documentación. Nivel: profunda-documental. Consulta: 22/10/2026.

## Comprobado y alcance

La guía distingue loop de pista y queueloop, documenta búsqueda, ajustes DJ y efectos. La introducción anuncia Smart Autoplay y descubrimiento personalizado.

Fuente primaria: [Rythm](https://docs.rythm.fm/commands/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Hacer visibles modos y preferencias; autoplay con señales explicables, historial y descarte de repeticiones.

Módulos de destino: music,profiles. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

No conocemos el algoritmo de Rythm. Su Activity, aplicación y bot son superficies distintas. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

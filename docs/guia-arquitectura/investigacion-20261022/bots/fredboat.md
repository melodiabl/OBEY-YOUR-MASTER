# FredBoat → OBEY

Categoría: Música. Evidencia: documentación parcial. Nivel: comparativa-limitada. Consulta: 22/10/2026.

## Comprobado y alcance

Los resultados oficiales listan modos repeat y shuffle y una guía de permisos. Parte del contenido no se extrajo al abrirlo.

Fuente primaria: [FredBoat](https://docs.fredboat.com/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Ayuda que explique qué cola cambia y qué permiso DJ exige cada operación.

Módulos de destino: music. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Los ejemplos indexados usan prefijos: no prueban la interfaz actual completa ni un algoritmo de recomendaciones. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

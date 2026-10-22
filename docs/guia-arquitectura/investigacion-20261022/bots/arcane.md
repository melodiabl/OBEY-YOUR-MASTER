# Arcane → OBEY

Categoría: Niveles y roles. Evidencia: documentación + imágenes. Nivel: profunda-documental-visual. Consulta: 22/10/2026.

## Comprobado y alcance

Documenta fuentes de XP, recompensas y rankings; se inspeccionaron tarjeta de rango y ajustes de recompensas. La guía de diagnóstico trata exclusiones, permisos y nivel máximo.

Fuente primaria: [Arcane](https://docs.arcane.bot/plugins/leveling/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Tarjeta con datos esenciales; asistente de diagnóstico y explicación del cálculo de XP.

Módulos de destino: levels,cards,roles. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

La imagen de recompensas es del dashboard, no del mensaje en Discord. No atribuir a OBEY cobertura de idiomas o XP ya funcional. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

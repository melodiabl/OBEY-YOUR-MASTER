# YAGPDB → OBEY

Categoría: Multipropósito y AutoMod. Evidencia: código + ilustraciones. Nivel: profunda-codigo-visual. Consulta: 22/10/2026.

## Comprobado y alcance

Se revisaron moderation/modlog.go y automod/effects.go. ModlogAction agrupa emoji, color y texto; CreateModlogEmbed arma autor, objetivo y motivo. Dos imágenes oficiales son ilustraciones del cliente.

Fuente primaria: [YAGPDB](https://yagpdb.xyz/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Catálogo semántico de mensajes de sanción, estados incompletos explícitos y fallos visibles de entrega.

Módulos de destino: moderation,automod,roles,feeds. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

No replicar literalmente colores, textos, desactivación automática de configuración o supuestos de su backend. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

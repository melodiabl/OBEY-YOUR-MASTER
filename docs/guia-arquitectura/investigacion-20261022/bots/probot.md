# ProBot → OBEY

Categoría: Bienvenida y niveles. Evidencia: documentación. Nivel: profunda-documental. Consulta: 22/10/2026.

## Comprobado y alcance

La guía explica envío de texto/imagen, avatar y posición de elementos. La documentación de niveles describe exclusiones y recompensas de roles.

Fuente primaria: [ProBot](https://docs.probot.io/docs/modules/welcome). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Editor de bienvenida con preview, prueba y publicación; diagnóstico de jerarquía de roles.

Módulos de destino: welcome,cards,levels. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Sus restricciones de imagen son de ProBot, no límites universales de Discord o de nuestro renderer. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

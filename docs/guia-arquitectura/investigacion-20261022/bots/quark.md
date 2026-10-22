# Quark → OBEY

Categoría: Logs. Evidencia: documentación + imágenes. Nivel: profunda-documental-visual. Consulta: 22/10/2026.

## Comprobado y alcance

La página presenta ejemplos de logs con autor, campos, canal y controles. Se inspeccionaron tres imágenes: entrada, rol concedido y mensaje editado. La guía de integraciones documenta atribución mostrada junto al bot ejecutor.

Fuente primaria: [Quark](https://docs.quark.bot/logs/examples). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Registro legible con cambios antes/después; separar ejecutor confirmado de atribución declarada.

Módulos de destino: logs,moderation. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

No tratar el ID incluido en un motivo escrito por otro bot como identidad autenticada. No copiar su botón de ban inmediato como default. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

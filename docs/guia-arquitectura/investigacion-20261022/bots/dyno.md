# Dyno → OBEY

Categoría: Moderación y logs. Evidencia: documentación parcial. Nivel: comparativa. Consulta: 22/10/2026.

## Comprobado y alcance

Action Log documenta seguimiento de eventos del servidor y destinos específicos que sustituyen al destino principal. La extracción completa de la página fue incompleta.

Fuente primaria: [Dyno](https://docs.dyno.gg/en/modules/actionlog). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Canal general con excepciones por categoría y vista de destino efectivo.

Módulos de destino: logs,moderation. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Sin revisión del motor interno ni captura actual de sus mensajes. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

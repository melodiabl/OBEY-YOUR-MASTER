# Server Maker → OBEY

Categoría: Construcción de servidores. Evidencia: sitio oficial + revisión previa. Nivel: comparativa. Consulta: 22/10/2026.

## Comprobado y alcance

El sitio presenta construcción con texto, remodelación, clonado y backups. Sus mensajes de portada son ejemplos renderizados; no prueban ejecución en Discord.

Fuente primaria: [Server Maker](https://servermaker.xyz/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Mantener /servidor con preview, diff, preflight y recibos; modificar solo el alcance revisado.

Módulos de destino: architect,templates,migrations. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

No prometer recuperar mensajes borrados ni rollback perfecto a partir de publicidad. Ver capítulo 20. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

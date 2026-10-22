# Carl-bot → OBEY

Categoría: Multipropósito y roles. Evidencia: documentación general. Nivel: comparativa. Consulta: 22/10/2026.

## Comprobado y alcance

La portada documenta bienvenida, reaction roles, sugerencias, moderación, AutoMod, logging y comandos personalizados. Las rutas profundas de logging consultadas no fueron accesibles.

Fuente primaria: [Carl-bot](https://docs.carl.gg/). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Organizar ajustes por tarea y paneles de roles con restricciones explícitas.

Módulos de destino: roles,moderation,suggestions. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Docs abiertas no demuestran que el código del bot completo sea abierto. No se inspeccionó aquí su runtime. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

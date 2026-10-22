# Red-DiscordBot → OBEY

Categoría: Modular y música. Evidencia: código público. Nivel: profunda-codigo. Consulta: 22/10/2026.

## Comprobado y alcance

Se revisaron el listener de Lavalink y los comandos de cola en un commit fijado: distingue inicio, fin de pista y fin de cola; procesa autoplay y muestra modos en la cola.

Fuente primaria: [Red-DiscordBot](https://github.com/Cog-Creators/Red-DiscordBot). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Una autoridad para transición y una proyección de estado compartida por slash y botones.

Módulos de destino: music,utilities. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Python y GPL-3.0: estudiar las reglas; no pegar archivos en OBEY sin resolver compatibilidad de licencia. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

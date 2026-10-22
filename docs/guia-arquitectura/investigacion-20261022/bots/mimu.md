# Mimu → OBEY

Categoría: Economía y mensajes. Evidencia: documentación. Nivel: comparativa. Consulta: 22/10/2026.

## Comprobado y alcance

La guía separa bienvenida, despedida y boost; incluye comandos para probarlos y diagnóstico de permisos. El índice distingue botones persistentes e instanciados.

Fuente primaria: [Mimu](https://docs.mimu.bot/settings/getting-started/greet-leave-boost-messages). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Templates con variables tipadas, prueba sin publicar y sesiones temporales con expiración.

Módulos de destino: welcome,economy,messages. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

No copiar decoraciones densas ni su moneda global. No se ejecutaron sus botones. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

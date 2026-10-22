# JMusicBot → OBEY

Categoría: Música. Evidencia: código público. Nivel: profunda-codigo. Consulta: 22/10/2026.

## Comprobado y alcance

AudioHandler.onTrackEnd reencola para repetición cuando el motivo es FINISHED y decide siguiente pista o playlist por defecto. Se revisó el archivo fijado, no una ejecución.

Fuente primaria: [JMusicBot](https://github.com/jagrosh/MusicBot). Para commits/archivos ver [código](../02_CODIGO_PUBLICO.md); para imágenes ver [referencias](../03_REFERENCIAS_VISUALES.md).

## Propuesta para OBEY

Tabla explícita de fin natural, skip, stop y error; repeat-track y repeat-queue distintos.

Módulos de destino: music. Conectar a sus servicios actuales antes de cambiar la presentación. El cambio debe conservar los datos y permisos del servidor. Implementar confirmación real, error recuperable, vacío y caducidad; no confirmar por haber editado un mensaje.

## Qué no queda demostrado

Java/Lavaplayer no es la arquitectura de lavalink-client. No importar sus condiciones sin adaptar el contrato. No se probaron flujos en una cuenta o servidor del proveedor. No se midieron popularidad, latencia ni disponibilidad.

## Cierre al implementar

Relacionar el requisito con una operación OBEY, su entrada Discord, traducción, material y caso de aceptación. Si se necesita una API ajena, comprobar contrato, permisos y licencia antes de activarla. Una página de documentación pública no concede acceso a datos internos del bot.

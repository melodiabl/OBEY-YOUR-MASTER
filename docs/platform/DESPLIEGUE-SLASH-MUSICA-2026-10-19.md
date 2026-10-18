# Despliegue · 19/10/2026

La imagen `release-slash-music-20261019-398e22f` contiene código `398e22f31b49139c5ae54d4ea4ec5de2398e7bd5` y dos cambios independientes:

- `/setup`, commit `4a0f080`: entrada global privada para administradores, sin argumentos, tareas habituales y navegación por temas en el mismo mensaje. [Recorrido](../guia-arquitectura/FACILIDAD_SETUP.md).
- Selección musical, commit `398e22f`: exclusión de Shorts identificados, prioridad de grabaciones y comprobación de identidad/duración al resolver o recuperar pistas. [Comportamiento y límites](../guia-arquitectura/SELECCION_MUSICAL.md).

El cambio de configuración del servidor y el comportamiento del reproductor tienen archivos, pruebas temporales y evidencias locales separados. Comparten este relevo del proceso para evitar dos reinicios.

[Evidencia de despliegue](evidence/slash-music-deployment-20261019.json): 11 hashes de archivos coinciden con el código validado; Gateway y heartbeat activos, MongoDB conectado y tres nodos públicos disponibles. Discord confirma por consulta de lectura 20 comandos globales, incluyendo `/setup` restringido a administradores/servidores y sin opciones. Bot, imágenes y Redis están saludables con cero reinicios. Salud HTTP local y HTTPS pública 200.

Principal público `gdjkhp`, respaldos `serenetia` y `millohost`; el nodo privado continúa apagado. Se conservaron entorno, montajes, volumen, límites del contenedor y configuración del dueño/publicidad. Los manifiestos privados y `latest` apuntan a la imagen validada.

El backup Mongo/configuración quedó en `/home/backups/obey-releases/2026-10-18T22-12-33-881Z/` (59.080.836 bytes de Mongo). Se conserva la imagen anterior `release-setup-ux-20261018-3673b47` y la receta privada de reversión en `.runtime/deploy-slash-music-20261019/rollback-arguments.json`. No hay migraciones de datos en estos dos cambios. La reversión está preparada, sin ejecutarla sobre el servicio sano.

La preparación detectó un error al invocar la receta antes de reemplazar el proceso; se corrigió y se repitió la comparación de configuración. HOME/HOSTNAME se generan al arrancar el contenedor; HOME se comprobó de nuevo después del arranque. Los scripts de verificación, el contexto de construcción y una imagen intermedia sin uso se retiraron. Se conservan únicamente los tres archivos con 25 tests originales.

No hubo push. Siguen pendientes el recorrido manual con el usuario, la escucha real con transición de canciones y los trabajos globales abiertos del ZIP. Las pruebas de metadatos no garantizan detectar todos los Shorts ni acreditar la propiedad de las subidas.

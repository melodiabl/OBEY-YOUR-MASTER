# Corrección de descarte y avisos · 19/10/2026

Desplegado código `ff94f31d91f187310e1776cd794556772fdcbc10` en `release-setup-errors-20261019-ff94f31`, imagen `813394a62fe3d2ada32d54a4e97813cb35eb8436d7e8f2a2dc03ff42f73790b2`. Se añade el botón de descarte que faltaba en idioma y se clasifican los fallos del recorrido común. [Alcance y reproducción](../guia-arquitectura/ERRORES_SETUP.md).

El error genérico que informó el usuario no está confirmado como resuelto. Falta ubicar servidor/canal y observar una reproducción real. Los 23 grupos locales acreditan descarte/regreso, controles privados y clasificación de errores; los nuevos registros de producción no contienen todavía un fallo del setup. Salud del proceso no equivale a validar ese caso del usuario.

[Evidencia operativa](evidence/setup-errors-deployment-20261019.json): 10 hashes coinciden entre código validado, imagen y contenedor; Gateway/heartbeat, MongoDB y 20 comandos globales registrados. Tres nodos públicos conectados, privado apagado. Bot, imágenes y Redis saludables, cero reinicios y salud local/pública 200. Únicamente estos tres servicios tienen política de reinicio `always`.

Se conservan entorno, montajes, límites, salud y configuración del dueño/publicidad, comparada de nuevo antes del relevo. Backup Mongo/configuración: `/home/backups/obey-releases/2026-10-18T22-36-52-747Z/`, archivo Mongo de 59.077.312 bytes. Reversión preparada a `release-slash-music-20261019-398e22f` mediante `.runtime/deploy-setup-errors-20261019/rollback-arguments.json`, sin ejecutarla sobre el servicio sano.

El verificador temporal, el contexto de construcción y los metadatos temporales de diagnóstico se retiraron. Se conservaron los tres archivos con 25 tests originales. No hay migración de datos, cambios de permisos ni push. Continuar con el caso del usuario cuando se identifique su contexto; no dar por terminado el plan global del ZIP.

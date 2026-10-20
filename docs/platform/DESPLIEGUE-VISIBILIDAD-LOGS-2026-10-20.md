# Visibilidad de registros desplegada · 20/10/2026

Código `0be39f31008519de4cda3c46e41d08c664a794c2`, etiqueta `release-log-visibility-20261020-0be39f3`, imagen `e806ccb03c04dd41e4741d315b73d56ecc3ee8cebfaedef4102de98b6020a635`.

La política anterior ocultaba registros legítimos cuando el acceso provenía de roles y @everyone no veía el canal. Ahora compara la audiencia completa del destino con la del origen, incluidas combinaciones de roles y excepciones personales. Los canales privados siguen protegidos; motivos de auditoría conservan su autorización staff separada. [Alcance y verificación](../guia-arquitectura/VISIBILIDAD_REGISTROS.md).

El usuario indicó «general 1». La lectura fresca del canal General confirma permisos compatibles con el destino. Dos capturas de solo lectura permitieron verificar cinco canales: tres compatibles y dos privados todavía restringidos. No se reprodujo el evento histórico ni se provocaron salidas o mensajes reales de prueba.

380 grupos locales, 350 perfiles diferentes y 16.800 asignaciones contrastadas con el SDK; 25 tests originales, tipos y dependencias pasan. [Evidencia local](evidence/log-visibility-local-20261020.json). Scripts temporales y capturas privadas retirados; no se añadieron tests permanentes.

[Evidencia operativa](evidence/log-visibility-deployment-20261020.json): 25 hashes coinciden en imagen y contenedor, Gateway/heartbeat y MongoDB conectados, 20 comandos globales, bot/imágenes/Redis saludables y cero reinicios. Salud local y HTTPS pública 200, sin fallos de captura ni avisos owner al arrancar. Solo se recreó el bot; entorno, configuración, montajes, límites y healthcheck conservados.

GDjkhp continúa seleccionado en configuración, pero no confirmó conexión y su `/v4/info` devuelve HTTP 403. Serenetia y MilloHost conectaron como respaldos; salud musical devuelve true. No se cambió prioridad ni se comprobó audio real. El nodo privado permanece apagado y excluido; solo bot/imágenes/Redis tienen reinicio always.

Backup `/home/backups/obey-releases/2026-10-20T02-19-16-993Z`, Mongo de 59217007 bytes. Imagen anterior `localhost/obey-your-master_bot:release-logs-quark-20261019-64ee040` y argumentos completos `.runtime/deploy-log-visibility-20261020/rollback-arguments.json` preservados. latest y ambos manifiestos privados de recuperación actualizados tras comprobar salud; reversión preparada sin ejecutarla.

Pendientes: comprobar la siguiente salida real de General en Discord; disponibilidad del proveedor principal y escucha musical; historial/retención, casos enlazables, explorador/exportación y entrega durable de registros. El error original de setup y los demás bloques del maestro siguen abiertos. Sin push.

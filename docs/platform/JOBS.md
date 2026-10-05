# Trabajos persistentes de Architect

`architect.snapshot` consulta canales/roles y conserva el resultado privado del administrador. `architect.backup` guarda puntos de restauración de estructura. `architect.apply` ejecuta ediciones confirmadas de nombres, temas de texto y colores existentes y creaciones básicas con IDs reales y permisos de roles/texto/voz existentes y cambios de categoría, limitado a guilds canary habilitadas. Web y `/config architect` comparten `client.jobs`, scope e historial; Discord solicita análisis/copias y la confirmación de ediciones se realiza en la web. Restauración, reordenamiento, permisos de categorías y módulos conservan sus pendientes.

## Persistencia y entrega

Mongo guarda versión, actor, guild, tipo, clave idempotente, correlación, fechas, estado, progreso, pasos, resultado y error seguro. El índice único `(guildId, actorId, idempotencyKey)` reclama solicitudes concurrentes sin transacciones. Confirmar la solicitud significa que está persistida, no que terminó.

El mismo documento es su outbox de entrega. Cada cinco segundos, el dispatcher examina hasta 50 registros queued/running y entrega su ID estable a BullMQ. Si Redis falla, conserva el backlog. Repara entregas ausentes y actualizaciones Mongo perdidas tras una entrega agotada. Los eventos de otros módulos todavía no usan un outbox compartido.

BullMQ 5.81.5 está fijado en el lock. La cola conserva hasta 1000 entregas completadas y 1000 fallidas; eliminarlas no elimina las claves Mongo. Retención/TTL Mongo queda pendiente. El productor desactiva la cola offline y limita tiempo/reintentos; el consumidor mantiene reconexión.

## Worker y recuperación

Estados implementados: queued, running, completed, failed y cancelled. Snapshot y backup tienen un paso real; las aplicaciones tienen copia previa y un paso por operación estructural o de permisos; el resultado cuenta recursos editados distintos. El contador cambia solo al persistir checkpoints. Un apply fallido/cancelado puede conservar pasos completados y un paso executing incierto; el error/guard explican la revisión pendiente. No se inventó un estado partially_failed para operaciones aún no implementadas.

Antes de leer o recuperar un checkpoint, el worker vuelve a consultar al miembro con `force: true` y exige ManageGuild. Un token por ejecución impide writes de un worker anterior. Una reentrega reutiliza el checkpoint guardado; un registro terminal no repite la lectura.

Errores transitorios permiten tres intentos BullMQ con backoff exponencial. Autorización denegada es terminal. Las entregas exhausted/stalled que BullMQ declara fallidas actualizan Mongo cuando el almacenamiento lo permite; el dispatcher repara una actualización perdida. Se exponen códigos y mensajes seguros.

Cancelar queued impide leer. Para running se guarda la petición, se comprueba antes del siguiente paso y se rechaza publicar el snapshot que termine después. La lectura ya iniciada puede terminar. Un worker recuperado completa una cancelación interrumpida sin leer nuevamente. Cancelar no deshace operaciones.

Shutdown impide nuevas entregas, espera el dispatcher y cierra el worker antes de desconectar Mongo. El timeout global del bot sigue en 20 segundos; tras terminación forzada puede existir reentrega stalled. La verificación cubre reinicio del runtime y checkpoints persistidos; no se mató ni inició el bot real.

Concurrencia dos, con lease adicional por guild y espera delayed sin consumir reintentos de fallo. Apply añade guard Mongo/journal de efectos, aborto duradero y tratamiento conservador de respuesta perdida. T24 sigue parcial: reconciliación positiva de creaciones implementada; revisión manual de jobs terminales, dependencias completas y aceptación canary pendientes; contratos en `RESTORE-POINTS.md` y `APPLICATIONS.md`.

## API y panel

Todas las rutas reutilizan sesión, permisos OAuth actualizados, autorización administrativa, CSRF y respuestas privadas. Guild y actor se toman del contexto autenticado; un registro ajeno devuelve 404.

- `GET /api/architect/:guildId/jobs`: disponibilidad y hasta 20 trabajos propios recientes, con resumen del resultado.
- `POST /api/architect/:guildId/jobs`: únicamente `{idempotencyKey}`; solicita `architect.snapshot` y devuelve 202 con la solicitud persistida.
- `GET /api/architect/:guildId/jobs/:jobId`: registro propio y snapshot completo cuando está completed.
- `POST /api/architect/:guildId/jobs/:jobId/cancel`: solicita cancelación del trabajo propio.

La web conserva la clave si falla la respuesta del POST. Muestra pasos, conteos y fecha de lectura; no reemplaza el borrador local. Consulta cada cinco segundos durante trabajo y cada veinte en reposo; pausa al ocultarse y resincroniza al volver. No muestra LIVE. Denegación retira datos y detiene consultas; respuestas antiguas no pueden restaurarlos. Sockets entre procesos y permisos OBEY granulares siguen pendientes.

## Configuración y pruebas

Workers desactivados por defecto. Requieren habilitación y URI explícitas en el entorno administrado y arrancan cuando Mongo y Gateway están listos:

```dotenv
OBEY_JOBS_ENABLED=true
OBEY_JOBS_REDIS_URL=redis://127.0.0.1:6380/0
```

La URI de ejemplo no es un fallback. Redis requiere persistencia/AOF y `noeviction`, conforme a la [guía oficial de producción](https://docs.bullmq.io/guide/going-to-production); conexiones remotas requieren la protección y credenciales del entorno. No se añadió un Redis automático al Compose de producción ni se inició el bot.

Tests: `node --test test/jobs.test.js test/jobs-api.test.js test/architect-command.test.js`. El script `scripts/verify-jobs-runtime.js` solo acepta URI explícitas loopback a `obey_jobs_test` y Redis DB 15. Nunca carga dotenv ni la configuración DB de la aplicación. Verifica Mongo/Redis/BullMQ reales con proveedor Discord aislado: idempotencia concurrente, scopes, pasos/resultados, reintentos, fencing, checkpoint, reinicio, entregas running ausentes y permisos. CI usa la imagen runtime y contenedores sin salida externa.

`scripts/verify-jobs-browser.js` reproduce la verificación de Chromium con Express/EJS, sesión/CSRF, Mongo y BullMQ reales; Discord es una fixture. Requiere las mismas URI de test y un driver Playwright disponible en el entorno de pruebas (resuelto por Node, opcionalmente mediante NODE_PATH). El driver no es dependencia del runtime ni se instala al arrancar el bot. La regresión retiene una respuesta autorizada y la entrega después de revocar permisos: el historial debe permanecer vacío. Evidencia en `evidence/jobs-browser.json` y capturas; incluye segunda pestaña, recarga, cancelación e indisponibilidad. Fixtures y contenedores eliminados tras verificar.

Redis dedicado configurado por petición del usuario (`REDIS.md`). Contratos de puntos de restauración y aplicación confirmada en `RESTORE-POINTS.md` y `APPLICATIONS.md`. T13/T14/T23/T24/T27/T28 siguen parciales: auditoría/eventos generales, outbox de otros cambios, configuración portable, templates/transcripts, scheduler, retención, aplicación completa y aceptación canary pendientes. Ver [ADR de cola](adr/001-jobs.md).

Verificación aislada: los scripts de jobs/aplicación/navegador comparten la colección/outbox de `obey_jobs_test` y usan nombres de cola distintos; ejecutarlos secuencialmente. No son independientes dentro de la misma DB. CI ya los secuencia. En una instalación compartida, todos los productores/workers del outbox deben usar la misma cola canónica y registry de tipos; una topología de colas por dominio queda pendiente.

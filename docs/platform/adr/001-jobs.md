# ADR 001: BullMQ y registro Mongo para Architect

Fecha: 2026-10-05. Estado: aceptada para el incremento de análisis de lectura.

Extensión posterior del mismo día: copias privadas de estructura y ediciones confirmadas compatibles en canary, con lease por guild, journal/checkpoints y guard Mongo que no caduca tras REST incierto. Redis dedicado configurado por petición expresa; ninguna guild canary habilitada. Límites y recuperación en `RESTORE-POINTS.md` y `APPLICATIONS.md`.

La auditoría encontró cron, timers, cola musical y discord-giveaways, pero ninguna cola durable general adecuada para Architect/backups/restores. El maestro exige BullMQ en ese caso. Se conserva Mongo, CommonJS, EJS y el monolito modular. El worker tiene un límite propio; no crea otro Client Discord ni otro servicio musical.

BullMQ 5.81.5 es la única nueva dependencia directa, con ioredis transitivo en el lock. Elegir la rama 5 limita este incremento frente al cambio de major 6. Las API/opciones se verificaron en el código instalado y con Redis 7 real. npm audit no encontró avisos para los paquetes principales del nuevo subárbol; no se declara resuelto el audit histórico.

Mongo es autoridad del registro, estado y resultado privado. El índice compuesto reclama la clave idempotente atómicamente. Registrar el envío dentro del mismo documento evita una transacción entre Mongo y Redis. Dispatcher repara backlog con IDs estables; procesador consulta el registro, conserva checkpoints y protege writes con tokens. BullMQ coordina entrega, reintentos y locks de su job. Un lease Redis adicional excluye trabajos Architect por guild, con renovación y liberación por token; la contención se difiere sin consumir reintentos de fallo.

Redis necesita persistencia/AOF y `noeviction`, según [producción](https://docs.bullmq.io/guide/going-to-production). Se diferencia el productor que falla pronto del consumidor que reconecta, siguiendo [conexiones](https://docs.bullmq.io/guide/connections). Los [IDs de job](https://docs.bullmq.io/guide/jobs/job-ids) son estables y no contienen dos puntos.

El cierre espera trabajo activo antes de cerrar conexiones, siguiendo [graceful shutdown](https://docs.bullmq.io/guide/workers/graceful-shutdown). Terminación forzada puede reentregar: no se promete exactamente una ejecución. La operación disponible solo lee; recuperar sin checkpoint no duplica recursos. Antes de apply se requieren T24/T27/T28: locks, checkpoints por paso, verificación de respuesta perdida, restore point y confirmación de revisión.

Workers habilitados expresamente mediante flag/URI después de dbReady y ClientReady, en cualquier orden. Sin configuración, el panel declara indisponibilidad. Tests/CI solo usan loopback y bases/colas de fixture. El usuario autorizó posteriormente configurar Redis: instancia dedicada preparada y verificada, sin iniciar ni desplegar el bot. Ver `REDIS.md`.

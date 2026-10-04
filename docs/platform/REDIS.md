# Redis dedicado de OBEY

Configurado el 2026-10-05 por petición explícita del usuario. `obey_redis` escucha exclusivamente en `127.0.0.1:6380`; el Redis existente en 6379 se conserva. Servicio independiente en `docker-compose.redis.yml`, volumen `obey_redis_data`, contraseña aleatoria de 256 bits, AOF con fsync cada segundo, `noeviction`, límite Redis 256 MB y contenedor 512 MB. Reinicio `unless-stopped`; `podman-restart.service` ya estaba habilitado en este host.

Credenciales en `.env.jobs` (0600) y `.runtime/redis/redis.conf` dentro de directorios 0700. Ambos están excluidos de Git y del contexto Docker. El archivo montado permite lectura al usuario sin privilegios de Redis. No imprimir, versionar ni copiar estos archivos a evidencias. El script conserva la contraseña al repetirse y no lee ni modifica `.env`.

Preparación y arranque del servicio Redis, separados del bot:

```sh
node scripts/configure-jobs-redis.js
podman-compose -p obey-infrastructure -f docker-compose.redis.yml up -d redis
node scripts/verify-managed-redis.js
```

`--restart-owned` verifica también persistencia mediante reinicio del contenedor dedicado, tras comprobar su etiqueta de propiedad. No usarlo durante trabajo activo. Evidencia sin secretos: `evidence/redis-managed.json`. Se comprobó autenticación, rechazo sin contraseña, AOF, política, reinicio y conexión real de BullMQ. El bot no se inició ni reinició, y no se conectó Mongo de producción.

Un futuro arranque local carga únicamente los dos parámetros de jobs de `.env.jobs`; variables explícitas del proceso tienen precedencia. Para un despliegue del bot en contenedor, el override `docker-compose.jobs.yml` añade este archivo a su entorno. El contenedor actualmente ejecutándose conserva su código y configuración anteriores; la configuración preparada no implica que ya consuma jobs. Desplegar el bot requiere la autorización del canary prevista en el maestro.

Redis y Mongo son servicios separados: Redis no sustituye la DB de registros/checkpoints. AOF cada segundo puede perder el último segundo ante una caída abrupta; los jobs de Mongo permiten reparar entregas. La configuración sigue las guías oficiales de [persistencia](https://redis.io/docs/latest/management/persistence/) y [seguridad](https://redis.io/docs/latest/operate/oss_and_stack/management/security/). No se ha añadido HA, replica, backup de Redis ni restore de producción.

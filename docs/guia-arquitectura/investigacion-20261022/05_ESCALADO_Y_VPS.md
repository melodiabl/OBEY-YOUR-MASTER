# Crecer sin reescribir el bot

## Qué es cada cosa

| Concepto | Explicación | Qué aporta a OBEY |
| --- | --- | --- |
| Servidor Discord o guild | Comunidad donde está instalado OBEY | Configuración, datos y permisos aislados por guildId |
| Shard | Conexión Gateway que recibe una parte de las guilds | Divide tráfico/eventos y cachés de Discord |
| Proceso | Instancia del programa con memoria propia | Aislar bot, web o trabajos; puede alojar shards según gestor |
| Cluster | Nombre operativo para un grupo coordinado de procesos/shards | No es una función adicional de Discord ni un requisito inicial |
| VPS | Máquina donde corren procesos y servicios | Más recursos o aislamiento, según mediciones |
| Nodo Lavalink | Servicio que carga/reproduce audio | Capacidad musical independiente del número de shards |

Discord documenta máximo de 2500 guilds por shard y recomienda consultar Get Gateway Bot para cantidad y límites de inicio. ShardingManager 14.27.0 puede crear un proceso o worker por shard en una máquina; no administra por sí solo todo un despliegue entre VPS. No confundir su worker con el worker de jobs del negocio. Fuentes: [Gateway](https://docs.discord.com/developers/events/gateway), [SDK fijado](https://discord.js.org/docs/packages/discord.js/14.27.0/ShardingManager:Class).

## Perfiles propuestos

| Perfil | Distribución | Cuándo pasar al siguiente |
| --- | --- | --- |
| S0 | Un VPS, bot/web actuales, worker y Lavalink con límites de recursos; datos con backup | Saturación medida, aislamiento necesario o número de guilds exige shards |
| S1 | Varios procesos/shards en un host; trabajos/imágenes aislados | Memoria/CPU/red del host o dominio de fallo insuficiente |
| S2 | Dos VPS de bot con shardLists disjuntas; datos/Redis accesibles por red privada; web/jobs según carga | Saturación demostrada o necesidad operativa de más capacidad |
| S3 | Más grupos y nodos de audio; control de despliegue central y redundancia de datos | Solo tras prueba de partición, recuperación y capacidad |

No se promete cantidad de servidores/oyentes por VPS sin CPU, RAM, región, bitrate, fuentes y mediciones. Un segundo VPS no hace disponible una base única que sigue en un host único.

## Propiedad y distribución

Calcular shard de guild con BigInt: (BigInt(guildId) >> 22n) % BigInt(totalShards). El mismo totalShards rige todo el despliegue; listas disjuntas y release/config comunes. Arranque coordinado con session_start_limit, remaining, reset_after y max_concurrency de Get Gateway Bot; no iniciar todos los procesos en bucle tras un error.

Propuesta: lease por propietario con caducidad y generación monotónica. Un lock en memoria no coordina VPS. Al perder lease, el proceso deja de aceptar mutaciones antes de renovar o transferir. Los repositorios rechazan generaciones antiguas y revisiones obsoletas. Fencing local no obliga a Discord a rechazar un REST ya enviado: antes de takeover conciliar efectos en curso y evitar doble escritor.

Web/API envía una intención tipada al dueño de guild/sesión; no usa broadcastEval con código del usuario. Jobs generales no reproducen audio. DM y eventos sin guild pueden llegar a shard 0: definir ruta y deduplicación de votos/pagos independientemente del shard. Pub/Sub informa cambios a vistas; no es cola durable ni fuente de verdad.

## Música distribuida

Una sesión propietaria por guild; estado con queueRevision, playbackInstanceId, generation, track, posición confirmada, pausa, modo, historial, favoritos y recomendación pendiente. lavalink-client documenta stores de cola personalizables; guardar cola en Redis no transfiere automáticamente Gateway/voz, listeners o autoridad de sesión.

Separar reconexión a la misma sesión Lavalink, recuperación después de reiniciar el cliente y fallo definitivo de nodo. Resumir requiere condiciones reales de sesión; otro nodo no contiene mágicamente el reproductor anterior. Recuperar desde checkpoint según contrato, con posible interrupción comunicada. Elegir nodo por salud, carga, región y capacidad de fuente, no solo menor ping.

## Procedimiento para conectar otro VPS

1. Aprovisionar versión exacta de Node, imagen/release inmutable, usuario de servicio y red privada/TLS. Secretos fuera del ZIP y logs.
2. Probar acceso autenticado a Mongo, Redis y Lavalink sin exponerlos públicamente. Comprobar backup restaurable y retención.
3. Preparar totalShards y asignaciones explícitas. Inicialmente se puede mover un worker de imágenes/jobs sin mover shards.
4. Poner el propietario anterior en drain: dejar de recibir operaciones nuevas, terminar o registrar trabajos y checkpoints pendientes.
5. Confirmar salida del dueño anterior; adquirir asignación/lease en el nuevo y arrancar respetando cuotas de Identify. Nunca lanzar una réplica completa sin asignación.
6. Comprobar Ready, rutas de voz, configuración de dos guilds, favoritos, una transición y trabajos sin duplicados.
7. Mantener rollback del binario y plan de datos compatible. Una migración destructiva de esquema no se revierte con la imagen anterior.

## Operación y objetivos propuestos

Medir ACK de interacción, demora de edición, cola de REST, 429, event-loop lag, RSS, Mongo/Redis, outbox, edad del job y frame deficits de Lavalink por nodo. ACK p95<1s y operación local p95<2s son objetivos iniciales internos sujetos a prueba, no garantías ni límites Discord. No incluir secretos, tokens de interacción o letras de canciones en etiquetas de métricas.

Discord exige respuesta inicial dentro de 3s y permite usar el token durante 15min. Aceptar/defer primero cuando corresponda; consultas/autocomplete y abrir modales tienen contratos diferentes. La cola de edición agrupa cambios de progreso y prioriza estado/controles sin bloquear audio. Respetar headers/buckets/Retry-After; varias IP con el mismo token no multiplican su límite global. No editar una barra cada segundo por cada guild.

Ver perfiles.propuestos.json: es contrato de configuración todavía no leído por el runtime. Pruebas de aceptación: proceso cae durante skip, pérdida Redis, Mongo indisponible, nodo de audio caído, lease vencido, dos clics simultáneos, retry de job y recuperación tras sesión no reanudable. Publicar resultados por escenario, no solo «online».


## Preparar revisión de intents al crecer

La documentación oficial consultada cambia el umbral de revisión de intents privilegiados a 10.000 usuarios únicos con acceso a la app entre las guilds, en lugar del umbral anterior por servidores, y documenta revisión anual. Verificar el estado/avisos del Developer Portal; distinguir verificación de la app y acceso a intents. No calcular elegibilidad solo contando guilds ni activar todos los intents por estar disponibles. Fuente: [guía de revisión](https://docs.discord.com/developers/gateway/getting-started-with-privileged-intent-review). Mantener justificación por capacidad y retención; la matriz de eventos no concede estos permisos.

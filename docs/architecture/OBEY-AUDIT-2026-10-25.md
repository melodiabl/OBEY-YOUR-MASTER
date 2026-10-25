# OBEY — auditoría y arquitectura modular (25-10-2026)

## Alcance y evidencia
Repositorio `melodiabl/OBEY-YOUR-MASTER`, rama `feature/obey-main-implementation` en el commit `c8ba6d3ee86515813e68a028e1221d093301e91b`. Inventario remoto de 2.650 archivos versionados: 957 assets, 589 commands, 143 slashCommands, 319 dashboard, 189 handlers, 43 database y 3 test. Los conteos no son evidencia de calidad. No se ejecutaron pruebas integradas ni conexión a Discord, MongoDB, Redis o Lavalink durante esta auditoría.

## Hallazgos verificados por lectura estática
1. `index.js` conserva una lista central de handlers e inicializa la mayoría sin coordinación explícita de dependencias, incluyendo el dashboard en el proceso del bot. Su cierre depende directamente de `client.shoukaku`.
2. `handlers/feature-registration.js` intercepta temporalmente `client.on` y `client.once` al inicializar módulos. El enfoque depende de registro sincrónico de listeners; debe migrarse a suscripciones explícitas.
3. `handlers/loaddb.js` usa `SyncMap`, con precarga de datos MongoDB y escrituras diferidas. No es seguro suponer coherencia entre procesos o shards con cachés independientes sin una estrategia de invalidación y persistencia.
4. `handlers/music/nodes-runtime.js`, `handlers/music/index.js`, el manifest musical y `package.json` siguen usando Shoukaku. `lavalink-client` es el destino decidido, pero todavía no está integrado.
5. `handlers/configuration-service.js` implementa borradores y publicación sólo para bienvenida. No debe interpretarse como editor universal de módulos.
6. `handlers/i18n/index.js` elimina región de locales y coexiste con el sistema `languages`.
7. `dashboard/index.js` contiene OAuth2, sesión, CSRF, API y Socket.IO en el proceso del bot; hay un contador visual de comandos codificado como 625.
8. `package.json` exige Node >=20 y Docker/CI usan Node 22. Hay que fijar una matriz única y auditar dependencias y uso real.
9. La rama inspeccionada conserva sólo tres archivos `test/*.test.js`; CI ejecuta `npm test`, assets y build de Docker.
10. `docker-compose.yml` usa `network_mode: host` y servicios acoplados. Antes de multi-host se necesita topología segura y conexiones privadas.

## Arquitectura objetivo
Monolito modular en un solo repositorio; separación de procesos únicamente por necesidades operativas.

```
src/
  core/                 # lifecycle, contracts, router, authorization
  modules/
    welcome/            # domain, service, repository, configuration, presentation
    music/
    tickets/
    moderation/
    architect/
  infrastructure/       # Mongo, Redis, Discord REST, Lavalink
  shared/               # UI, i18n, assets, validation
apps/
  bot/                  # gateway + shard management
  dashboard/            # OAuth + REST + Socket.IO
workers/                # BullMQ, image generation
```

Las carpetas anteriores son **objetivo**, no implementación completa. Migrar un caso de uso por vez, manteniendo adaptadores de compatibilidad.

### Principios operativos
- Cada módulo declara contrato, dependencias, permisos, operaciones, configuración, estado, i18n, recursos y ciclo de vida.
- Una sola autoridad de persistencia por dato. Escribir cambios críticos con control de concurrencia e idempotencia.
- Discord adapters no contienen reglas de negocio; el dashboard llama a los mismos casos de uso.
- Configuración por guild con revisión, borrador, preview y publicación. Ninguna configuración de usuario ejecuta JS arbitrario.
- La inicialización espera conexiones críticas; liveness y readiness se miden por separado.
- Logs estructurados, trace IDs, límites de rate, métricas y recuperación documentada.
- Tests unitarios por módulo, integración con Mongo/Redis y Discord de prueba, y end-to-end para flujos críticos.
- Guardar secretos sólo en entorno/secret manager; no en Git.

## Escalado gradual
Fase 1: una instancia bot, API/dashboard y workers existentes; DB y Redis, backups, health, CI.
Fase 2: dashboard fuera del gateway, cambios vía RPC autenticado y routing por shard.
Fase 3: múltiples shards y procesos sólo con datos/coordinación centralizados; image workers escalables; nodos Lavalink por región.
Fase 4: despliegue multi-host si las métricas lo requieren. No prometer capacidad de 100.000 servidores sin benchmarks y cuotas aprobadas de Discord.

## Audio
Introducir interfaz `MusicEngine` con `connect, search, play, pause, seek, stop, disconnect, getState`; construir adaptador Shoukaku y adaptador lavalink-client. Probar cola, autoplay, loop, shuffle, filtros, lyrics, volumen, recuperación, panel, doce controles y fallos de nodos. Cambiar motor con feature flag tras lograr paridad y rollback.

## Esta entrega
`src/core/module-runtime.js` crea una primitiva de ciclo de vida **opt-in**, con dependencias, orden de inicialización, rollback y cierre inverso. `test/module-runtime.test.js` verifica contratos básicos. No se conecta al `index.js` de producción y no sustituye el `feature-registry` actual. Esta rama no despliega cambios ni modifica audio activo.

## Criterios para merge a producción
Tests exitosos en CI, pruebas reales en servidor de Discord de staging, snapshots de Mongo, smoke tests de las funciones existentes, ningún cambio no previsto en audio, rollback probado y autorización expresa del operador.

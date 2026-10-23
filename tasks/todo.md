# Tareas y checkpoints de OBEY

Estado del checkpoint: T01 completa como auditoría estática; T02–T04 implementadas localmente, aceptación Discord pendiente; T19 parcial (Discord implementado; web pendiente). Consultar docs/platform/CHECKPOINT.md. Mantener todos los requisitos pendientes sin borrarlos.

## T01

- [x] Auditoría y matriz íntegra (fase 0).

**Aceptación cumplida:** 29 secciones/148 bloques íntegros conservados; entradas, inventarios de comandos y permisos, páginas/endpoints, infraestructura, persistencia, deps, deuda, clasificación y plan por dependencias.

**Verificación:** JSON parseado; IDs únicos y textos de requisitos idénticos al maestro; lectura completa de siete antecedentes; conteos mediante loaders sin REST/login; paths auditados y estado git. Evidencia: `docs/platform/AUDIT.md` y `docs/platform/requirements.json`.

**Dependencias:** Ninguna.

**Scope:** Pequeño de código; documentos/inventario generados grandes por alcance completo.

## T02

**Checkpoint:** Implementado local: registry, rutas seguras, hashes/mapas y validación real de 89 PNG; 8 pruebas en test/obey-assets.test.js. Paths reales en CHECKPOINT.

- [ ] Asset Registry y validación offline (fase 1).

**Descripción:** Claves semánticas/ruta/formato/ID real/fallback/uso; validar dimensiones/peso/path traversal y recursos usados; sin credenciales opera offline.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Claves semánticas/ruta/formato/ID real/fallback/uso; validar dimensiones/peso/path traversal y recursos usados; sin credenciales opera offline.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T01.

**Archivos previstos:** `handlers/assets/registry.js`, `scripts/assets-validate.js`, `test/asset-registry.test.js`.

**Scope:** Medio.

## T03

**Checkpoint:** Pipeline con dry-run sin red, aplicación explícita, reutilización/hash, checkpoint atómico, respuesta perdida y preservación de emojis ajenos. El 13 de octubre se cargaron 82 entradas; listados posteriores y el contenedor activo confirmaron resolución/reutilización de las 82 y conservación de 35 recursos anteriores. Mapa persistente y backup privado. Ver `docs/platform/RELEASE-2026-10-13.md`; los recorridos visuales Discord siguen pendientes.

- [ ] Sincronización idempotente de emojis (fase 1).

**Descripción:** Planificar create/update por nombre/hash sin duplicados; IDs solo reales; token entorno sin log y dry run por defecto; recuperación fallo parcial.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Planificar create/update por nombre/hash sin duplicados; IDs solo reales; token entorno sin log y dry run por defecto; recuperación fallo parcial.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T02.

**Archivos previstos:** `scripts/assets-sync.js`, `handlers/assets/sync.js`, `test/asset-sync.test.js`.

**Scope:** Medio.

## T04

**Checkpoint:** Builders activos y setup vacío comparten doce controles, etiquetas y estados. Tests y preview navegador pasan; canary Discord pendiente.

- [ ] Fallbacks en doce controles activos (fase 1).

**Descripción:** Mantener mp_shuffle/mp_prev/mp_toggle/mp_skip/mp_loop/mp_lyrics/mp_voldown/mp_stop/mp_volup/mp_queue/mp_like/mp_autoplay y estados; progreso nativo/portada intactos.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Mantener mp_shuffle/mp_prev/mp_toggle/mp_skip/mp_loop/mp_lyrics/mp_voldown/mp_stop/mp_volup/mp_queue/mp_like/mp_autoplay y estados; progreso nativo/portada intactos.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T02.

**Archivos previstos:** `handlers/music/embeds.js`, `handlers/music/index.js`, `handlers/music/liveupdate.js`, `test/player-ui.test.js`.

**Scope:** Medio.

### Checkpoint tras T04

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T05

**Checkpoint activo:** Registry y manifests de music/architect conectados en el proyecto principal; tres tests específicos pasan. Habilitación persistida/enforcement por guild y registro de los demás módulos pendientes; T05 sigue abierta.

- [ ] Manifest y registro incremental (fase 1).

**Descripción:** Manifest declara ID/version/defaults/permisos/commands/interactions/events/jobs/API/realtime/deps; habilitación guild y preservar loaders/aliases.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Manifest declara ID/version/defaults/permisos/commands/interactions/events/jobs/API/realtime/deps; habilitación guild y preservar loaders/aliases.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T01.

**Archivos previstos:** `handlers/feature-registry.js`, `handlers/feature-registration.js`, `handlers/command-registry.js`, `test/feature-registry.test.js`.

**Scope:** Medio.

## T06

- [ ] Permisos compartidos por acción (fase 1).

**Descripción:** RBAC OBEY admin/mod/security/support/music/community/analytics complementa Discord; authorize actor/guild/resource, jerarquía y revocación.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: RBAC OBEY admin/mod/security/support/music/community/analytics complementa Discord; authorize actor/guild/resource, jerarquía y revocación.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T05.

**Archivos previstos:** `handlers/permissions.js`, `dashboard/permissions.js`, `handlers/music/permissions.js`, `test/dashboard-permissions.test.js`.

**Scope:** Medio.

## T07

**Checkpoint activo:** Sesión/refresh HTTP compartidos, OAuth rotation/save y endpoints top/nowplaying protegidos y probados localmente. Revalidación sockets, timeouts y OAuth real pendientes.

- [ ] OAuth/API y exposición de datos (fase 1).

**Descripción:** Sesión rotada/refrescada, state/cookies/CSRF; revisar nowplaying/top públicos; mutaciones autenticadas validadas y permisos por guild/acción.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Sesión rotada/refrescada, state/cookies/CSRF; revisar nowplaying/top públicos; mutaciones autenticadas validadas y permisos por guild/acción.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T06.

**Archivos previstos:** `dashboard/index.js`, `dashboard/security.js`, `handlers/music/apiRoutes.js`, `test/dashboard-security.test.js`.

**Scope:** Medio.

## T08

- [ ] Router y estado de interacción (fase 1).

**Descripción:** Buttons/selects/modals/autocomplete; IDs versionados opacos/caducidad/actor/guild; mantener IDs legacy y acknowledge lento correcto.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Buttons/selects/modals/autocomplete; IDs versionados opacos/caducidad/actor/guild; mantener IDs legacy y acknowledge lento correcto.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T05, T06.

**Archivos previstos:** `handlers/interaction-router.js`, `events/guild/interactionCreate.js`, `handlers/music/index.js`, `test/interaction-router.test.js`.

**Scope:** Medio.

## T09

- [ ] Discord UI Kit y preview (fase 1).

**Descripción:** Builders success/error/warning/loading/empty/confirm/pagination/player/case/ticket/profile/help/settings; preview aproximada y validar componentes actuales.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Builders success/error/warning/loading/empty/confirm/pagination/player/case/ticket/profile/help/settings; preview aproximada y validar componentes actuales.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T04, T08.

**Archivos previstos:** `handlers/discord-ui.js`, `scripts/ui-preview.js`, `test/discord-ui.test.js`.

**Scope:** Medio.

## T10

- [ ] Tokens/primitivas web y accesibilidad (fase 1).

**Descripción:** Identidad web existente, una familia iconos, foco/labels/teclado/reduced motion; botones/inputs/select/modal/drawer/table/badge/tabs/skeleton/progress/empty/error.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Identidad web existente, una familia iconos, foco/labels/teclado/reduced motion; botones/inputs/select/modal/drawer/table/badge/tabs/skeleton/progress/empty/error.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T01.

**Archivos previstos:** `dashboard/public/css/internal-theme.css`, `dashboard/views/includes/header.ejs`, `dashboard/public/js/main.js`, `test/web-ui.test.js`.

**Scope:** Medio.

## T11

- [ ] Help y setup desde registros (fase 1).

**Descripción:** Categorías/contexto/acciones, config wizard tipo/modules/canales/roles/preview; seleccionado no equivale configurado; count/schema commands y context menus útiles.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Categorías/contexto/acciones, config wizard tipo/modules/canales/roles/preview; seleccionado no equivale configurado; count/schema commands y context menus útiles.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T05, T08, T09.

**Archivos previstos:** `handlers/helpui.js`, `handlers/music/setup.js`, `slashCommands/Info/help.js`, `test/setup-panel.test.js`.

**Scope:** Medio.

### Checkpoint tras T11

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T12

**Checkpoint activo:** Lectura compatible y guardado de bienvenida compartidos; dashboard elimina write directo a Guild. Dos guilds y fallos DB probados. Revisions/migración global/atomicidad/recuperación cache y writers legacy pendientes.

- [ ] Configuración canónica y precedencia (fase 2).

**Descripción:** Fuente única con await/errores, defaults compatibles y revisions; ambos clientes usan mismo servicio; compatibilidad welcome.message/msg documentada.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Fuente única con await/errores, defaults compatibles y revisions; ambos clientes usan mismo servicio; compatibilidad welcome.message/msg documentada.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T05, T06.

**Archivos previstos:** `handlers/config-service.js`, `handlers/loaddb.js`, `handlers/sync-map.js`, `dashboard/index.js`, `test/config-service.test.js`.

**Scope:** Medio.

## T13

- [ ] Envelope/contratos y auditoría (fase 2).

**Descripción:** id/type/version/guild/actor/timestamp/correlation/source/payload validado; audit before/after y proyecciones por permiso; expected errors separados.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: id/type/version/guild/actor/timestamp/correlation/source/payload validado; audit before/after y proyecciones por permiso; expected errors separados.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T12.

**Archivos previstos:** `handlers/domain-events.js`, `handlers/audit-service.js`, `database/schemas/AuditSchema.js`, `test/domain-events.test.js`.

**Scope:** Medio.

## T14

**Checkpoint de jobs:** Solicitud y outbox de entrega en un mismo documento Mongo; dispatcher repara queued/running con jobId estable y consumidor deduplica/checkpoint. Outbox general de otros módulos pendiente; tarea parcial. Ver docs/platform/JOBS.md.

- [ ] Outbox y consumidores idempotentes (fase 2).

**Descripción:** No perder evento crítico tras guardar; no asumir transacciones Mongo deployment; consumidor deduplica/reintenta seguro y mantiene backlog tras reinicio.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: No perder evento crítico tras guardar; no asumir transacciones Mongo deployment; consumidor deduplica/reintenta seguro y mantiene backlog tras reinicio.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T13.

**Archivos previstos:** `database/schemas/OutboxSchema.js`, `handlers/outbox.js`, `test/outbox.test.js`.

**Scope:** Medio.

## T15

**Checkpoint activo:** Música revalida la sesión almacenada por envío; permisos Discord TTL 15 s y timeout 5 s; rooms por guild/módulo; logout local revoca todas las pestañas; snapshots actuales al reconectar. 7 tests, incluida integración Socket.IO real. Realtime de otros módulos, propagación multi-proceso y revocación en idle pendientes. T15 sigue abierta.

- [ ] Socket autorizado y reconexión (fase 2).

**Descripción:** HTTP inicial; user/guild/module rooms autorizadas/revocables; revision descarta antiguo y snapshot+subscribe evita ventana; dos pestañas y desconexión real.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: HTTP inicial; user/guild/module rooms autorizadas/revocables; revision descarta antiguo y snapshot+subscribe evita ventana; dos pestañas y desconexión real.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T06, T13.

**Archivos previstos:** `dashboard/index.js`, `dashboard/public/js/dashboard-session.js`, `dashboard/views/pages/music.ejs`, `test/realtime.test.js`.

**Scope:** Medio.

## T16

- [ ] Selector, navegación y explorer (fase 2).

**Descripción:** Tres estados guild; dominios Overview/Server/Management/Community/Entertainment/Automation/Analytics/System; guild switch/search/connection y árbol real sin cifras simuladas.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Tres estados guild; dominios Overview/Server/Management/Community/Entertainment/Automation/Analytics/System; guild switch/search/connection y árbol real sin cifras simuladas.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T10, T15.

**Archivos previstos:** `dashboard/views/pages/dashboard.ejs`, `dashboard/views/pages/guild.ejs`, `dashboard/index.js`, `test/guild-selector.test.js`.

**Scope:** Medio.

## T17

- [ ] Command Center y settings globales (fase 2).

**Descripción:** Buscar comandos, enabled/restricciones módulo/user/role/channel; settings idioma/timezone/retención/integraciones sin duplicar módulos.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Buscar comandos, enabled/restricciones módulo/user/role/channel; settings idioma/timezone/retención/integraciones sin duplicar módulos.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T05, T12, T16.

**Archivos previstos:** `dashboard/views/pages/commands.ejs`, `dashboard/index.js`, `handlers/command-registry.js`, `test/command-center.test.js`.

**Scope:** Medio.

### Checkpoint tras T17

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T18

- [ ] Welcome/farewell compartidos (fase 3).

**Descripción:** Evento/preview composición única, templates/personaje por guild y config antigua; Unicode/avatar/fondo fallido/envío sin tarjeta; contador leave actual.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Evento/preview composición única, templates/personaje por guild y config antigua; Unicode/avatar/fondo fallido/envío sin tarjeta; contador leave actual.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T02, T12, T15.

**Archivos previstos:** `handlers/welcome.js`, `handlers/leave.js`, `handlers/canvasUtils.js`, `dashboard/index.js`, `test/welcome-renderer.test.js`.

**Scope:** Medio.

## T19

**Checkpoint:** Discord: texto completo paginado, owner/guild/message/TTL, proveedor compartido y guards tardíos, 27 regresiones. Web implementada localmente: endpoint autorizado, proveedor/cache compartido, panel Letras paginado/sincronizado, guards por sesión/playback, pausa/seek/reconexión y evidencia Chromium. Pendiente prueba canary.

- [ ] Letras completas y estado compartido (fase 3).

**Descripción:** Todas páginas prev/next/current/total/caducidad/permisos; eliminar truncado fallback; seeks/pause/track guards, live/missing/provider caído y web mismo modo.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Todas páginas prev/next/current/total/caducidad/permisos; eliminar truncado fallback; seeks/pause/track guards, live/missing/provider caído y web mismo modo.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T09, T15.

**Archivos previstos:** `slashCommands/Music/lyrics.js`, `handlers/music/lyrics.js`, `handlers/music/lyricsLive.js`, `handlers/music/index.js`, `test/lyrics-pagination.test.js`.

**Scope:** Medio.

## T20

- [ ] Música metadata y límites de proveedores (fase 3).

**Descripción:** Separar metadata/search/playback/lyrics alrededor adapters actuales; preservar picker/playlists/álbumes/filtros/autoplay/24-7/serialización/guards; no prometer Spotify audio nativo.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Separar metadata/search/playback/lyrics alrededor adapters actuales; preservar picker/playlists/álbumes/filtros/autoplay/24-7/serialización/guards; no prometer Spotify audio nativo.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T04, T15.

**Archivos previstos:** `handlers/music/index.js`, `handlers/musiccatalog.js`, `handlers/music/lyrics.js`, `test/music-architecture.test.js`.

**Scope:** Medio.

## T21

- [ ] Historia, colecciones y estadísticas musicales (fase 3).

**Descripción:** Historial/recent/favoritos/private/shared collections/saved queues/session stats reales con alcance ownership explícito y persistencia compatible.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Historial/recent/favoritos/private/shared collections/saved queues/session stats reales con alcance ownership explícito y persistencia compatible.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T20.

**Archivos previstos:** `handlers/music/database.js`, `handlers/music/playlist-repository.js`, `dashboard/views/pages/library.ejs`, `test/saved-queues.test.js`.

**Scope:** Medio.

## T22

- [ ] Gestión avanzada de cola (fase 3).

**Descripción:** Mover/mass remove/sort y sesiones guild/voice/session; permisos mismos clientes, cola única, serializar y propagar web↔Discord.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Mover/mass remove/sort y sesiones guild/voice/session; permisos mismos clientes, cola única, serializar y propagar web↔Discord.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T20, T15.

**Archivos previstos:** `handlers/music/index.js`, `dashboard/index.js`, `dashboard/views/pages/music.ejs`, `test/music-queue-actions.test.js`.

**Scope:** Medio.

### Checkpoint tras T22

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T23

**Checkpoint activo:** BullMQ 5.81.5, registro Mongo privado/idempotente, estados/pasos/resultados reales, worker `architect.snapshot`, reintentos, cancelación y cierre; web y `/config architect accion:analizar` conectados. Mongo/Redis aislados verifican reinicio/entrega/checkpoint/fencing. Otros trabajos, scheduler, retención y canary pendientes; tarea parcial. Ver docs/platform/adr/001-jobs.md.

- [ ] Cola durable y lifecycle worker (fase 4).

**Descripción:** BullMQ si no hay alternativa tras ADR; actor/guild/type/status/progress/steps/result/error/correlation; estados reales y shutdown/checkpoint.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: BullMQ si no hay alternativa tras ADR; actor/guild/type/status/progress/steps/result/error/correlation; estados reales y shutdown/checkpoint.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T14.

**Archivos previstos:** `handlers/jobs/index.js`, `workers/index.js`, `database/schemas/JobSchema.js`, `test/jobs.test.js`.

**Scope:** Medio.

## T24

**Checkpoint activo:** Snapshot/checkpoint y tokens evitan repetir lecturas guardadas o aceptar writes antiguos; reanudación de cancelación y entregas ausentes verificada. Leases por guild, guard/journal Mongo y checkpoints de ediciones compatibles implementados; creaciones básicas con mapas de IDs reales y reconciliación positiva implementadas; revisión manual de jobs terminales, dependencias completas y aceptación canary pendientes; tarea parcial.

- [ ] Reanudación y exclusión estructural (fase 4).

**Descripción:** Lock/concurrency guild; rate limits/retries acotados; verificar recurso antes retry respuesta perdida; cancel evita futuros pasos sin fingir rollback.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Lock/concurrency guild; rate limits/retries acotados; verificar recurso antes retry respuesta perdida; cancel evita futuros pasos sin fingir rollback.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T23.

**Archivos previstos:** `handlers/jobs/guild-executor.js`, `workers/index.js`, `test/jobs-recovery.test.js`.

**Scope:** Medio.

### Checkpoint tras T24

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T25

**Checkpoint activo:** Snapshot fresco con alcance structure_only y blueprint versionado/IDs lógicos; borradores privados persistidos con revisión CAS. Plan/journal de edición compatible incorporados; portabilidad/configuración completas y ejecución de otros efectos pendientes. Tarea todavía parcial; ver docs/platform/ARCHITECT.md.

- [ ] Snapshot y blueprint versionados (fase 4).

**Descripción:** Captura recursos Discord reales/config OBEY; logical IDs→real maps; validation y presets gaming/community/anime/music/creative/dev/study/roleplay/support/custom.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Captura recursos Discord reales/config OBEY; logical IDs→real maps; validation y presets gaming/community/anime/music/creative/dev/study/roleplay/support/custom.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T12, T24.

**Archivos previstos:** `handlers/architect/snapshot.js`, `handlers/architect/blueprint.js`, `database/schemas/BlueprintSchema.js`, `test/architect-blueprint.test.js`.

**Scope:** Medio.

## T26

**Checkpoint activo:** Diff create/update/move/overwrites con antes/después y drift de origen. Preflight verifica miembros frescos, permisos, jerarquía y grants; ejecución básica comprueba acceso efectivo, límites y bitrate y ordena dependencias roles/categorías/canales. Forecast de acceso resultante por cada paso, permisos de roles/texto/voz y grants incluidos (también retirada de denies). Cascada explícita de una categoría y sus hijos sincronizados implementada; límites/capacidades/cascadas múltiples/plan de ejecución completos pendientes. Tarea todavía parcial; ver docs/platform/ARCHITECT.md.

- [ ] Diff y preflight (fase 4).

**Descripción:** create/update/move/delete/overwrites/module config before/after; deps roles/category/channel/permissions/modules; jerarquía/capabilities/access bot/admin; protegido y sin delete default.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: create/update/move/delete/overwrites/module config before/after; deps roles/category/channel/permissions/modules; jerarquía/capabilities/access bot/admin; protegido y sin delete default.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T25.

**Archivos previstos:** `handlers/architect/diff.js`, `handlers/architect/preflight.js`, `test/architect-diff.test.js`.

**Scope:** Medio.

## T27

**Checkpoint activo:** Puntos privados/inmutables structure_only, metadata/completitud/advertencias, hash de integridad, job backup y copia previa a edición, inspección web y solicitud Discord. Recuperación tras persistir sin checkpoint verificada con Mongo/Redis reales. Configuración portable/import/export/remapeo/scheduler/retención/restore pendientes; tarea parcial. Ver docs/platform/RESTORE-POINTS.md.

- [ ] Backups e importación segura (fase 4).

**Descripción:** Manual/scheduled/pre-destructive; schema/fecha/creador/alcance/completitud/warnings/retención; import validado, privado, sin tokens/sesiones.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Manual/scheduled/pre-destructive; schema/fecha/creador/alcance/completitud/warnings/retención; import validado, privado, sin tokens/sesiones.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T25.

**Archivos previstos:** `handlers/backups/service.js`, `database/schemas/BackupSchema.js`, `handlers/autobackup.js`, `test/backups.test.js`.

**Scope:** Medio.

## T28

**Checkpoint activo:** Plan privado versionado de 15 minutos, token/revisión/actor/guild, confirmación idempotente, drift/preflight fresco, copia previa, journal/CAS y guard duradero. Aplica nombres/temas de texto/colores existentes solo en canary habilitado; probado con Discord fixture y Mongo/Redis reales. Creaciones básicas con IDs reales y reconciliación positiva implementadas. Permisos existentes de roles/texto/voz con forecast de acceso por paso e inspector añadidos. Cambios de categoría de texto/voz conservando permisos y con capacidad por paso añadidos. Orden por lotes de canales/roles existentes con protección y jerarquía añadidos. Permisos de una categoría con cascada explícita añadidos. Planes mixtos/cascadas múltiples/configuración y recuperación/revisión manual completos pendientes. Ningún canary real habilitado; tarea parcial. Ver docs/platform/APPLICATIONS.md.

- [ ] Apply Architect con confirmación de revisión (fase 4).

**Descripción:** Snapshot drift recalcula diff; restore point/confirm tied revision; apply idempotente/map IDs/module wiring, partial failure y retry pendientes separado.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Snapshot drift recalcula diff; restore point/confirm tied revision; apply idempotente/map IDs/module wiring, partial failure y retry pendientes separado.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T26, T27.

**Archivos previstos:** `handlers/architect/apply.js`, `workers/index.js`, `test/architect-apply.test.js`.

**Scope:** Medio.

## T29

- [ ] Rollback limitado y restore con remapeo (fase 4).

**Descripción:** Inversas/snapshot y conflictos cambios posteriores; restore job confirmado/remap modules; límites IDs/historial/enlaces claramente reportados.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Inversas/snapshot y conflictos cambios posteriores; restore job confirmado/remap modules; límites IDs/historial/enlaces claramente reportados.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T28.

**Archivos previstos:** `handlers/architect/rollback.js`, `handlers/backups/restore.js`, `test/architect-rollback.test.js`.

**Scope:** Medio.

### Checkpoint tras T29

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T30

**Checkpoint activo:** Editor web conectado: árbol/inspector, crear y mover, nombres/colores, undo/redo, protección, preview y guardar/recuperar borrador. Discord consulta la misma propuesta. Preparación/confirmación web y progreso durable de edición compatible añadidos. Inspector de permisos de roles/texto/voz y revisión legible con acceso por paso añadidos. Cambios de categoría y orden de canales/roles existentes con confirmación/copia previa, controles y protección añadidos. Permisos de una categoría con cascada revisada añadidos. Asistente de estructura con diez bases, siete temas para recursos nuevos, tamaño/idioma/decoración, diff, undo y borrador privado añadido. Conexión de módulos, wizard integral, permisos de miembros/cascadas múltiples, eventos y aplicación completa pendientes. Tarea todavía parcial; ver docs/platform/ARCHITECT.md.

- [ ] Editor Architect visual conectado (fase 4).

**Descripción:** Wizard/árbol/abstract preview/inspector/selection/order/moves/perms/undo redo/pending diff; alternativa accesible DnD y mobile review/progreso; Discord misma propuesta/job.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Wizard/árbol/abstract preview/inspector/selection/order/moves/perms/undo redo/pending diff; alternativa accesible DnD y mobile review/progreso; Discord misma propuesta/job.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T10, T15, T26, T28.

**Archivos previstos:** `dashboard/views/pages/architect.ejs`, `dashboard/public/js/architect.js`, `dashboard/index.js`, `slashCommands/Admin/architect.js`, `test/architect-api.test.js`.

**Scope:** Medio.

## T31

**Checkpoint activo:** Decoration Studio dentro de Architect: siete temas compartidos, alcance recurso/categoría y canales/roles/servidor, antes/después, densidad, límites de nombres, protecciones y colores simples conocidos. Preview, undo, borrador privado y motor confirmado existentes; navegador verifica nombre/color aplicados con copia previa sin cambiar permisos. Entrada Discord/acceso directo y aceptación real pendientes; tarea parcial. Ver docs/platform/ARCHITECT.md.

- [ ] Theme Engine y Decoration Studio (fase 4).

**Descripción:** Midnight/Minimal/Sakura/Nebula/Gaming/Luxury/OBEY; antes/después channel/category/roles/server; emoji none/low, naming válido/guild capabilities; sin alterar permisos/eliminar.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Midnight/Minimal/Sakura/Nebula/Gaming/Luxury/OBEY; antes/después channel/category/roles/server; emoji none/low, naming válido/guild capabilities; sin alterar permisos/eliminar.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T26, T30.

**Archivos previstos:** `handlers/decoration/themes.js`, `dashboard/views/pages/decoration.ejs`, `dashboard/index.js`, `slashCommands/Admin/decorate.js`, `test/decoration.test.js`.

**Scope:** Medio.

## T32

- [ ] Editores roles/canales y permisos efectivos (fase 4).

**Descripción:** Editar individual sin Architect; inherited/allow/deny/category sync/Administrator/multirol; servicio/diff común con preflight y eventos reales.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Editar individual sin Architect; inherited/allow/deny/category sync/Administrator/multirol; servicio/diff común con preflight y eventos reales.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T26, T16.

**Archivos previstos:** `handlers/server-resources.js`, `dashboard/views/pages/channels.ejs`, `dashboard/views/pages/roles.ejs`, `dashboard/index.js`, `test/effective-permissions.test.js`.

**Scope:** Medio.

### Checkpoint tras T32

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T33

- [ ] Architect IA estructurado (fase 5).

**Descripción:** Proveedor server configurable; inputs Discord tratados como datos; genera/refina blueprint validado nunca REST directo; sin key indica no configurado y visual/templates siguen.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Proveedor server configurable; inputs Discord tratados como datos; genera/refina blueprint validado nunca REST directo; sin key indica no configurado y visual/templates siguen.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T25, T30.

**Archivos previstos:** `handlers/architect/ai.js`, `dashboard/views/pages/architect.ejs`, `slashCommands/Admin/architect.js`, `test/architect-ai.test.js`.

**Scope:** Medio.

## T34

**Checkpoint activo:** Biblioteca dentro de Architect: diez bases oficiales/privadas, propiedad Mongo, formato OBEY v1 con referencias lógicas y permisos de roles íntegros, capture/export/import/preview entre guilds/reutilización sin duplicados y creación básica confirmada por motor existente. API/CSRF/owner scopes, DB real y Chromium verifican privacidad, persistencia, import/export, otra guild, copia/checkpoints/IDs y móvil. Módulos portables, permisos completos de creación, formatos nativos, favoritos/paginación/versiones/comunidad y aceptación real pendientes; tarea parcial. Ver docs/platform/TEMPLATES.md.

- [ ] Templates oficiales/privadas e instalación (fase 5).

**Descripción:** Formato versionado/logical refs/theme/modules portable; preview/install Architect idempotente con permisos; ownership/visibilidad; import/export OBEY vs capacidades nativas verificadas.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Formato versionado/logical refs/theme/modules portable; preview/install Architect idempotente con permisos; ownership/visibilidad; import/export OBEY vs capacidades nativas verificadas.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T28, T31.

**Archivos previstos:** `handlers/templates/service.js`, `database/schemas/TemplateSchema.js`, `dashboard/views/pages/templates.ejs`, `dashboard/index.js`, `test/templates.test.js`.

**Scope:** Medio.

### Checkpoint tras T34

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T35

- [ ] Servicio moderación y casos (fase 6).

**Descripción:** Warn/timeout/kick/ban/unban/softban/purge/lock/slowmode; caso actor/target/reason/duration/evidence/state/source/dates; razón/revoke donde permitido y mismo caso web/Discord.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Warn/timeout/kick/ban/unban/softban/purge/lock/slowmode; caso actor/target/reason/duration/evidence/state/source/dates; razón/revoke donde permitido y mismo caso web/Discord.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T06, T13, T15.

**Archivos previstos:** `handlers/moderation/service.js`, `database/schemas/ModerationSchema.js`, `slashCommands/Moderation/ban.js`, `dashboard/index.js`, `test/moderation-service.test.js`.

**Scope:** Medio.

## T36

- [ ] AutoMod nativo/bot y presets (fase 6).

**Descripción:** Spam/flood/caps/mentions/invites/links/words/attachments/external filters reales; presets/excepciones/thresholds y APIs capacidades actuales.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Spam/flood/caps/mentions/invites/links/words/attachments/external filters reales; presets/excepciones/thresholds y APIs capacidades actuales.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T35.

**Archivos previstos:** `handlers/automod/service.js`, `handlers/antispam.js`, `dashboard/views/pages/automod.ejs`, `test/automod.test.js`.

**Scope:** Medio.

## T37

- [ ] Security y Verification reales (fase 6).

**Descripción:** Raid/nuke/quarantine/gate/lockdown con ventanas/umbrales/excepciones/acotadas correlation jobs; verification pending/verified/failed/reset/jerarquía; incidents/recommendations, score explicable.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Raid/nuke/quarantine/gate/lockdown con ventanas/umbrales/excepciones/acotadas correlation jobs; verification pending/verified/failed/reset/jerarquía; incidents/recommendations, score explicable.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T35, T24.

**Archivos previstos:** `handlers/security/service.js`, `handlers/validcode.js`, `handlers/anti_nuke.js`, `dashboard/views/pages/security.ejs`, `test/security.test.js`.

**Scope:** Medio.

## T38

**Checkpoint 19/10:** consumidor y configuración compartida de registros, privacidad y avisos owner implementados; 111 grupos temporales y 25 originales pasan. [Alcance y límites](../docs/guia-arquitectura/REGISTROS_Y_AVISOS_OWNER.md). Retención, historial consultable y recuperación durable siguen pendientes; T38 permanece abierta.

- [ ] Logging y retención (fase 6).

**Descripción:** Members/messages/mod/voice/roles/channels/webhooks/invites con datos/intents válidos; permisos/retención explícita y no almacenamiento indiscriminado.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Members/messages/mod/voice/roles/channels/webhooks/invites con datos/intents válidos; permisos/retención explícita y no almacenamiento indiscriminado.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T13, T15.

**Archivos previstos:** `handlers/logger.js`, `database/schemas/AuditSchema.js`, `dashboard/views/pages/logs.ejs`, `test/logging.test.js`.

**Scope:** Medio.

## T39

- [ ] Roles automáticos/sticky/temporales/menus (fase 6).

**Descripción:** Assigned roles whitelist sin peligrosos/jerarquía; autorole/sticky/button/select y temporal durable tras restart; canal/rol preflight.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Assigned roles whitelist sin peligrosos/jerarquía; autorole/sticky/button/select y temporal durable tras restart; canal/rol preflight.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T24, T32.

**Archivos previstos:** `handlers/roles/service.js`, `handlers/reactionrole.js`, `dashboard/views/pages/roles.ejs`, `test/roles.test.js`.

**Scope:** Medio.

### Checkpoint tras T39

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T40

- [ ] Tickets persistidos y operación staff (fase 6).

**Descripción:** Panel/category/modal/open/claim/transfer/close/reopen con ticket único/message IDs, permisos y errores; asignación concurrente y dedupe.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Panel/category/modal/open/claim/transfer/close/reopen con ticket único/message IDs, permisos y errores; asignación concurrente y dedupe.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T13, T24.

**Archivos previstos:** `handlers/ticket-service.js`, `handlers/ticket.js`, `handlers/ticketevent.js`, `database/schemas/TicketSchema.js`, `test/tickets.test.js`.

**Scope:** Medio.

## T41

- [ ] Ticket inbox web y transcripts (fase 6).

**Descripción:** Inbox/conversation/details bidireccional; mensajes web→Discord/Discord→web; transcript private/adjuntos/retención, rating/event métricas primera respuesta/resolución excluyen bots.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Inbox/conversation/details bidireccional; mensajes web→Discord/Discord→web; transcript private/adjuntos/retención, rating/event métricas primera respuesta/resolución excluyen bots.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T40, T15.

**Archivos previstos:** `dashboard/views/pages/tickets.ejs`, `dashboard/index.js`, `handlers/ticket-service.js`, `handlers/jobs/transcript.js`, `test/ticket-realtime.test.js`.

**Scope:** Medio.

### Checkpoint tras T41

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T42

- [ ] Soporte avanzado (fase 7).

**Descripción:** Saved replies/internal notes separadas de público/knowledge base con permisos; nunca enviar nota interna al usuario.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Saved replies/internal notes separadas de público/knowledge base con permisos; nunca enviar nota interna al usuario.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T41.

**Archivos previstos:** `handlers/ticket-service.js`, `dashboard/views/pages/tickets.ejs`, `database/schemas/TicketSchema.js`, `test/ticket-notes.test.js`.

**Scope:** Medio.

## T43

- [ ] Templates comunidad y valoraciones (fase 7).

**Descripción:** Search/category/saved/favorites/version/publication/visibility/moderation; ratings/install stats solo acciones registradas, biblioteca oficial/private/own/community.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Search/category/saved/favorites/version/publication/visibility/moderation; ratings/install stats solo acciones registradas, biblioteca oficial/private/own/community.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T34.

**Archivos previstos:** `handlers/templates/service.js`, `dashboard/views/pages/templates.ejs`, `database/schemas/TemplateSchema.js`, `test/template-community.test.js`.

**Scope:** Medio.

### Checkpoint tras T43

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T44

- [ ] Suggestions y starboard (fase 7).

**Descripción:** Propuesta/voto/status/staff response; multiboards/thresholds/filters/dedupe con permisos y eventos ambas interfaces.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Propuesta/voto/status/staff response; multiboards/thresholds/filters/dedupe con permisos y eventos ambas interfaces.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T13, T15.

**Archivos previstos:** `handlers/suggest.js`, `handlers/starboard.js`, `dashboard/views/pages/community.ejs`, `test/suggestions-starboard.test.js`.

**Scope:** Medio.

## T45

- [ ] Levels y profiles (fase 7).

**Descripción:** Text/voice cooldown/multipliers/rewards/leaderboard; excluir bots/estados según regla; badges/reputation/preferences/stats reales guild aislado.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Text/voice cooldown/multipliers/rewards/leaderboard; excluir bots/estados según regla; badges/reputation/preferences/stats reales guild aislado.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T39, T13.

**Archivos previstos:** `handlers/ranking.js`, `database/schemas/RankingSchema.js`, `database/schemas/UserProfileSchema.js`, `dashboard/views/pages/community.ejs`, `test/levels.test.js`.

**Scope:** Medio.

## T46

- [ ] Economía atómica e idempotente (fase 7).

**Descripción:** Wallet/daily/work/shop/inventory/rewards por guild/user con claves únicas/ledger; doble claim/cobro concurrente prevenido sin asumir replica transactions.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Wallet/daily/work/shop/inventory/rewards por guild/user con claves únicas/ledger; doble claim/cobro concurrente prevenido sin asumir replica transactions.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T12.

**Archivos previstos:** `handlers/economy/service.js`, `database/schemas/EconomySchema.js`, `database/schemas/EconomyOperationSchema.js`, `dashboard/views/pages/economy.ejs`, `test/economy.test.js`.

**Scope:** Medio.

## T47

- [ ] Giveaways durables y reroll auditado (fase 7).

**Descripción:** Requirements/entries/bonus/persistent close/scheduling, actual winners and audit reroll; reinicio no pierde deadline/duplica premios.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Requirements/entries/bonus/persistent close/scheduling, actual winners and audit reroll; reinicio no pierde deadline/duplica premios.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T24, T13.

**Archivos previstos:** `handlers/giveaway.js`, `database/schemas/GiveawaySchema.js`, `dashboard/views/pages/giveaways.ejs`, `test/giveaway.test.js`.

**Scope:** Medio.

## T48

- [ ] Voice temporal y reminders recurrentes (fase 7).

**Descripción:** Join-to-create owner/limit/lock/whitelist/cleanup; reminders personal/guild/timezone/recurrence durable restart, sin duplicar envío.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Join-to-create owner/limit/lock/whitelist/cleanup; reminders personal/guild/timezone/recurrence durable restart, sin duplicar envío.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T24.

**Archivos previstos:** `handlers/jointocreate.js`, `commands/School-Commands/remind.js`, `handlers/reminders/service.js`, `dashboard/views/pages/schedules.ejs`, `test/reminders.test.js`.

**Scope:** Medio.

### Checkpoint tras T48

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T49

- [ ] Embed/message builder conectado (fase 7).

**Descripción:** Variables validadas/preview/templates/edit publicados gestionables; límites/mentions explícitos y shared renderer, eventos reales.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Variables validadas/preview/templates/edit publicados gestionables; límites/mentions explícitos y shared renderer, eventos reales.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T09, T15.

**Archivos previstos:** `handlers/embeds/service.js`, `dashboard/views/pages/embeds.ejs`, `dashboard/index.js`, `test/embed-builder.test.js`.

**Scope:** Medio.

## T50

- [ ] Feeds con credenciales y dedupe (fase 7).

**Descripción:** YouTube/Twitch/RSS disponibles con polling/webhooks/cuotas/dedupe/recovery; unconfigured no se anuncia connected.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: YouTube/Twitch/RSS disponibles con polling/webhooks/cuotas/dedupe/recovery; unconfigured no se anuncia connected.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T24, T15.

**Archivos previstos:** `social_log/youtube.js`, `handlers/feeds/service.js`, `dashboard/views/pages/feeds.ejs`, `test/feeds.test.js`.

**Scope:** Medio.

### Checkpoint tras T50

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T51

- [ ] Automation runtime seguro (fase 7).

**Descripción:** Trigger/0+conditions/1+actions; drafts/validation/dry run/publish/enable/runs; permisos/dedupe/cycle/depth/cooldown sin JS arbitrario.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Trigger/0+conditions/1+actions; drafts/validation/dry run/publish/enable/runs; permisos/dedupe/cycle/depth/cooldown sin JS arbitrario.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T14, T24, T13.

**Archivos previstos:** `handlers/automation/engine.js`, `database/schemas/WorkflowSchema.js`, `handlers/automation/registry.js`, `test/automations.test.js`.

**Scope:** Medio.

## T52

- [ ] Automation builder y eventos integrados (fase 7).

**Descripción:** Nodes Discord especializados; member young→quarantine+log, level→role, closed→transcript, feed→message; roles/channel/account age/content/config y unavailable intents explícitos.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Nodes Discord especializados; member young→quarantine+log, level→role, closed→transcript, feed→message; roles/channel/account age/content/config y unavailable intents explícitos.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T51, T45, T41, T50.

**Archivos previstos:** `dashboard/views/pages/automations.ejs`, `dashboard/public/js/automations.js`, `dashboard/index.js`, `handlers/automation/registry.js`, `test/automation-flows.test.js`.

**Scope:** Medio.

## T53

- [ ] Utility/Fun UI compatible (fase 7).

**Descripción:** Mantener polls/dice/minigames/utilities y responses compactas; context menus report/evidence/profile/cases solo para servicios reales; IA general/Activities opcionales no bloquean central.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Mantener polls/dice/minigames/utilities y responses compactas; context menus report/evidence/profile/cases solo para servicios reales; IA general/Activities opcionales no bloquean central.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T09, T08.

**Archivos previstos:** `handlers/games.js`, `handlers/games-choice.js`, `slashCommands/Fun/minigames.js`, `test/command-compatibility.test.js`.

**Scope:** Medio.

### Checkpoint tras T53

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.

## T54

- [ ] Analytics por eventos reales (fase 8).

**Descripción:** Growth/text/voice/channels/commands/music/ticket/mod ventanas/timezone/retención; fecha inicio, cero/no data/no permission, gráficos útiles con texto.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Growth/text/voice/channels/commands/music/ticket/mod ventanas/timezone/retención; fecha inicio, cero/no data/no permission, gráficos útiles con texto.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T13, T52.

**Archivos previstos:** `handlers/analytics/service.js`, `database/schemas/StatsSchema.js`, `dashboard/views/pages/analytics.ejs`, `test/analytics.test.js`.

**Scope:** Medio.

## T55

- [ ] Salud y recuperación medidos (fase 8).

**Descripción:** Gateway/shards/DB/Redis/workers/realtime/music healthy/degraded/recovering/offline/unknown reales; correlation/timeouts/safe retries/circuit/shutdown; infraestructura privada por permiso.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Gateway/shards/DB/Redis/workers/realtime/music healthy/degraded/recovering/offline/unknown reales; correlation/timeouts/safe retries/circuit/shutdown; infraestructura privada por permiso.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T24, T15.

**Archivos previstos:** `handlers/health.js`, `dashboard/index.js`, `index.js`, `test/health-shutdown.test.js`.

**Scope:** Medio.

## T56

**Checkpoint activo:** CI inicial adelantada a las primeras slices. Archivo configurado; GitHub/Docker/migraciones pendientes. No depende de terminar analytics para validar código.

- [ ] CI, migraciones y Docker (fase 8).

**Descripción:** Stack apropiado unit/integration/contracts/schema/custom_ids/components/startup/Docker; assets/fonts incluidos; defaults y precedencia, migrations backward compatible sin TS/monorepo reescritura.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Stack apropiado unit/integration/contracts/schema/custom_ids/components/startup/Docker; assets/fonts incluidos; defaults y precedencia, migrations backward compatible sin TS/monorepo reescritura.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T54, T55.

**Archivos previstos:** `.github/workflows/ci.yml`, `scripts/validate-commands.js`, `scripts/check-migrations.js`, `Dockerfile`, `test/startup.test.js`.

**Scope:** Medio.

## Renovación de recursos · continuación T02–T04 (paquete de octubre)

- [x] R01: Importar solo variantes seleccionadas por destino al registro existente, con verificación de hashes y sin copiar documentación ni cambiar el perfil de aplicación. Verificado con pruebas de importación y modo `--check`: 103 claves/324 archivos. Dependencias: paquete descomprimido. Archivos: importador, pruebas y materiales generados.
- [x] R02: Resolver las 103 claves y los 89 alias, rechazar mapas ajenos/obsoletos y mantener fallbacks y compatibilidad v1. Verificados alias/canónico, GIF, archivos ausentes, doce controles musicales, consulta de disponibilidad conectada al arranque y apagado. Dependencia: R01. Archivos: resolver, lifecycle, consumo musical y pruebas focalizadas.
- [x] R03: Sincronizar las 82 entradas canónicas sin duplicar aliases, preservar checkpoints y recursos válidos ante fallo, adaptar MIME y mapa v2. Verificados PNG/GIF, reconciliación, borrado remoto, fallos parciales y hashes; suite completa 280/280 y auditoría/esquemas sin publicar. Dependencia: R02. Archivos: pipeline, CLI y pruebas.
- [x] Checkpoint local: pruebas, revisión del diff, evidencia en `docs/platform/REMODELACION.md` y commits por incremento; disponibilidad real de emojis y recorridos Discord pendientes de entorno autorizado. Siguiente: capacidades/configuración versionada por módulo.

## Configuración por módulo · continuación T05/T12

- [x] C01: Nombres de capacidades normalizados desde permisos de manifests reales; welcome registrado sin reinicializar su handler. Verificados aislamiento de dominio y servicio único.
- [x] C02: Borrador/publicación de canal y mensaje con schemaVersion, autor, revisión monotónica y CAS de valores publicados/legacy. Tarjetas/DM preservados. Verificados concurrencia entre instancias, reintento y fallo de persistencia con pruebas y Mongo real aislado. Dependencia: C01.
- [x] C03: API autenticada y editor con vista previa, borrador, comparación y publicación. Verificados autorización, CSRF, conflicto, conservación de texto, teclado y 320/768/1024/1440 en Chromium. Dependencia: C02.
- [x] Checkpoint local: suite 293/293, Mongo aislado, navegador sin errores de página, evidencia en `CONFIGURATION.md` y commits de la entrega. Discord real, resto de campos/módulos e historial de operaciones siguen pendientes.

## Ayuda contextual · continuación T11/T53

- [x] H01: Catálogo de prefijo/slash y aliases efectivos desde registros cargados; disponibilidad por contexto y metadatos acotados. Verificados nombres reales, permisos declarados, roles heredados, voz y contenido desactivado.
- [x] H02: Consulta compartida; categorías/páginas completas, slash privado y revalidación de cada control. Verificados propietario/guild/mensaje, caducidad, acceso fallido, respuesta tardía y orden de clicks. Dependencia: H01.
- [x] H03: Ayuda web autenticada sobre el mismo servicio, búsqueda/categoría/canal/detalle, paginación y recorrido en Chromium. Evidencia en `HELP.md` y `evidence/help`. Dependencia: H02.
- [x] Checkpoint local: 306 tests pasan, builders del catálogo real, schemas/auditoría sin publicación y commits de entrega. Discord real y resto de T11/T53 permanecen pendientes; no se declara cerrado utilities.

## Tarjetas y bienvenida · continuación T18

- [x] K01: Corregir CARD-04 con textura compuesta y acotada, preservar contenido/clip, comprobar regiones de avatar y texto en PNG decodificado.
- [x] K02: Recorte circular proporcional con transparencia, nombres medidos y elipsis por grafemas, fuentes locales para CJK/emoji y contador de miembros actuales. CARD-06 y semántica del contador verificados localmente.
- [x] K03: Extraer bienvenida a cards.js y conectar evento/DM y ambos slash; mismo render y flags, sin estilos exclusivos del preview. CARD-07 cubierto para estos consumidores Discord; web/DTO aún pendientes.
- [x] K04: Omitir base de ranking en el fondo automático, fallback neutro al fallar imagen opcional, ocho renders reales offline inspeccionados y pruebas de regresión. Alternativa neutra de CARD-05; selección persistida de fondos por guild pendiente.
- [x] Checkpoint local: suite completa 316/316, auditoría 811 comandos sin errores/conflictos y schemas 19 raíces/166 subcomandos, sin publicación. Evidencia y límites en `docs/platform/CARDS.md`.
- [x] K05: Separar DTO/buffers del SDK; ingestión HTTPS acotada de CDN Discord y formatos/dimensiones antes de decode, sin rutas libres ni redirects. Verificados rechazo antes de red, bytes, plazo, stream truncado y PNG/JPEG/WebP reales.
- [x] K06: Entrega compartida de texto ante fallo gráfico, falta de permisos de adjunto/embed o rechazo explícito; revalidación de permisos, nonce temporal, sin reintento de resultado incierto. Evento de despedida registrado y ambos slash verificados con transportes ficticios.
- [x] K07: Títulos de bienvenida/despedida automáticas sin eval; corregidos cuatro títulos españoles. Suite completa 335/335 y ocho renders conservados con los mismos hashes; no se publicó ni inició el bot. Destino de canal restringido a la guild del evento antes de render/red.
- [x] K08: Procesos de una tarjeta con IPC/DTO acotados, CPU/DATA del kernel, vigilancia RSS, plazo transcurrido y cola FIFO; admisión antes de descargar. Bloqueo, crash, memoria, límites, env y recuperación verificados con hijos reales.
- [x] K09: Worker usado en bienvenida/despedida y ambos slash; cierre único del servicio, preparación tardía y mensajes de apagado bloqueados. Suite completa 352/352, ocho hashes de render conservados y evidencia offline `isolation.json`; no se inició ni desplegó el bot.
- [x] K10: Uploads privados normalizados en worker, colección separada por guild, tres assets/4 MiB por asset, revisión generacional, selección y borrado protegidos. Caducidad no usados, concesión activa, TTL y limpieza/purga; Mongo aislado verifica concurrencia y bytes.
- [x] K11: Galería y preview web con actor/OAuth frescos, CSRF, aislamiento, imagen sin mensajes, elección por destino y eliminación confirmada. Byte igualdad con render de Discord; Chromium móvil/escritorio/teclado/XSS/revocación pasa. Suite completa 363/363.
- [x] Entrega operativa (13 de octubre): 82 emojis cargados/resueltos, bot desplegado desde Git d840e4f, 19 raíces slash publicadas, health/Mongo/música y worker en contenedor verificados. Backup privado y rollback preparados; sin modificar cambios locales de Architect. Evidencia en `docs/platform/RELEASE-2026-10-13.md`.
- [ ] Completar T18: previews internos de setup legacy; recorridos de usuario Discord/OAuth reales y medición de los presupuestos en producción. Continuar después con CARD-08 de ranking.

## T57

- [ ] Validación transversal y preparación PR (fase 8).

**Descripción:** Todos critical cases y UI states/mobile/slow network/large text verificables; renders reales; instrucciones canary con autorización, matriz evidence/pending y PR a base sin merge/production.

**Aceptación:**

- [ ] Flujo indicado conectado a datos, permisos, errores y persistencia adecuados; requisitos de esa sección del maestro conservados.
- [ ] Discord y web comparten servicio y estado donde aplica, sin duplicación ni datos simulados.
- [ ] Criterios específicos: Todos critical cases y UI states/mobile/slow network/large text verificables; renders reales; instrucciones canary con autorización, matriz evidence/pending y PR a base sin merge/production.

**Verificación:**

- [ ] Tests focalizados con `node --test test/<archivo-del-slice>.test.js` cubren conducta y fallos de estos criterios.
- [ ] `git diff --check` y schemas/build apropiados; si hay UI, inspección renderizada loading/empty/error/denied/disconnected/long text/móvil/teclado.
- [ ] Registrar resultado exacto y estado pendiente del entorno real; nunca iniciar bot ni registrar comandos para un audit offline.

**Dependencias:** T56.

**Archivos previstos:** `docs/platform/AUDIT.md`, `docs/platform/requirements.json`, `tasks/todo.md`, `docs/IMPLEMENTATION.md`.

**Scope:** Medio.

### Checkpoint tras T57

- [ ] Tests focalizados y contratos/schemas pertinentes pasan; mantener startup/producción separados.
- [ ] Revisión de integración concreta, UI/render si aplica y aislamiento/permisos/fallo comprobados.
- [ ] Actualizar matriz/AUDIT/ADR con evidencia, archivos, restricciones de credenciales y siguiente tarea con dependencias.


## Continuación autorizada · música y paquete actualizado (14 de octubre de 2026)

- [x] Extraer/verificar paquete actualizado y eliminar ZIP; conservar entrega anterior y validar Adaptación al servidor.
- [x] Retirar WARP del servidor y de Lavalink; loopback, plugin directo y fuentes adultas desactivadas.
- [x] Pool privado/público, selección por guild, persistencia, recuperación y codecs por destino; cola/pausa/mute/filtros y controles concurrentes verificados.
- [x] Conexiones de música en panel y `/nodes`, permisos/CSRF y estados accesibles; 387 tests y navegador aislado pasan.
- [x] Desplegar bot/Lavalink y verificar tres públicos, salud, emojis, NSFW ausente y conservación de imágenes/Redis y 16 cambios locales. Evidencia: `docs/platform/evidence/music-nodes/runtime.json`.
- [ ] Verificar audio audible en Discord y OAuth con sesión real; continuar las tareas pendientes del maestro y la adaptación compartida sin dar por terminados los 32 contratos.


## Principal público y privado apagado (petición posterior, 14 de octubre)

- [x] Privado apagado sin reinicio, excluido del bot y sin puerto abierto; archivos conservados.
- [x] Nazha seleccionado, Serenetia/MilloHost respaldos y conservación de cola durante caída completa. 392 tests.
- [x] Prueba de voz en THZ/VC1: progreso nativo en Nazha y Serenetia, pausa/cola/mute/sesión preservados y limpieza; selección persistida. Sin confirmación auditiva humana.
- [x] Despliegue final sin bandera de prueba; salud/Mongo/música y 82 emojis; cambios locales previos, imágenes y Redis preservados. Ver checkpoint/evidencia public-only-runtime.

## Remodelación de setups · continuación T08/T11/T12 · 18/10/2026

Alcance confirmado: código y menús de Discord juntos. [Mapa, dependencias, aceptación y verificación por entrega](../docs/guia-arquitectura/REMODELACION_SETUPS.md); [63 archivos y metadatos](../docs/platform/evidence/setup-inventory.json). No sustituye las tareas previas ni cierra el dominio por cambiar su menú. Cada comando se divide en operaciones si supera cinco archivos.

- [x] Inventario estático de los 63 comandos y grupos, con hashes y aliases efectivos del subconjunto.
- [x] SETUP-BASE-01 (local): remodelar navegación `setup`: registro vivo, menús paginados, actor/permisos frescos, expiración/cancelación y errores asíncronos comprobados con sesiones simultáneas. Archivos: comando, controlador y catálogos es/en. Dependencia: T11 existente. Verificar builders y controles con fixtures temporales; `npm test`, sintaxis y diff.

Verificado en `eadc547b0684ded2c9cca65cc685362c518ab660`: 15 escenarios temporales, 100 ciclos SDK sin listeners sobrantes y 25/25 originales. Sin recorrido real Gateway/Discord ni despliegue. Evidencia: [navegación](../docs/platform/evidence/setup-navigation.json).

### Comandos pendientes por grupo

Cada casilla hereda la aceptación/verificación del mapa y exige conciliar sus operaciones, datos, permisos y menús. Dependencia: navegación local y servicio del dominio correspondiente. Archivos: comando indicado, su servicio/persistencia existentes y textos; dividir si supera cinco archivos.

**SETUP-BASE · Navegación y ajustes generales**

- [x] [commands/Setup/setup-commands.js](../commands/Setup/setup-commands.js).
- [x] [commands/Setup/setup-embed.js](../commands/Setup/setup-embed.js).
- [x] [commands/Setup/setup-language.js](../commands/Setup/setup-language.js) — código y menú locales verificados; [evidencia](../docs/guia-arquitectura/IDIOMA_SETUP.md).
- [x] [commands/Setup/setup.js](../commands/Setup/setup.js) — navegación local verificada; los demás asistentes siguen abiertos.

**SETUP-WELCOME · Bienvenida y despedidas**

- [x] [commands/Setup/setup-boost.js](../commands/Setup/setup-boost.js).
- [x] [commands/Setup/setup-joinlist.js](../commands/Setup/setup-joinlist.js).
- [x] [commands/Setup/setup-leave.js](../commands/Setup/setup-leave.js).
- [x] [commands/Setup/setup-welcome.js](../commands/Setup/setup-welcome.js).

**SETUP-LOGS · Registros**

- [x] [commands/Setup/setup-admincmdlog.js](../commands/Setup/setup-admincmdlog.js).
- [x] [commands/Setup/setup-auditlog.js](../commands/Setup/setup-auditlog.js).
- [x] [commands/Setup/setup-boostlog.js](../commands/Setup/setup-boostlog.js).
- [x] [commands/Setup/setup-logger.js](../commands/Setup/setup-logger.js).
- [x] [commands/Setup/setup-reportlog.js](../commands/Setup/setup-reportlog.js).
- [x] [commands/Setup/setup-serverstats.js](../commands/Setup/setup-serverstats.js).

**SETUP-SECURITY · Moderación y protección**

- [x] [commands/Setup/setup-admin.js](../commands/Setup/setup-admin.js).
- [x] [commands/Setup/setup-anticaps.js](../commands/Setup/setup-anticaps.js).
- [x] [commands/Setup/setup-antidiscord.js](../commands/Setup/setup-antidiscord.js).
- [x] [commands/Setup/setup-antilink.js](../commands/Setup/setup-antilink.js).
- [x] [commands/Setup/setup-antimassmention.js](../commands/Setup/setup-antimassmention.js).
- [x] [commands/Setup/setup-antimasspings.js](../commands/Setup/setup-antimasspings.js).
- [x] [commands/Setup/setup-antimention.js](../commands/Setup/setup-antimention.js).
- [x] [commands/Setup/setup-antinewaccount.js](../commands/Setup/setup-antinewaccount.js).
- [x] [commands/Setup/setup-antinuke.js](../commands/Setup/setup-antinuke.js).
- [x] [commands/Setup/setup-antipings.js](../commands/Setup/setup-antipings.js).
- [x] [commands/Setup/setup-antispam.js](../commands/Setup/setup-antispam.js).
- [x] [commands/Setup/setup-autowarn.js](../commands/Setup/setup-autowarn.js).
- [x] [commands/Setup/setup-blacklist.js](../commands/Setup/setup-blacklist.js).
- [x] [commands/Setup/setup-epicgamesverify.js](../commands/Setup/setup-epicgamesverify.js).
- [x] [commands/Setup/setup-ghost-ping-detector.js](../commands/Setup/setup-ghost-ping-detector.js).
- [x] [commands/Setup/setup-mute.js](../commands/Setup/setup-mute.js).
- [x] [commands/Setup/setup-validcode.js](../commands/Setup/setup-validcode.js).
- [x] [commands/Setup/setup-warn.js](../commands/Setup/setup-warn.js).

**SETUP-MUSIC · Configuración musical y voz**

- [x] [commands/Music/setupmusic.js](../commands/Music/setupmusic.js).
- [x] [commands/Setup/setup-joinvc.js](../commands/Setup/setup-joinvc.js).
- [x] [commands/Setup/setup-jtc.js](../commands/Setup/setup-jtc.js).
- [x] [commands/Setup/setup-music.js](../commands/Setup/setup-music.js).
- [x] [commands/Setup/setup-radio.js](../commands/Setup/setup-radio.js).
- [x] [slashCommands/Config/setupmusic.js](../slashCommands/Config/setupmusic.js).

**SETUP-SUPPORT · Tickets y solicitudes**

- [x] [commands/Setup/setup-apply.js](../commands/Setup/setup-apply.js).
- [x] [commands/Setup/setup-autosupport.js](../commands/Setup/setup-autosupport.js).
- [x] [commands/Setup/setup-menuapply.js](../commands/Setup/setup-menuapply.js).
- [x] [commands/Setup/setup-menuticket.js](../commands/Setup/setup-menuticket.js).
- [x] [commands/Setup/setup-ticket.js](../commands/Setup/setup-ticket.js).

**SETUP-ROLES · Roles, niveles y contadores de miembros**

- [x] [commands/Setup/setup-membercount.js](../commands/Setup/setup-membercount.js).
- [x] [commands/Setup/setup-rank.js](../commands/Setup/setup-rank.js).
- [x] [commands/Setup/setup-reactionrole.js](../commands/Setup/setup-reactionrole.js).
- [x] [commands/Setup/setup-roster.js](../commands/Setup/setup-roster.js).

**SETUP-AUTOMATION · Comunidad y automatizaciones**

- [x] [commands/Setup/setup-aichat.js](../commands/Setup/setup-aichat.js).
- [x] [commands/Setup/setup-autobackup.js](../commands/Setup/setup-autobackup.js).
- [x] [commands/Setup/setup-autodelete.js](../commands/Setup/setup-autodelete.js).
- [x] [commands/Setup/setup-autoembed.js](../commands/Setup/setup-autoembed.js).
- [x] [commands/Setup/setup-automeme.js](../commands/Setup/setup-automeme.js).
- [x] [commands/Setup/setup-counter.js](../commands/Setup/setup-counter.js).
- [x] [commands/Setup/setup-customcommand.js](../commands/Setup/setup-customcommand.js).
- [x] [commands/Setup/setup-dailyfact.js](../commands/Setup/setup-dailyfact.js).
- [x] [commands/Setup/setup-keyword.js](../commands/Setup/setup-keyword.js).
- [x] [commands/Setup/setup-suggestion.js](../commands/Setup/setup-suggestion.js).

**SETUP-FEEDS · Publicaciones de plataformas**

- [x] [commands/Setup/setup-tiktok.js](../commands/Setup/setup-tiktok.js).
- [x] [commands/Setup/setup-twitch.js](../commands/Setup/setup-twitch.js).
- [x] [commands/Setup/setup-twitter.js](../commands/Setup/setup-twitter.js).
- [x] [commands/Setup/setup-youtube.js](../commands/Setup/setup-youtube.js).

**SETUP-OWNER · Operación exclusiva del dueño**

- [x] [commands/Owner/setup-advertise.js](../commands/Owner/setup-advertise.js).
- [x] [commands/Owner/setup-owner.js](../commands/Owner/setup-owner.js).

### SETUP-BASE-02 · idioma · verificación local

- [x] Idioma actual y selección pendiente en un mensaje; guardar/restablecer/cerrar con es/en, opciones de catálogos cargados y aliases efectivos conservados.
- [x] Escritor canónico del mismo campo con cola/CAS, confirmación Mongo, conflicto conservando selección, caché legacy y cierre antes del flush comprobados.
- [x] 21 escenarios temporales, 100 ciclos SDK, 25 originales y comprobaciones de sintaxis/tipos/imports apropiadas. Commit `f4163778677b3b893bde2308c1a328e8d24111e5`. [Límites y reversión](../docs/guia-arquitectura/IDIOMA_SETUP.md).
- [x] Despliegue con Gateway y salud confirmados el 18/10/2026.
- [ ] Recorrido interactivo del menú en Discord real, separado de la verificación local.

Avance local: 63/63 archivos de comandos remodelados y verificados localmente. [Música/voz](../docs/guia-arquitectura/MUSICA_VOZ_SETUP.md) unifica paneles y conserva adopción del mensaje antiguo; radio separada del destino de peticiones. [Evidencia acumulada](../docs/platform/evidence/setup-remodeling-local.json). Desplegado el 18/10/2026 con Gateway conectado; sin push. Continúan pendientes el recorrido interactivo de Discord, la integración del verificador Epic y las tareas globales ya abiertas del plan; completar estos menús no cierra toda la arquitectura.

### Cierre local del inventario de setups

- [x] Remodelación de los 63 archivos y comprobación estática de nombres, aliases efectivos y permisos.
- [x] Pruebas locales de formularios, escrituras, recursos, conflictos, permisos y cierre; scripts temporales retirados al terminar. Solo 3 archivos/25 tests originales permanecen en el repositorio.
- [ ] Recorrido real de Discord y audio Lavalink de los cambios nuevos.
- [ ] Integración/autenticación del proveedor Epic antes de habilitar su panel.
- [x] Despliegue de `f4acfac` con 63 hashes comprobados en el contenedor, Gateway/heartbeat, MongoDB, tres nodos públicos, servicios healthy y salud HTTPS 200; imagen anterior y backup conservados. [Evidencia](../docs/platform/evidence/setup-deployment-20261018.json).
- [ ] Publicación remota de esta rama local (sin push durante el despliegue).

### Facilidad de uso de setups · prioridad posterior al despliegue

Fuente de aceptación: [recorrido sencillo](../docs/guia-arquitectura/FACILIDAD_SETUP.md), ligado a ARCH-10 y a los comandos existentes.

- [x] Inicio con nombres comprensibles y finalidad para 61 configuraciones prefix, accesos habituales y categorías explicadas en es/en. 32 grupos de builders reales comprobados; registro y comprobación fresca conservados.
- [x] Formularios con avance entre ajustes, valores legibles, resumen pendiente y regreso por el mismo mensaje. Selector para retirar recursos, bloqueo al volver con cambios y limpieza comprobada con SDK real; persistencia canónica conservada.
- [x] Bienvenida con canal/mensaje y ejemplos; tickets con cinco ajustes básicos y Más opciones. Solicitudes, menús y salas muestran Nuevo/existentes en lugar de 100 sistemas al entrar; acceso avanzado y configuración existente conservados.
- [x] Verificación: 58 grupos SDK/Mongo aislado, 100 ciclos, 32 grupos de navegación, 25 tests originales y tipos/dependencias. Script y contenedor temporales eliminados. [Evidencia local](../docs/platform/evidence/setup-usability-local.json).
- [x] Despliegue de facilidad de uso `3673b47`, con Gateway/heartbeat, MongoDB, nodos públicos, servicios saludables y HTTPS 200. [Evidencia de despliegue](../docs/platform/evidence/setup-usability-deployment-20261018.json).
- [ ] Validación del recorrido con el usuario dentro de Discord; continuar pendientes globales del ZIP.

### Continuación solicitada · slash y música como trabajos separados

- [x] `/setup` global, privado, sin argumentos y con navegación simplificada. 19 grupos SDK del registro/flujo pasan; el motor musical no cambia en esta entrega.
- [x] Música: identificar Shorts, priorizar grabaciones originales y conservar identidad/duración en recuperación. 48 grupos locales y 25 tests originales pasan; [alcance y límites](../docs/guia-arquitectura/SELECCION_MUSICAL.md). Entrega independiente del centralizador de setups.
- [x] Revisiones desplegadas como cambios independientes en imagen `release-slash-music-20261019-398e22f`: 11 hashes, 20 slash globales, Gateway/heartbeat, tres nodos públicos y salud local/pública 200. [Evidencia](../docs/platform/evidence/slash-music-deployment-20261019.json).
- [ ] Recorrido manual de `/setup`, escucha musical y pendientes globales del plan.


### Incidencia de setups · 19/10/2026

- [x] Reproducir y corregir la ausencia de Descartar cambios en idioma; comprobar regreso sin escrituras en `!setup` y `/setup`.
- [x] Distinguir avisos de acceso, permisos del bot, almacenamiento e inicio/cierre; registrar fallos sin credenciales ni documentos. 23 grupos locales, 25 originales y tipos/dependencias pasan. [Alcance](../docs/guia-arquitectura/ERRORES_SETUP.md).
- [x] Corrección desplegada en `ff94f31`: 10 hashes, Gateway/heartbeat, 20 slash globales, MongoDB y nodos públicos, salud local/pública 200. [Evidencia](../docs/platform/evidence/setup-errors-deployment-20261019.json).
- [ ] Ubicar y reproducir el error original de acceso/guardado en el servidor/canal del usuario; no darlo por resuelto con las pruebas locales.


### Continuación del plan · registros y avisos al propietario

- [x] Primera entrega local de avisos de alta/baja: mensajes renovados es/en, preferencias del dueño, deduplicación, fallos observables y cierre. Retirada la eliminación automática de stores al salir. 16 grupos aislados y 25 originales pasan. [Alcance](../docs/guia-arquitectura/REGISTROS_Y_AVISOS_OWNER.md).
- [x] Remodelar el consumidor real de registros: destinos, permisos, privacidad, cobertura y entregas; configuración canónica Discord/web con revisión y sin escritor alternativo.
- [x] Verificar y desplegar `621366a`: 111 grupos temporales, 25 originales, 22 hashes, Gateway/heartbeat y salud local/pública 200. No se emitieron DMs de prueba ni se simularon entradas/salidas. [Evidencia](../docs/platform/evidence/logs-owner-deployment-20261019.json).
- [ ] Continuar retención/consulta de T38 y los demás bloques abiertos del maestro; completar los setups no equivale a completar el plan.

### Corrección a partir de las guías de Quark

- [x] Contrastar contrato, profundización, experiencia/pantallas y capturas originales; registrar lo omitido por la primera entrega técnica.
- [x] Implementar mensajes compactos con usuario, motivo, fechas, antes/después y contexto disponible; contenido no observado explícito, sin casos inventados ni filtraciones.
- [x] Usar entradas de auditoría propias para vetos/aislamientos cuando se dispone de capacidad; fallback desconocido y deduplicación acotada, sin atribución por proximidad.
- [x] Añadir diagnóstico privado al mismo setup: destinos, acceso, envío, intents y límites de captura; no guarda ni publica pruebas. 49 grupos SDK, seis visuales y 25 originales pasan. [Alcance](../docs/guia-arquitectura/LOGS_REFERENCIA_QUARK.md).
- [x] Reproducir y corregir la visibilidad de motivos de auditoría en destinos abiertos; exigir audiencia staff y avisar en el diagnóstico. 20 grupos adicionales de regresión pasan.
- [x] Desplegar `64ee040` y comprobar 24 hashes, Gateway/heartbeat, 20 comandos, tres nodos públicos y salud local/pública 200. [Evidencia](../docs/platform/evidence/logs-quark-deployment-20261019.json). Mensajes reales en el cliente Discord todavía pendientes.
- [ ] Completar casos enlazables, historial/retención, explorador/filtros/exportación autorizada y recuperación durable; el contrato Quark completo sigue pendiente.

### Visibilidad de logs de voz · 20/10/2026

- [x] Reproducir el rechazo de acceso por roles y comparar audiencias, incluidas excepciones personales, sin exponer canales privados. 380 grupos/16.800 asignaciones SDK y dos capturas de solo lectura. [Alcance](../docs/guia-arquitectura/VISIBILIDAD_REGISTROS.md).
- [x] Desplegar `0be39f3`: 25 hashes, Gateway/heartbeat, salud local/pública 200 y respaldo/reversión conservados. [Evidencia](../docs/platform/evidence/log-visibility-deployment-20261020.json).
- [x] El usuario identifica general 1; lectura fresca de General y permisos compatibles comprobados.
- [ ] Observar la siguiente salida real en Discord; evento histórico de las 22:03 no reproducido.
- [ ] Revisar disponibilidad de GDjkhp (REST 403, sin conectar); respaldos Serenetia/MilloHost conectados, sin cambios de prioridad ni prueba auditiva.

### Trinium NodeLink 02 · activación solicitada

- [x] Seleccionar y conectar `trinium-02` como principal; conservar Serenetia/GDjkhp/MilloHost y nodo privado apagado. Ocho comprobaciones de pool, 25 originales, tres Compose y salud operativa pasan. [Entrega](../docs/platform/DESPLIEGUE-TRINIUM-2026-10-22.md).
- [ ] Escucha y conmutación de voz reales; no había reproducción observada al verificar el arranque.
- [ ] Adaptar letras/capacidades nativas de NodeLink, sin confundir versión del motor y API v4; pendientes globales conservados.

### Búsquedas, álbumes y radio · corrección solicitada

- [x] Reproducir búsqueda escasa de adela, respuesta nativa album y API 50006 de radio; corregir selectores, colecciones y transiciones vacías. 19 grupos temporales, consulta real 11 pistas/siete álbumes/álbum de 11 canciones y 25 originales pasan. [Alcance](../docs/guia-arquitectura/BUSQUEDAS_ALBUMES_RADIO.md).
- [x] Desplegar `07da107`: 31 hashes, 25 tests en imagen limpia, búsqueda desde el contenedor y PCM de una radio, servicios saludables y respaldo/reversión conservados; Trinium 02 principal, respaldos públicos y privado apagado. [Evidencia](../docs/platform/evidence/search-radio-deployment-20261022.json).
- [ ] Recorrido y escucha reales en Discord; conservar pendientes de letras y plan global.

### Entrega integrada 0.15 · 23/10/2026

- [x] Extraer/verificar 3.908 archivos y borrar ZIP; conciliar guías/materiales con avances del checkout, sin aplicar bootstrap o código antiguo. [Recepción](../docs/guia-arquitectura/CONCILIACION_2026-10-23.md).
- [x] Incorporar 1.034 materiales y guías/contratos; conservar aprobaciones, bindings y estados pendientes, sin publicación.
- [x] P0 parcial: versiones efectivas y 675 candidatos actuales; loader slash offline de la imagen: 20 entradas/144 operaciones. Verificar datos/imágenes/enlaces y 31 hashes protegidos.
- [ ] Completar G01/G02 globales: prefix/aliases, propietarios, compatibilidad y lock/CI del cliente objetivo.
- [ ] P1: migrar Shoukaku a lavalink-client con una única cola y aceptación de fin/skip/stop/autoplay/manual/recuperación; conservar doce controles, favoritos y reloj.
- [ ] P2–P6 y puertas del maestro: permisos/datos/idiomas/materiales por recorrido; /servidor, eventos, sandbox premium/votos y escalado según contratos, sin cerrar funciones por documentación.

### Relevancia y gustos · 23/10/2026

- [x] Filtrar homónimos ajenos, canales y duplicados; mantener Unicode y créditos del artista. Cuatro fuentes elegidas; retirar JioSaavn de consultas/recuperación.
- [x] Conectar mix relacionado a autoplay/playmusicmix y descubrimiento privado por Me gusta/historial; identidad de sesión, permisos de guild, cancelación y vacío honesto.
- [x] Veinte casos temporales y 25 originales; Chromium aislado y proveedor real. Desplegar c5033b7: 40 hashes, salud HTTP local/pública 200, acceso privado sin sesión 401, respaldo/reversión conservados. [Evidencia](../docs/platform/evidence/music-relevance-deployment-20261023.json).
- [ ] Recorrido y escucha reales del usuario en Discord/panel; conservar incidentes y etapas del plan 0.15 abiertas. Afinidad del proveedor no garantiza clasificación exacta de géneros.

## 23/10/2026 · P1 continuidad, alcance parcial

- [x] Corregir pérdida de player remoto sin forzar salida de voz cuando la conexión sigue válida (`6d5b666`).
- [x] Acotar recuperación, cancelar por stop e ignorar player retirado; diez casos temporales y 25 originales pasan.
- [x] Desplegar y guardar [evidencia](../docs/platform/evidence/music-continuity-deployment-20261023.json); temporales retirados, reversión conservada.
- [ ] Conciliar consumidores/autoridad de cola y reemplazar Shoukaku por lavalink-client conforme al maestro 0.15.
- [ ] Completar matriz musical: fin/skip simultáneo, cola manual/autoplay, repeat/shuffle, stop/búsqueda, seek/pausa, reinicio/recuperación y dos guilds; escucha real pendiente.

## 23/10/2026 · auditoría y arreglo de búsquedas

- [x] Combinar cuatro fuentes y respaldo acotado, ampliar identidad Spotify y filtrar versiones/homónimos sin debilitar matching de audio.
- [x] Páginas de diez hasta cincuenta pistas; servicio común prefix/slash/web; selección única con permisos frescos y resolución antes de voz.
- [x] Corregir enfriamiento del audio por consultas fallidas, visto durante verificación; caché estable comprobada.
- [x] Desplegar `ce546e8`; 25 casos temporales, 25 originales, 51 hashes y salud 200. [Evidencia](../docs/platform/evidence/music-search-audit-deployment-20261023.json). Respaldo/reversión conservados y temporales retirados.
- [ ] Recorrido Discord/escucha real; proveedores públicos y expansión acotada no equivalen a discografía completa. Migración/aceptación global P1 permanecen abiertas.

## 23/10/2026 · registro y fachada musical P0/P1 parciales

- [x] Ejecutar cargadores reales offline: 531 prefix, 144 handlers slash, 779 alias y colisiones conciliadas; [evidencia](../docs/platform/evidence/commands-loaded-20261023.json).
- [x] Conciliar el manifest musical con 73 prefix/29 slash e IDs existentes, sin comandos nuevos.
- [x] Unificar cambios de posición prefix/slash con reloj, cancelación y confirmación; letras con proveedor/paginación comunes.
- [x] Verificar paquete publicado 2.11.0 sin instalarlo: CommonJS/integridad y semántica de avance; [consumidores pendientes](../docs/platform/evidence/music-consumers-20261023.json).
- [x] Desplegar `7801061`: 24 casos temporales/25 originales, 64 hashes y salud HTTP 200; respaldo/reversión y tres tests originales conservados, verificadores retirados.
- [ ] Conciliar propietarios de las demás capacidades; el inventario no acredita ejecución de todos los comandos.
- [ ] Migrar accesos SDK restantes, snapshot/cola única y lifecycle a lavalink-client; matriz musical y escucha/dos guilds pendientes.

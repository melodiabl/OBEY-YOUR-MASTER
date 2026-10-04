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

**Checkpoint:** Pipeline preparado: dry-run sin red; aplicación explícita, reutilización/hash, checkpoint atómico, respuesta perdida y preservación de emojis ajenos. Upload real pendiente; no se cargaron emojis.

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

**Archivos previstos:** `handlers/module-registry.js`, `handlers/feature-registration.js`, `handlers/command-registry.js`, `test/module-registry.test.js`.

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

**Checkpoint activo:** Snapshot fresco con alcance structure_only y blueprint versionado/IDs lógicos; borradores privados persistidos con revisión CAS. Modelos de ejecución y portabilidad/configuración completa pendientes. Tarea todavía parcial; ver docs/platform/ARCHITECT.md.

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

**Checkpoint activo:** Diff create/update/move/overwrites con antes/después y drift de origen. Preflight verifica miembros frescos, permisos, jerarquía y grants; límites/capacidades/acceso efectivo/plan de ejecución completos pendientes. Tarea todavía parcial; ver docs/platform/ARCHITECT.md.

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

**Checkpoint activo:** Editor web conectado: árbol/inspector, crear y mover, nombres/colores, undo/redo, protección, preview y guardar/recuperar borrador. Discord consulta la misma propuesta. Wizard, permisos, eventos y apply/progreso durable pendientes. Tarea todavía parcial; ver docs/platform/ARCHITECT.md.

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

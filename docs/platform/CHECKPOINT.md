# Checkpoint activo — implementación en el proyecto principal

Workspace activo: `/home/OBEY-YOUR-MASTER`. Rama: `feature/obey-main-implementation`, basada en `feat/motor-soundy`. El usuario corrigió expresamente la ubicación: continuar aquí, no en `/home/obey-platform-work`. El paquete original `OBEY_Diseno_Completo_Codex` se conserva sin cambios.

## Implementación actual

- Se trasladaron los recursos, controles y letras ya verificados desde la copia de trabajo al proyecto principal: T02–T04 locales y T19 Discord parcial.
- T05 parcial: registry inmutable, manifest musical con inventario de los comandos cargados y referencia al mismo `client.music`. Habilitación por guild, manifests de otros módulos y metadata completa siguen pendientes. Sin segundo servicio/cola/sesión.
- T06/T07 parciales: política común `canManageGuild`, autenticación HTTP común con refresh y respuestas JSON para API; login rota y guarda sesión antes del redirect. `/api/top/tracks`, `/api/top/users`, `/api/top/guilds` y status comprueban permisos actualizados. Ranking de guilds filtra antes de agregar en Mongo. `/api/nowplaying` devuelve cero pistas al público y solo servidores administrables para sesiones válidas. Landing sin modificaciones.
- T12 parcial: mensaje de bienvenida común entre web/slash/evento/previews. Precedencia `welcome.msg` → `welcome.message` → `welcomeMessage`, con nullish para conservar cadena vacía. Nuevos guardados sincronizan las tres claves y esperan `SyncMap.flush`. El dashboard lee el cache canónico y dejó de escribir directamente a Guild antes de repetir writes por SyncMap. No es todavía una migración global, revisión optimista ni transacción; los writers legacy y recuperación de caché tras fallos siguen pendientes.
- T56 adelantada parcialmente: CI para PR hacia la base, instalación desde lock, tests, validación de assets/schemas y build Docker sin arrancar servicios. Actions fijadas por SHA, permisos read-only y credenciales no persistidas. Ejecución GitHub/Docker aún pendiente.

## Referencias técnicas

- [Express session: regeneración y guardado](https://expressjs.com/en/resources/middleware/session/).
- [Permisos Discord](https://docs.discord.com/developers/topics/permissions).
- [Compilación Canvas 2.11.2](https://github.com/Automattic/node-canvas/tree/v2.11.2#compiling).
- [checkout v4](https://github.com/actions/checkout/tree/v4) y [setup-node v4](https://github.com/actions/setup-node/tree/v4), SHAs consultados el 2026-10-04.

- T15 musical parcial: sesión recargada desde el store antes de enviar, permisos Discord con TTL de 15 s por socket y timeout de 5 s, rooms `guild:<id>:music`, logout desconecta pestañas de la sesión en el proceso actual. Pérdida de permisos/error del proveedor revoca la suscripción al siguiente envío; sesión eliminada/expirada desconecta. En idle no se promete detección activa sin eventos. Snapshots actuales al reconectar y envíos pendientes agrupados evitan acumulación. El socket no renueva ni guarda tokens; la renovación sigue siendo HTTP. Multi-proceso y heartbeat de revocación pendientes.

## Evidencia local

- `npm test`: 125 pruebas pasan en 31 archivos, 0 fallos, Node 22.23.2. Resultado del runner TAP actual: 125 tests, 0 fallos.
- `node --test test/module-registry.test.js`: registro real de música, mismo estado y 25 subcomandos musicales/19 raíces, sin publicación.
- `node --test test/dashboard-auth.test.js test/music-api-access.test.js`: sesiones inválidas/expiradas, refresh fallido, rotación/storage, denegaciones por guild y consulta inválida antes de DB.
- `node --test test/music-realtime.test.js`: 7 pruebas; Socket.IO real local con dos pestañas, reconexión/revisión actual, sesión eliminada, no filtración. Pruebas deterministas para permisos perdidos, proveedor caído, eventos agrupados y cancelación pendiente.
- Chromium música: EJS real, estados de transporte simulados, acceso/verificación/denegación/desconexión y rechazo cross-guild; 0 errores JavaScript, desktop/mobile. Evidencia `evidence/music-realtime-browser.json`.
- `node --test test/welcome-config.test.js`: precedencia, aislamiento de dos guilds, persistencia de aliases y rechazo por fallo de DB.
- `node scripts/obey-assets.js`: 89 PNG válidos, dry run sin red/upload.
- `node scripts/validate-commands.js`: carga/schema local, sin Gateway/REST.
- `git diff --check`: implementación limpia.
- Primera instalación limpia falló: Canvas 2.11.2 sin binario Node 22 y `pkg-config` ausente. Se añadieron requisitos nativos a CI/Docker y al entorno local autorizado; repetición de `npm ci` aislado completada (588 paquetes). Suite completa pasa también en esa instalación; lockfile sin cambios. Imagen `localhost/obey-platform-check` compilada con Podman, sin ejecutar bot ni servicios.
- Chromium aislado: plantilla EJS real con fixtures en escritorio 1120 y móvil 390, valor Unicode/HTML conservado en textarea y 0 errores JavaScript. Evidencia `evidence/welcome-settings-browser.json` y capturas `welcome-settings-*.png`. No es prueba de OAuth/Mongo/Discord. Chrome DevTools no arrancó como root; Playwright necesitó ejecución fuera del sandbox por bloqueo de Chromium.

## Continuación ejecutable

1. Completar T05 con manifests por dominio y habilitación persistida; no mostrar toggles sin enforcement.
2. Completar T06 RBAC compartido por acción/recurso, integración de controles Discord y web y restricciones reales de Discord.
3. T07/T15: completar concurrencia/refresh OAuth, realtime de otros módulos y transporte entre procesos. La música ya revalida la sesión y usa permisos con TTL de 15 s; no declarar cerrada seguridad transversal.
4. T12: servicio de configuración con revisiones, migraciones explícitas, atomicidad acorde a Mongo y recuperación de cache tras fallo. Migrar writers legacy sin borrar sus defaults.
5. T19 web: mismo proveedor/sesión, HTTP inicial, realtime, lyrics y reconexión.
6. T23–T34: jobs/snapshot/diff/Architect/backups/themes/templates; conectar módulos según disponibilidad real. Conservar T35–T57 y todos los requisitos centrales.

No se ha iniciado bot/Compose, publicado comandos, cargado emojis, usado sesiones/DB de producción, aplicado cambios a guilds ni desplegado. Plataforma y fases completas siguen pendientes.

Contrato de integración: se conservan `join`, `leave`, `player:state`, `player:tick`, `player:error`; ticks añaden guild/session/revision sin retirar campos. No hay emisiones directas que eviten la autorización. Referencias oficiales: [sesiones de Express con Socket.IO](https://socket.io/how-to/use-with-express-session) y [rooms](https://socket.io/docs/v4/rooms/).

---

## Historial de la copia de trabajo anterior

El texto siguiente documenta la entrega previa. Sus rutas/PR describen ese checkpoint histórico; no gobiernan el workspace activo.

# Checkpoint ejecutable de OBEY

Fecha: 2026-10-04. Base confirmada local y en GitHub: `feat/motor-soundy` / `b8bee2d657d5194b3febcbf96de06764e532b17b`. Rama de trabajo: `feature/obey-platform-foundations`; worktree `/home/obey-platform-work`. El checkout original `/home/OBEY-YOUR-MASTER` conserva su estado inicial y el paquete sin versionar. No hubo merge, deploy, login del bot, cambios en guilds, restauración ni upload de emojis.

PR en borrador: [#2 — Integra recursos OBEY y corrige letras completas de Discord](https://github.com/melodiabl/OBEY-YOUR-MASTER/pull/2), hacia `feat/motor-soundy`.

## Entregado

- Auditoría estática completa del alcance y fuentes: `AUDIT.md`, 148 bloques/29 secciones del maestro en `requirements.json` e inventario por comando. Los siete antecedentes quedan conservados íntegros en git. La matriz mantiene los requisitos aún no implementados.
- Asset Registry y recursos aprobados dentro de `assets/obey`; validación de los 89 PNG, mapa semántico, IDs reales solo desde pipeline y fallback Unicode. Pipeline sin red por defecto, nombres/hash reutilizables, checkpoint atómico y reconciliación de respuesta perdida. Pendiente ejecutarlo con credenciales de aplicación y verificar Discord.
- Doce controles activos y vacíos con etiquetas/estados compartidos; preserve custom IDs y flujo activo `embeds.js`/`index.js`/`liveupdate.js`. No se renderiza el progreso en una imagen por tick.
- Letras completas desde slash y botón real: navegación, propietario/guild/mensaje, caducidad, Unicode, serialización y dedup. Proveedor/cache compartido; guards para lookup, envío tardío, replay, sesión, cancelación y consultas simultáneas. Transporte acotado sin cambiar engine.
- Preview reproducible del builder (`scripts/preview-music-controls.js`); capturas escritorio y móvil en `evidence/`. Es una aproximación offline de Discord con fixtures, no una prueba del cliente Discord ni una interfaz web nueva.

T01 completa estáticamente; T02–T04 implementadas localmente y con pendientes de aceptación real; T19 parcial: Discord probado offline, web/realtime aún pendiente. Fase 1, fase 3 y plataforma NO completas.

## Evidencia

`npm test`: **25 archivos de tests pasan, 0 fallos**, Node 22.23.2. Node resume workers por archivo en este entorno; no interpretar 25 como número de asserts. Nuevas regresiones: 8 de assets/controles y 27 de letras/transporte/flujos. Las primeras pruebas fallaron antes de los fixes; reproducción independiente del karaoke halló y protegió carreras adicionales.

```sh
npm test
node scripts/obey-assets.js
node --test test/obey-assets.test.js test/setup-panel.test.js
node --test test/lyrics-pagination.test.js test/lyrics-command.test.js test/lyrics-live-lookup.test.js test/lyrics-http.test.js
node scripts/preview-music-controls.js
# Abrir /tmp/obey-music-preview.html en un navegador aislado.
git diff --check feat/motor-soundy -- . ':(exclude)OBEY_Diseno_Completo_Codex'
```

Validación PNG: 89/89, 128×128, máximo 29.560 bytes, decodificación real. Capturas con Chromium aislado/Playwright local 1.62.0: 5 estados/60 botones, etiquetas visibles, cero errores de consola y cero overflow a 1120 y 390 px. La configuración Chrome DevTools disponible falla arrancando como root; se utilizó Playwright instalado localmente, sin cambiar configuración MCP. Fuente emoji [Noto Color Emoji](https://github.com/googlefonts/noto-emoji/tree/main/2D) solo en `/tmp` para render de evidencia; opcional `OBEY_PREVIEW_EMOJI_FONT` al generar HTML. No es dependencia del bot.

Syntax checks pasan para JS modificado y nuevo. No hay comando build/lint declarado en package.json; build Docker pendiente. Dependencias instaladas se reutilizaron sin alterar el checkout original; algunas difieren del lock (AUDIT documenta versiones). Repetir en instalación limpia del lock/CI antes de aceptar release. No se afirma prueba real de Gateway, OAuth, Mongo, Redis, workers, proveedores musicales o Discord.

Los documentos de entrada conservan sus whitespace originales por fidelidad; el diff check de implementación excluye esa carpeta fuente. No se silenciaron reglas, omitieron tests ni debilitaron validadores del runtime. Los recursos/gráficos originales de propuesta permanecen en el paquete local; los recursos aprobados del runtime y textos/contratos/helpers están versionados. El original `VALIDATION.json` describe la entrega de diseño, no estas pruebas nuevas.

## Siguiente tarea concreta

**T05: manifest incremental de music**, a partir de los servicios reales que ya existen, sin mover todo el proyecto ni publicar comandos nuevos. Registrar ID/versión, defaults, permisos/actions, comandos/interacciones, eventos, jobs/rutas/realtime existentes y dependencias; capacidades faltantes se declaran unavailable/pending, nunca funcionales por nombre. Verificar que los handlers actuales siguen delegando en la misma sesión/cola, con tests de manifest y command schemas.

Después **T06/T07**: extraer autorización común por guild/acción y cerrar exposición pública de pistas por guild (`/api/nowplaying`, endpoints top) conforme a visibilidad del producto. Revalidar permisos de sockets, revocar rooms y mantener API/sesión/CSRF consistentes. Construir tests de usuario sin permiso antes de conectar rutas nuevas. No alterar landing ni usar sesiones reales como fixtures.

**T12** debe resolver `welcome.message`/`welcome.msg` y writes web directos antes de un renderer común T18: precedencia/migración explícitas y tests guardado/lectura entre dos guilds. **T19 web** continúa explícitamente pendiente: estado inicial, realtime/lyrics, reconexión y UI conectadas al mismo proveedor/sesión. No quitarlo de matriz por haber corregido Discord.

Jobs/Architect/backups/templates/IA/tickets/security/community/automations/dashboard/analytics siguen en T23–T57 con sus dependencias y aceptación en `tasks/todo.md`. Completar todo lo independiente de credenciales; las operaciones reales sobre servidores requieren el canary autorizado señalado por el maestro.

## Integraciones y acceso

GitHub accesible para rama/PR. No se leyeron credenciales de producción ni se utilizaron sus sesiones/DB. Carga de emojis preparada, no ejecutada; modo IA/feeds/workers todavía por desarrollar, no conectados. Conservar los tokens en entorno y los mapas operativos fuera de git según ASSETS.md.

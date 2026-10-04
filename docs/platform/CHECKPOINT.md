# Checkpoint ejecutable de OBEY

Fecha: 2026-10-04. Base confirmada local y en GitHub: `feat/motor-soundy` / `b8bee2d657d5194b3febcbf96de06764e532b17b`. Rama de trabajo: `feature/obey-platform-foundations`; worktree `/home/obey-platform-work`. El checkout original `/home/OBEY-YOUR-MASTER` conserva su estado inicial y el paquete sin versionar. No hubo merge, deploy, login del bot, cambios en guilds, restauración ni upload de emojis.

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

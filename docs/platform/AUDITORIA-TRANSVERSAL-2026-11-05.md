# OBEY — Auditoría transversal por superficie (05/11/2026)

**Alcance real:** revisión del árbol de la rama feature/obey-main-implementation, package.json, configuración Next, arquitectura, inventarios y rutas representativas, con profundización del catálogo musical. El árbol consultado tenía **4742 entradas**, muchas de ellas recursos, documentación y archivos no ejecutables. **Esto NO es una auditoría línea por línea de todo el proyecto, ni pentest, ni prueba en Discord o Spotify en vivo.**

## Estado encontrado y brechas

| Área | Código / documentación | Estado comprobable | Auditoría siguiente |
|---|---|---|---|
| Entradas Discord | commands/, slashCommands/, handlers, docs/platform/operation-ownership.json | Inventario/alias/versiones auditados anteriormente; no equivale a comportamiento aceptado | E2E en guilds con permisos y canales diferentes, por intención |
| Música / voz | handlers/music/, bot/modulos/musica/, NyxLink | Migración NyxLink real, consumidores mixtos, Spotify/artist/album frágiles | Auditoría profunda CAT y P1; nodo y audio real |
| Builder | handlers/architect/, dashboard/architect-routes.js, guía Builder | Existe servicio y rutas Architect; Builder / Constructor es el nombre objetivo | Diff, permisos, preview y restauración; compatibilidad de nombres y datos |
| Bienvenida / configuración | dashboard/welcome-routes.js, frontend welcome-editor, docs/platform/FRONTEND-NEXT.md | Editor y control de revisiones con avances; aún hay rutas EJS | Pruebas de drafts/revocation/CAS en dos guilds |
| Tickets | fichas de módulos, entradas de comandos | Inventario existe; paridad funcional no aceptada aquí | Formularios, turnos, transcripciones, borrado, roles |
| Moderación, seguridad y logs | fichas, handlers, dashboard/logs-routes.js | Módulos y reglas existentes; no verificados totalmente | Expiración, límites, actor, auditoría, permisos y fallos |
| Comunidad / perfiles | 32 fichas, comandos y datos | Algunas capacidades propuestas no equivalen a sistema activo | Cuotas, persistencia, permisos, privacidad, pruebas multi-guild |
| Panel WEB | dashboard/frontend (Next16/React19/TS), dashboard/views (EJS) | El panel React usa exportación estática; servidor Express y EJS conviven | Migrar pantalla por recorrido, colores y landing intactos |
| API y auth | dashboard/index.js, *-routes.js y api/rutas/musica/http.js | Express, sesión OAuth, CSRF y Socket.IO vigentes; Fastify no implementado | Inventario de rutas/roles/status/headers y paridad antes de cambiar |
| Datos/operación | Mongoose, Redis/BullMQ, CI Docker | Hay inventario y checks; acceptance del runtime depende de pruebas de esa fecha | Backups, retries, locks, límites y rollback por módulo |
| Assets/i18n | assets/obey, handlers/assets/registry, guías ES/EN | Materiales aprobados existentes | Solo verificar carga/fallback; NO rediseñar ni editar assets |

## Dependencias: situación real y disciplina

El manifiesto del bot ya usa nyxlink 0.1.0-dev.2, discord.js, mongoose, bullmq, socket.io, zod y varios clientes HTTP; la web usa Next 16, React 19 y TypeScript. Shoukaku fue eliminado del manifiesto actual. Fastify, Motion, React Query, React Flow y DnD son **candidatos**, no dependencias que esta auditoría instale.

Una dependencia nueva debe justificar: feature/consumidor concreto, compatibilidad Node, licencia, mantenimiento, seguridad, tamaño y prueba de sustitución. Primero localizar duplicaciones actuales de HTTP, renderizadores Canvas, cron/jobs y Express/EJS. Mantener lockfiles.

## Riesgos estructurales

- Código de negocio musical compartido entre rutas legacy y bot/modulos, con múltiples interfaces públicas y tratamiento desigual de errores.
- Test mocks que validan contratos esperados pero no compatibilidad con plugins de un nodo público concreto.
- Comandos que confirman éxito por intentar una acción, no por ACK del backend.
- SSR o API Next no disponibles en el modo de exportación estática actual; no mover sesiones a un segundo proceso sin probar seguridad.
- Acceso por servidor, reautorización y datos entre guilds deben mantenerse al separar bot/API/web.
- Las 32 fichas son mapa de alcance; no crear carpetas vacías ni prometer completar todos los módulos sin acceptance.

## Orden de auditorías funcionales siguientes

1. P1 Música: pista/álbum/artista/Spotify, botones, fuentes, cola y voz.
2. Builder, permisos y protección de datos antes de aplicar estructuras.
3. Tickets, moderación, logs, bienvenida y configuración con tres roles y dos servidores.
4. Panel y API: navegación, rutas, Auth/CSRF/Socket.IO, 401/403/409 y estados de red.
5. Comunidad, economía, colecciones, eventos y automatizaciones con aceptación por uso real.
6. CI, seguridad, escalado y proceso de lanzamiento gradual.

Las matrices y criterios están en PLAN-RENOVACION-2026-11-05.md. No usar este documento como señal de que las seis áreas fueron comprobadas en vivo.

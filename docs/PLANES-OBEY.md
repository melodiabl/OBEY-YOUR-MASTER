# Planes de OBEY · índice para revisión

Actualizado el 28/10/2026. Este índice reúne los documentos existentes; no declara completadas las funciones pendientes.

## Qué documento manda

1. [Orden activo y decisiones del usuario](../tasks/plan.md#orden-activo--23102026): P0 → P1 → P2 → P4 → P5 → P6, con P3 durante cada etapa. El 28/10 se añadió la petición de mejorar panel y `/help` después de P1.
2. [Plan maestro ejecutable de 32 funciones](guia-arquitectura/investigacion-20261022/08_PLAN_DE_EJECUCION.md): alcance, puertas de salida y casos que bloquean la entrega.
3. [Tareas y checkpoints](../tasks/todo.md): trabajo desglosado, casillas y evidencia por entrega.
4. [Plan técnico por etapas](guia-arquitectura/PLAN_POR_ETAPAS.md): tareas ARCH/MOD, dependencias y criterios de aceptación. La [conciliación 0.15](guia-arquitectura/CONCILIACION_2026-10-23.md) fija cómo se integra con el orden vigente.

La [fuente consolidada](platform/source.json) registra 32 funciones, 140 tareas base y 128 casos de aceptación escritos. Esas cifras describen el alcance del material, no un porcentaje de código terminado.

## Estado y próximo resultado

| Etapa | Estado | Resultado exigido |
| --- | --- | --- |
| P0 · base e inventario | Activa | Conciliar autoridades, comandos, rutas, alias, G01/G02 y evidencia de aceptación. [Estado](platform/CHECKPOINT.md) y [clasificación pendiente](platform/P0-TRIAGE-2026-10-28.md). |
| P1 · música | Parcial | Una cola y un cliente Lavalink, transiciones y recuperación comprobadas. [Ficha Music](guia-arquitectura/modulos/music.md), [auditoría](platform/MUSIC-AUDIT-2026-10-24.md). |
| P2 · configuración y gestión | Parcial | Recorridos de setups, bienvenida, tickets, moderación y logs en dos servidores y con permisos distintos. [Setups](guia-arquitectura/REMODELACION_SETUPS.md). |
| P3 · recursos e idiomas | Transversal | Materiales aprobados, IDs reales, fallback e idiomas por recorrido. [Índice de materiales](guia-arquitectura/sistema/00_INDICE.md). |
| P4 · votos y premium | Pendiente | Contratos, deduplicación, derechos y sandbox sin venta pública automática. [Maestro](guia-arquitectura/investigacion-20261022/08_PLAN_DE_EJECUCION.md). |
| P5 · escalado y recuperación | Pendiente | Drain/takeover, caída de proceso y restauración comprobada. [Diseño de VPS](guia-arquitectura/investigacion-20261022/05_ESCALADO_Y_VPS.md). |
| P6 · ampliaciones | Pendiente | Comunidad, colecciones y automatización con cuotas, privacidad y aceptación por función. [Maestro](guia-arquitectura/investigacion-20261022/08_PLAN_DE_EJECUCION.md). |

## Panel, ayuda, setups y materiales

- [Migración del panel a Next.js/React/TypeScript](platform/FRONTEND-NEXT.md): pantallas ya migradas y recorridos que faltan. El reproductor completo depende de P1.
- [Ayuda contextual existente](platform/HELP.md): catálogo, permisos y superficies Discord/web ya conectadas; la mejora visual solicitada queda pendiente.
- [Facilidad de uso de los setups](guia-arquitectura/FACILIDAD_SETUP.md) y [remodelación del código y menús](guia-arquitectura/REMODELACION_SETUPS.md).
- [Sistema y recursos aprobados](guia-arquitectura/sistema/00_INDICE.md), [integración de materiales](platform/REMODELACION.md) y [propuestas visuales nuevas](guia-arquitectura/investigacion-20261022/09_MATERIALES_NUEVOS.md). Las propuestas necesitan revisión e ID real antes de publicarse.
- [Adopción tecnológica gradual](guia-arquitectura/tecnologia/06_PLAN_DE_ADOPCION.md) y [prioridades de experiencia](guia-arquitectura/investigacion-20261022/10_FRICCIONES_Y_PRIORIDADES.md).

## Fichas de las 32 funciones

**Música y comunidad:** [Music](guia-arquitectura/modulos/music.md), [Voice](guia-arquitectura/modulos/voice.md), [Welcome](guia-arquitectura/modulos/welcome.md), [Cards](guia-arquitectura/modulos/cards.md), [Levels](guia-arquitectura/modulos/levels.md), [Roles](guia-arquitectura/modulos/roles.md), [Profiles](guia-arquitectura/modulos/profiles.md), [Fun](guia-arquitectura/modulos/fun.md).

**Gestión y seguridad:** [Tickets](guia-arquitectura/modulos/tickets.md), [Logs](guia-arquitectura/modulos/logs.md), [Moderation](guia-arquitectura/modulos/moderation.md), [Automod](guia-arquitectura/modulos/automod.md), [Security](guia-arquitectura/modulos/security.md), [Verification](guia-arquitectura/modulos/verification.md), [Applications](guia-arquitectura/modulos/applications.md), [Architect](guia-arquitectura/modulos/architect.md).

**Contenido y participación:** [Collections](guia-arquitectura/modulos/collections.md), [Economy](guia-arquitectura/modulos/economy.md), [Giveaways](guia-arquitectura/modulos/giveaways.md), [Feeds](guia-arquitectura/modulos/feeds.md), [Messages](guia-arquitectura/modulos/messages.md), [Suggestions](guia-arquitectura/modulos/suggestions.md), [Events](guia-arquitectura/modulos/events.md), [Reminders](guia-arquitectura/modulos/reminders.md).

**Plataforma y ampliaciones:** [Templates](guia-arquitectura/modulos/templates.md), [Migrations](guia-arquitectura/modulos/migrations.md), [Automation](guia-arquitectura/modulos/automation.md), [Analytics](guia-arquitectura/modulos/analytics.md), [Starboard](guia-arquitectura/modulos/starboard.md), [Sticky](guia-arquitectura/modulos/sticky.md), [Decoration](guia-arquitectura/modulos/decoration.md), [Utilities y ayuda](guia-arquitectura/modulos/utilities.md).

Los informes de entregas anteriores permanecen en [Checkpoint](platform/CHECKPOINT.md) y [Handoff](platform/HANDOFF.md); describen su fecha y no sustituyen este orden activo.

# Plan por etapas

Los IDs expresan dependencias técnicas, no fechas prometidas ni permiso de despliegue. Cada tarea debe cerrar una diferencia concreta y mantener estado/evidencia.

Checkpoint 19/10/2026: los 63 menús de setups ya remodelados no completan los consumidores de las 32 capacidades/140 tareas base de la fuente. [Registros y avisos owner](REGISTROS_Y_AVISOS_OWNER.md) implementados y desplegados en `621366a`; ajustes comunes Discord/web y entrega con privacidad verificados. T38/MOD-LOGS siguen parciales: historial/retención y recuperación durable son la siguiente entrega; continúan pendientes los demás consumidores y tareas transversales. [Runtime y evidencia](../platform/DESPLIEGUE-REGISTROS-OWNER-2026-10-19.md).

## ARCH 01 Fijar la base de trabajo

- [x] Base local/remota conciliada el 18/10/2026
- Evidencia: [conciliación de la entrega](CONCILIACION_2026-10-18.md).
- Commit de cierre: `a05036a` (guía/base); actualización de la revisión incluida con el checkpoint del piloto.

Dependencias: ninguna.

Aceptación: SHA remoto y cambios locales identificados; preservar código actual y exclusiones; ninguna importación automática del ZIP o commit local rechazado.

## ARCH 02 Inventariar entradas y propietarios

- [ ] Inventario del piloto de bienvenida completado; inventario exhaustivo de otras capacidades pendiente.
- Evidencia local: Entradas, loaders, escritor, caché, recursos y límites en PILOTO_BIENVENIDA.md.
- Commit del incremento: `3d63780c30da9fab6546d899af21fc2c072d3016`; no equivale a cierre global de la tarea.

Dependencias: ARCH-01.

Aceptación: Por capacidad: prefix/slash/customId/evento/ruta/job, servicio real, store, recursos e i18n; marcar evidencia estática y comportamiento pendiente.

## ARCH 03 Fijar límites y decisiones

- [ ] Límite del piloto implementado y comprobado localmente; decisiones y límites del resto pendientes.
- Evidencia local: Factory sin cliente global, puertos explícitos y AST de imports del piloto en PILOTO_BIENVENIDA.md.
- Commit del incremento: `3d63780c30da9fab6546d899af21fc2c072d3016`; no equivale a cierre global de la tarea.

Dependencias: ARCH-02.

Aceptación: API pública por módulo, imports permitidos, fuente de verdad y decisiones CommonJS/EJS/Mongo registradas; nuevas funciones fuera del alcance.

## ARCH 04 Separar composición y ciclo de vida

- [ ] Drenaje de configuración de bienvenida implementado localmente; composición/ciclo global pendiente.
- Evidencia: [incremento TECH-05](CICLO_DE_VIDA_BIENVENIDA.md), cierre normal, errores y deadline comprobados en aislamiento.
- Commit del incremento: `0771a47953a17cbac9f4d853554fd0ecb274d45f`; no cierra la tarea global.

Dependencias: ARCH-03.

Aceptación: Orden de ready/dbReady identificado; fallos de núcleo/opcionales definidos; cierre de productores, flush y conexiones; política probada antes de cambiar login.

## ARCH 05 Definir contratos y autorización

- [ ] Contratos y política compartidos para canal/mensaje de bienvenida; resto de operaciones pendiente.
- Evidencia local: Zod, JSDoc, contexto del servidor, revalidación, CAS e idempotencia existentes; PILOTO_BIENVENIDA.md.
- Commit del incremento: `3d63780c30da9fab6546d899af21fc2c072d3016`; no equivale a cierre global de la tarea.

Dependencias: ARCH-03.

Aceptación: Entradas allowlist, actor de sesión, guild/recurso, permisos dinámicos, resultado tipado, idempotencia y DTO por audiencia.

## ARCH 06 Pilotar configuración de bienvenida

- [ ] Servicio, adaptadores y formulario declarativo del piloto conectados; recorrido real OAuth/Discord pendiente.
- Evidencia local: 15 escenarios Mongo, 16 peticiones HTTP, slash simulado y paridad de validación; PILOTO_BIENVENIDA.md.
- Commit del incremento: `3d63780c30da9fab6546d899af21fc2c072d3016`; no equivale a cierre global de la tarea.

Dependencias: ARCH-05.

Aceptación: Preservar servicio actual y borrador/preview/publicación; demostrar paridad de entrada sin reemplazar tarjeta o renderer; mappings reales registrados.

## ARCH 07 Definir persistencia y migraciones

- [ ] Estado pendiente de ejecución
- Evidencia de cierre por completar
- Commit de cierre por completar

Dependencias: ARCH-05.

Aceptación: Propietarios por entidad, revisiones e índices, mapping legacy, política de integridad multi-documento y efectos externos, rollback compatible.

## ARCH 08 Migrar adaptadores por capacidad

- [ ] Estado pendiente de ejecución
- Evidencia de cierre por completar
- Commit de cierre por completar

Dependencias: ARCH-06, ARCH-07.

Aceptación: Una misma operación desde las superficies existentes; listeners y aliases sin duplicación; diferencias deliberadas documentadas.

## ARCH 09 Consolidar trabajos y recuperación

- [ ] Estado pendiente de ejecución
- Evidencia de cierre por completar
- Commit de cierre por completar

Dependencias: ARCH-04, ARCH-07.

Aceptación: Reutilizar jobs actuales; generación, cancelación, reintentos, recibos y conciliación por handler; no reactivar efectos sin autorización.

## ARCH 10 Unificar presentación e interfaz

- [ ] Formulario de bienvenida implementado y probado localmente; resto de presentación e interfaces pendiente.
- Evidencia: [TECH-04](FORMULARIO_BIENVENIDA.md), 12 escenarios de navegador y cuatro anchos.
- Commit del incremento: `c627d2f3a3ed5a6da76c65e58cb67739a13f7589`; no cierra la tarea global.

Dependencias: ARCH-08.

Aceptación: Catálogos y variables es/en, assets existentes/fallback, estados y cambios pendientes del panel, DTO sin datos indebidos.

## ARCH 11 Preparar operación y despliegue

- [ ] Estado pendiente de ejecución
- Evidencia de cierre por completar
- Commit de cierre por completar

Dependencias: ARCH-04, ARCH-09.

Aceptación: Versión Node/lockfile/imagen/CI coherentes, configuración privada externa, readiness y logs redactados, rollback y smoke aislado definidos.

## ARCH 12 Cerrar cada capacidad con evidencia

- [ ] Estado pendiente de ejecución
- Evidencia de cierre por completar
- Commit de cierre por completar

Dependencias: ARCH-10, ARCH-11.

Aceptación: Resultados y límites por caso y SHA; compatibilidad retirada solo sin consumidores; publicación y despliegue separados de la documentación.

## Tareas por módulo

- `MOD-MUSIC` — music — audit_before_migration — ficha `modulos/music.md`.
- `MOD-WELCOME` — welcome — audit_before_migration — ficha `modulos/welcome.md`.
- `MOD-VERIFICATION` — verification — deferred_no_confirmed_domain — ficha `modulos/verification.md`.
- `MOD-ROLES` — roles — audit_before_migration — ficha `modulos/roles.md`.
- `MOD-MODERATION` — moderation — audit_before_migration — ficha `modulos/moderation.md`.
- `MOD-LOGS` — logs — audit_before_migration — ficha `modulos/logs.md`.
- `MOD-SECURITY` — security — audit_before_migration — ficha `modulos/security.md`.
- `MOD-AUTOMOD` — automod — audit_before_migration — ficha `modulos/automod.md`.
- `MOD-LEVELS` — levels — audit_before_migration — ficha `modulos/levels.md`.
- `MOD-PROFILES` — profiles — audit_before_migration — ficha `modulos/profiles.md`.
- `MOD-VOICE` — voice — audit_before_migration — ficha `modulos/voice.md`.
- `MOD-EVENTS` — events — deferred_no_confirmed_domain — ficha `modulos/events.md`.
- `MOD-GIVEAWAYS` — giveaways — audit_before_migration — ficha `modulos/giveaways.md`.
- `MOD-SUGGESTIONS` — suggestions — audit_before_migration — ficha `modulos/suggestions.md`.
- `MOD-STARBOARD` — starboard — deferred_no_confirmed_domain — ficha `modulos/starboard.md`.
- `MOD-REMINDERS` — reminders — audit_before_migration — ficha `modulos/reminders.md`.
- `MOD-MESSAGES` — messages — audit_before_migration — ficha `modulos/messages.md`.
- `MOD-CARDS` — cards — audit_before_migration — ficha `modulos/cards.md`.
- `MOD-AUTOMATION` — automation — audit_before_migration — ficha `modulos/automation.md`.
- `MOD-FEEDS` — feeds — audit_before_migration — ficha `modulos/feeds.md`.
- `MOD-ANALYTICS` — analytics — audit_before_migration — ficha `modulos/analytics.md`.
- `MOD-UTILITIES` — utilities — audit_before_migration — ficha `modulos/utilities.md`.
- `MOD-FUN` — fun — audit_before_migration — ficha `modulos/fun.md`.
- `MOD-ARCHITECT` — architect — audit_before_migration — ficha `modulos/architect.md`.
- `MOD-DECORATION` — decoration — audit_before_migration — ficha `modulos/decoration.md`.
- `MOD-TEMPLATES` — templates — audit_before_migration — ficha `modulos/templates.md`.
- `MOD-COLLECTIONS` — collections — deferred_no_confirmed_domain — ficha `modulos/collections.md`.
- `MOD-APPLICATIONS` — applications — audit_before_migration — ficha `modulos/applications.md`.
- `MOD-STICKY` — sticky — audit_before_migration — ficha `modulos/sticky.md`.
- `MOD-MIGRATIONS` — migrations — audit_before_migration — ficha `modulos/migrations.md`.
- `MOD-TICKETS` — tickets — audit_before_migration — ficha `modulos/tickets.md`.
- `MOD-ECONOMY` — economy — audit_before_migration — ficha `modulos/economy.md`.

## Criterio para marcar completado

No marcar una tarea por existir el documento o la carpeta. Adjuntar capacidad, SHA, operación, permisos, persistencia, escenarios probados, diferencias entre superficies, límites y rollback. Si está bloqueada, mantener el estado pendiente y escribir dependencia y motivo. Las comprobaciones documentales de este paquete no cierran ninguna tarea de implementación.

## Adopción tecnológica complementaria

Leer [TECH-01 a TECH-08](tecnologia/06_PLAN_DE_ADOPCION.md). Son incrementos ligados a los ARCH existentes; consultar el avance local al final del plan de adopción para distinguir el piloto implementado del alcance pendiente. La conciliación estática ampliada está en [base real](tecnologia/08_BASE_REAL_Y_DIFERENCIAS.md); no se usa para cerrar pruebas conectadas o aceptar automáticamente el refactor local.

## Último incremento local · TECH-04

Formulario de canal/mensaje de bienvenida derivado del contrato, traducciones es/en, errores por campo y limpieza ante revocación. Commit `c627d2f3a3ed5a6da76c65e58cb67739a13f7589`. [Evidencia y límites](FORMULARIO_BIENVENIDA.md). El drenaje de configuración TECH-05 se implementó después en el incremento indicado a continuación. TECH-06, ciclo de vida global y recorridos reales de producción pendientes; no se habilitan otros dominios.

## Último incremento local · TECH-05 parcial

Drenaje idempotente de las siete operaciones del servicio de configuración de bienvenida, cierre de admisión y hook anterior al flush de Mongo. Commit `0771a47953a17cbac9f4d853554fd0ecb274d45f`. [Evidencia y límites](CICLO_DE_VIDA_BIENVENIDA.md). ARCH-04 y TECH-05 globales continúan abiertos; TECH-06 y OAuth/Gateway reales pendientes. Sin publicación remota o despliegue.

## Último incremento local · TECH-06 parcial

Entrada pública explícita de configuración de bienvenida y reglas de imports/tipos en CI en `ddc4ec433252fefc68ce41e10329a7a64e47a80f`. [API, OpenAPI y evidencia](API_BIENVENIDA.md): cinco rutas existentes, 20 respuestas HTTP/Mongo aisladas y diez mutaciones de dependencias verificadas. TECH-05/ARCH-04 globales y resto de contratos/API legacy siguen abiertos. TECH-07 requiere conciliar una segunda capacidad; no se migra automáticamente todo welcome. Sin publicación remota o despliegue.

## Continuación priorizada por el usuario · setups

Se extiende el plan existente con [63 comandos de setup](REMODELACION_SETUPS.md), código y menús de Discord juntos. Primera entrega local: navegación `setup` en `eadc547b0684ded2c9cca65cc685362c518ab660`, con registro vivo, permisos y sesiones acotadas. Las tareas por comando están en [tasks/todo](../../tasks/todo.md). No cierra TECH-07 ni una migración completa de los otros dominios; conserva los pendientes globales anteriores. Siguiente: setup-language.

Segunda entrada de setups remodelada localmente: [setup-language](IDIOMA_SETUP.md), `f4163778677b3b893bde2308c1a328e8d24111e5`. Código y menú juntos; 21 escenarios/100 ciclos SDK/25 originales. Siguiente setup-embed; los otros dominios del plan y TECH-05 global continúan abiertos.

## Continuación priorizada · facilidad de uso de setups

Los 63 adaptadores de setups se desplegaron en `f4acfac` el 18/10/2026. Tras la revisión del usuario, [la mejora de uso](FACILIDAD_SETUP.md) continúa ARCH-10 con una entrada `!setup`, nombres comprensibles, navegación en el mismo mensaje, regreso y rutas básicas. No cierra ARCH-10 global ni TECH-07/08; las tareas de datos, ciclo de vida y otros dominios conservan su estado.

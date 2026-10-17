# Adopción gradual de tecnologías

La tabla conserva el alcance de diseño; consultar el avance local al final antes de elegir la siguiente tarea. La investigación documental no cierra ARCH-03/05/06 ni demuestra que las tecnologías estén instaladas. Estos IDs complementan el plan original; no duplican las tareas de módulos.

| ID | Dependencias | Entrega concreta | Aceptación |
| --- | --- | --- | --- |
| TECH-01 | ARCH-01, ARCH-02 | Conciliación técnica, Node/lockfile y ficha de bienvenida con entradas reales | Rama confirmada, diff de paquete separado, consumidores identificados y ámbito acordado |
| TECH-02 | TECH-01, ARCH-03 | Puerto, contrato y contexto de la operación piloto; TypeScript para JS seleccionado y Zod fijado | Entradas válidas/inválidas, tipos y compatibilidad legacy demostrados sin cambiar todo el proyecto |
| TECH-03 | TECH-02, ARCH-05 | Una operación canónica de publicación reutilizando CAS y escritor actuales | Misma autorización, persistencia y resultado desde adaptadores incluidos; concurrencia comprobada |
| TECH-04 | TECH-03, ARCH-06 | Descriptor UI, componentes EJS y preview/diff del piloto | Borrador no activa; conflicto conserva cambios; permisos revocados bloquean publicación |
| TECH-05 | TECH-03, ARCH-04 | Scope de recursos y ciclo de vida del módulo migrado | Sin listeners duplicados; cierre idempotente; desactivación por guild con política explícita |
| TECH-06 | TECH-04, TECH-05 | Reglas de imports, API documentada y evidencia del piloto | No hay acceso nuevo a internos ajenos; DTO y rutas coinciden con contrato |
| TECH-07 | TECH-06, ARCH-07 | Segunda capacidad migrada con el mismo patrón | Registrar qué se reutilizó y qué requirió especialización; no forzar abstracciones del piloto |
| TECH-08 | TECH-07 | Revisión de decisiones y extensión por módulos | Decidir `.ts`, logger y generador con evidencia; continuar el plan base sin migración masiva |

## Primera entrega ejecutable futura

La capacidad piloto es configuración publicada de canal/mensaje de bienvenida. Su alcance conserva las operaciones existentes de lectura, borrador, preview y publicación. No incluye toda bienvenida, despedida, captcha, deduplicación de ingresos o rediseño de tarjetas.

El código actual ya tiene CAS y revisión derivada de los campos publicados. Reutilizarlos; no añadir una colección paralela solo porque la estructura objetivo se llame WelcomeConfig. El primer módulo puede envolver el repositorio actual antes de extraerlo físicamente.

Conciliar al menos: rutas `/api/config/:guildId/welcome`, `/api/guilds/:guildId/modules/:moduleId/*`, formulario `/dashboard/:guildId`, slash `canal/mensaje` y cambios correspondientes de `setup-welcome`. La configuración avanzada restante queda identificada como legacy y no se presenta como migrada.

## Verificación proporcionada

Revisar dependencias antes de ejecutar las pruebas originales; no restaurar los 122 tests y 28 scripts retirados. Usar comprobaciones temporales fuera del paquete si es necesario. Elegir escenarios por riesgo: revisión concurrente, idempotencia de publicación, usuario revocado, canal ajeno, campo desconocido y pérdida de almacenamiento.

Después de comprobar la lógica, ejecutar instalación limpia y un recorrido aislado con servicios reales autorizados. Un render de EJS o `node --check` no verifica permisos dinámicos, Mongo, Gateway o Redis. No publicar comandos o subir emojis para probar la extracción de configuración.

## Criterios de facilidad de mantenimiento

Registrar por cada cambio pequeño: archivos modificados, validadores duplicados que permanecen, acceso directo a stores, adaptadores afectados y pasos para verificarlo. El objetivo es que las invariantes se cambien una vez y que los cambios deliberados por superficie sean visibles.

No fijar un número universal de archivos o un porcentaje de mejora sin medición. Comparar el piloto con un cambio equivalente de la base y explicar diferencias de alcance.

## Rollback

Cada incremento debe poder revertirse sin traer código musical antiguo. Mantener lectura compatible y el escritor anterior mientras queden consumidores. No aplicar backfill destructivo para demostrar modularidad. Si se publica una configuración nueva con formato incompatible, el rollback de código requiere también estrategia de lectura o migración; `git revert` no revierte datos ni efectos Discord.

## Qué se pospone

Cambiar de framework, reescribir todo en TypeScript, dividir el repositorio, añadir microservicios, instalar otro bus y crear módulos sin dominio confirmado no son prerequisitos. Registrar un motivo medible antes de incorporarlos al plan.

El siguiente paso después de recibir esta ampliación es TECH-01. Si se autoriza implementación, seguir el grafo por capacidad y registrar evidencia; recibir el ZIP no cambia estados de implementación a completados.

## Avance local · 18/10/2026

TECH-01: base y versiones conciliadas; inventario canal/mensaje de bienvenida en [piloto](../PILOTO_BIENVENIDA.md). TECH-02: Zod 4.1.12 y TypeScript 5.9.3 fijados, strict/noEmit sobre el servicio y contratos CommonJS. TECH-03: adaptadores incluidos delegan en el servicio autorizado, reutilizando el escritor CAS. Commit `3d63780c30da9fab6546d899af21fc2c072d3016`. Comprobaciones Mongo/HTTP locales y slash simulado descritas en la evidencia. Los recorridos reales y el resto de criterios transversales siguen pendientes; no se marca toda la adopción completada. TECH-04/05/06/07/08 aún no implementados.

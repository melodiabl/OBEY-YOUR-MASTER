# Fuentes técnicas y alcance de la investigación

Consultadas el 17/10/2026. Se usaron documentación oficial y repositorios de los mantenedores. No se hizo una comparación de rendimiento ni una instalación de las tecnologías propuestas.

| ID | Fuente primaria | Hecho utilizado |
| --- | --- | --- |
| T1 | [TypeScript: checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html) | Comprobación de archivos JS junto con allowJs |
| T2 | [Node: TypeScript](https://nodejs.org/api/typescript.html) | Ejecución/strip de tipos no equivale a comprobar tipos |
| T3 | [Zod: uso básico](https://zod.dev/basics) | Análisis runtime, errores y tipos derivados |
| T4 | [Zod: JSON Schema](https://zod.dev/json-schema) y [metadatos](https://zod.dev/metadata) | Exportación, límites de representación y metadatos asociados |
| T5 | [dependency-cruiser: reglas](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md) | Reglas forbidden/allowed y condición circular |
| T6 | [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) | Descripción de operaciones, schemas y seguridad de API |
| T7 | [Ajv: inicio](https://ajv.js.org/guide/getting-started.html) | Alternativa de validación basada en schemas JSON |
| T8 | [Mongo: atomicidad](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/) | Atomicidad de documento y filtros para cambios concurrentes |
| T9 | [BullMQ: trabajos idempotentes](https://docs.bullmq.io/patterns/idempotent-jobs) | Reintentos requieren operaciones diseñadas para repetición |
| T10 | [Socket.IO: garantías de entrega](https://socket.io/docs/v4/delivery-guarantees/) | Orden y entrega son propiedades distintas; entrega por defecto at most once |
| T11 | [Pino: redacción](https://github.com/pinojs/pino/blob/main/docs/redaction.md) | Redacción de campos configurada por la aplicación |
| T12 | [Docker Compose: profiles](https://docs.docker.com/compose/how-tos/profiles/) | Activación selectiva de servicios según perfil |

## Qué está verificado en OBEY

La base remota se consultó con Git y el handoff mediante GitHub. El ZIP se comparó con el árbol exacto de esa base. Se leyeron los servicios/entradas indicados en [la conciliación](08_BASE_REAL_Y_DIFERENCIAS.md). La evidencia es estática: identifica archivos y responsabilidades visibles, sin ejecutar el bot ni consultar datos de servidores.

Las dependencias actuales proceden de package.json/package-lock.json del paquete. Zod, TypeScript, dependency-cruiser y Pino se describen como adopciones propuestas; no están instalados como parte de esta entrega.

## Qué es una decisión de diseño

El monolito modular, la adopción por capacidad, el uso de Zod como fuente de contratos, el descriptor de UI y la secuencia de herramientas son recomendaciones para OBEY. Las fuentes documentan capacidades de herramientas, no prueban cuál es el mejor stack para todo proyecto.

[Inferencia] La configuración compartida y los límites de dependencias pueden reducir la divergencia de comportamiento entre Discord y web. La hipótesis se debe validar con cambios equivalentes y evidencia del piloto.

No se afirma que OpenAPI genere el negocio, que Zod compruebe permisos de Discord, que TypeScript valide HTTP o que una cola garantice exactamente una ejecución externa. No se afirma superioridad por benchmarks que no se ejecutaron.

## Vigencia

En la implementación volver a verificar versiones exactas, engines y API de los paquetes que se instalen. Los enlaces a documentación de rama principal pueden cambiar. Registrar las versiones efectivamente probadas y conservar el lockfile; no adoptar una API nueva solo porque aparece en la documentación consultada.

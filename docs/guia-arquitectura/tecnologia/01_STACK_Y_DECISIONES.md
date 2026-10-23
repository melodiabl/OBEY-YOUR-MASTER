# Tecnologías elegidas y alternativas

Estado: propuesta documentada. La lista no es una orden de instalar todo a la vez. La compatibilidad se acepta contra una instalación limpia y el lockfile, no contra el nombre de una versión mayor.

**Decisión del usuario · 23/10/2026:** migrar el frontend a Next.js + React + TypeScript por pantallas. Esta decisión sustituye la preferencia anterior por EJS en las pantallas migradas. Express/CommonJS, OAuth, CSRF, servicios y Socket.IO conservan su responsabilidad. Primera unidad y límites en [migración del panel](../../platform/FRONTEND-NEXT.md); las páginas todavía no migradas continúan funcionando con EJS.

## Stack objetivo para la primera migración

| Área | Elección | Situación y propósito | Momento |
| --- | --- | --- | --- |
| Runtime | Node en una versión concreta compatible con todo el lockfile | El paquete declara >=20; voice fijado exige >=22.12.0; Docker y CI usan la línea 22 | Conciliar antes del piloto ejecutable |
| Lenguaje | CommonJS + JSDoc comprobado con TypeScript | Mantener ejecución JS actual; añadir comprobación en la capacidad migrada | Piloto |
| Contratos | Zod 4 | Dependencia nueva propuesta para validar entradas nuevas y derivar tipos | Piloto de bienvenida |
| Descripción de campos | JSON Schema generado desde el contrato + descriptor de interfaz | No mantener otro esquema de validación manual | Después de validar el contrato |
| Web | Next.js + React + TypeScript; Express sirve el export bajo /app | Reutilizar API, sesión, servicios y flujos existentes; migración gradual de EJS | Primera pantalla del panel |
| API | HTTP existente; OpenAPI 3.1 como contrato objetivo | Documentar entradas y respuestas reales, no generar handlers de negocio | Con rutas migradas |
| Persistencia | Mongo/Mongoose y repositorios por capacidad | Conservar datos y CAS existentes; aislar escrituras críticas | Por operación |
| Jobs | BullMQ/Redis y repositorio actuales | Trabajo durable, reintentos y conciliación de efectos | Solo capacidades con jobs |
| Tiempo real | Socket.IO existente + revisión de estado | Actualizaciones de vista; la respuesta del caso de uso confirma la operación | Por pantalla |
| Discord | discord.js actual y adaptadores pequeños | Transporte, permisos y componentes; reglas fuera de comandos | Por operación |
| Audio | lavalink-client como destino; Shoukaku como base legacy; voice donde haya consumidor local | Conservar datos/reloj y una sola autoridad de cola; verificar versión y recuperación | Migración musical definida en sistema/07 |
| Imágenes | Workers/pool y assets actuales | Conservar aislamiento y límites; DTO de render explícito | Por tarjeta |
| Límites de imports | dependency-cruiser como herramienta de desarrollo | Comprobar reglas del área migrada | Tras establecer fronteras |
| Logs | Interfaz pequeña de logger; Pino como adaptador propuesto posterior | Campos estructurados y redacción; conservar Sentry actual | Después de definir eventos y redacción |

No fijar aquí un número de parche no verificado. En la implementación registrar versión exacta, `engines`, licencia, lockfile y resultado de instalación. No ejecutar `npm update` global para añadir estas herramientas.

## Por qué estos cambios

TypeScript puede comprobar `.js` con `allowJs` y `checkJs`; JSDoc aporta tipos sin cambiar de inmediato el ejecutable [T1]. Zod permite analizar valores y obtener errores por campo; su conversión a JSON Schema tiene límites que el diseño debe respetar [T3, T4]. dependency-cruiser permite expresar imports prohibidos y ciclos [T5]. Estas son capacidades de las herramientas; no demuestran que OBEY ya las use.

La elección busca un contrato canónico: Zod para forma de entrada; políticas para permisos y existencia de recursos; Mongoose para persistencia. Cada capa resuelve una responsabilidad diferente. No traducir automáticamente todo schema Mongoose en contrato público.

## Alternativas evaluadas

| Alternativa | Decisión propuesta para esta etapa | Condición para reconsiderar |
| --- | --- | --- |
| Ajv + JSON Schema como fuente canónica | Alternativa válida si el equipo exige contratos editables solo como JSON. No adoptarlo además de Zod como segundo validador de servidor | Requisito real de intercambio de schemas entre lenguajes o autoría JSON |
| TypeScript completo desde el inicio | Diferir conversión masiva; primero comprobar una frontera JS | Piloto tipado estable y pipeline de build demostrado |
| NestJS | Mantener composición por funciones y factories del proyecto | Problema medido que justifique su contenedor, decoradores y migración de adaptadores |
| Fastify | Mantener Express | Cuello de botella o requisito de plugins demostrado; comparar compatibilidad de sesiones y rutas |
| React/Next/Vue | Next.js + React elegidos expresamente por el usuario; EJS durante la transición | SSR o servidor Next separado solo cuando una pantalla lo necesite |
| Prisma/PostgreSQL | Mantener Mongo/Mongoose | Requisito de datos y plan de migración completo, no preferencia estética |
| Nx/Turborepo/pnpm workspaces | Mantener un paquete mientras no haya varios paquetes reales | Build o distribución de paquetes con consumidores independientes |
| RabbitMQ/Kafka | Reutilizar BullMQ para jobs; llamadas locales para operaciones síncronas | Volumen, retención o integración que exija otra infraestructura |
| Kubernetes | Mantener despliegue actual y Compose | Necesidad operativa comprobada de orquestación multi-host |
| Plugins subidos por usuarios | No forman parte del diseño inicial | Modelo de aislamiento, permisos, actualización y soporte definido por separado |

Estas son decisiones de alcance para OBEY, no afirmaciones de inferioridad de las alternativas.

## Instalación futura: límites

Primero TypeScript de desarrollo, sus tipos compatibles y Zod en el piloto; después control de imports. Pino queda ligado al trabajo de observabilidad, no a la validación de formularios. OpenAPI y JSON Schema son formatos de contrato; no obligan a instalar un framework.

No añadir un paquete `@discordjs/*` solo por pertenecer al ecosistema. Un import directo necesita dependencia explícita y propósito comprobado; una dependencia transitiva no equivale a una API propia garantizada para OBEY. Auditar cada uso actual antes de quitar o añadir paquetes.

No añadir wrappers distintos para la misma función sin un dueño. Cada dependencia nueva debe tener: consumidor real, problema resuelto, sustitución prevista, costo operativo, prueba de compatibilidad y rollback.

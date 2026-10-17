# Base real y diferencias del paquete

Revisión estática del 17/10/2026, posterior a la entrega conjunta. La rama remota `feature/obey-main-implementation` de `melodiabl/OBEY-YOUR-MASTER` seguía en `c8ba6d3ee86515813e68a028e1221d093301e91b` en la consulta de esta revisión.

## Separación de estados

| Estado | Evidencia y tratamiento |
| --- | --- |
| Rama remota | Base c8ba6d3, consultada mediante Git y handoff GitHub |
| ZIP de implementación | Incluye el refactor local 887bb6e descrito en LEER_PRIMERO_ENTREGA.md; no es idéntico a la rama remota |
| Copia local antigua | HEAD 9f11a85 y muchos cambios pendientes; se dejó intacta, no se usó para actualizar código |
| Esta ampliación | Solo Markdown y entrada documental del paquete; no modifica el código incluido |

Comparación byte a byte contra el árbol remoto: no falta ningún archivo versionado. Diez rutas tienen bytes distintos: siete JSON de botconfig de la entrega sanitizada, `index.js`, `dashboard/index.js` y `docs/platform/HANDOFF.md`. Hay 52 rutas añadidas en el ZIP conjunto anterior, entre ellas los ocho bootstrap, documentos de entrega y los 40 Markdown. Estas cifras describen el paquete recibido, antes de esta ampliación.

La existencia de diferencias no autoriza a restaurar valores privados desde Git o un ZIP. Conservar la configuración privada fuera de la entrega y evaluar el refactor local expresamente antes de desplegar.

## Hechos observados en el código leído

| Fuente | Lo observado | Trabajo propuesto |
| --- | --- | --- |
| `handlers/feature-registry.js` | Registra manifests y servicios, congela metadatos y resuelve capacidades | Ampliarlo con dependencias/ciclo de vida sin segundo registro |
| `handlers/feature-registration.js` | Envuelve inicializadores legacy y remapea ready a dbReady durante registro | Scope explícito para suscripciones de módulos migrados |
| `handlers/configuration.js` | Registra welcome con canal/mensaje y capacidades disponibles/pendientes | Mantener manifest y public API al extraer piloto |
| `handlers/configuration-service.js` | Lectura, borrador y publicación con revisiones | Reutilizar el servicio, no crear otro escritor |
| `handlers/welcome-configuration.js` | Lectura compatible, filtro Mongo, revisión hash y recibo de última escritura | Preservar CAS y aliases durante extracción |
| `dashboard/configuration-routes.js` | Rutas de módulos, draft, preview sintético y publish | Adaptador HTTP al caso de uso canónico |
| `dashboard/welcome-routes.js` | Endpoint compatible de lectura/guardado directo | Mantener alias y mismo contrato de autorización |
| `dashboard/index.js` | Formulario general también guarda canal/mensaje de bienvenida | Extraer operación sin resetear otras configuraciones |
| `slashCommands/Welcome/canal.js` y `mensaje.js` | Guardado directo mediante config-service | Conciliar con publicación y permisos revalidados |
| `commands/Setup/setup-welcome.js` | Flujo extenso con configuración avanzada y escrituras de canal/mensaje | Migrar operaciones concretas; no declarar migrado el menú entero |
| `handlers/i18n/index.js` | Catálogos es/en, variables y fallback español | Reutilizar; ampliar cobertura de claves por módulo |
| `handlers/sync-map.js` | Caché compatible y escrituras/flush | Sacar escrituras críticas mediante repositorios sin borrar compatibilidad |
| `handlers/jobs/runtime.js` | BullMQ, reintentos, reparación y locks por guild | Reutilizar infraestructura y definir política por handler |
| Dockerfile y CI | Línea Node 22; instalación y comprobaciones existentes | Fijar runtime probado con engines del lockfile |

Estas observaciones no certifican comportamiento conectado. No se comprobó en esta revisión una publicación real, un permiso Discord revocado ni una concurrencia Mongo.

## Riesgos que hay que comprobar

[Inferencia] Varias entradas hacia el mismo escritor pueden mantener diferencias de autorización o semántica si se migran por separado. Revisar el recorrido antes de afirmar que existe un fallo de producción.

[Inferencia] Tener un manifest inmutable no basta para permitir desactivación por guild, drenaje y liberación de recursos. Esas conductas requieren implementación y comprobación propias.

## Estado de código

No se instaló ninguna tecnología, ejecutó bot, editó código de runtime, creó PR, publicó rama, registró comando o subió emoji en esta ampliación. La extracción y comparación se realizaron en una carpeta aislada del checkout antiguo.

El bloqueo anterior de publicación no se reintentó. Esta documentación no requiere permisos de publicación para prepararse y entregarse.

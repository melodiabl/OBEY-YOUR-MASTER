# Contrato de un módulo mantenible

Diseño objetivo para ampliar `handlers/feature-registry.js`. No crear un registro paralelo ni confundir los manifests de metadatos con un runtime ya implementado.

## Unidad de cambio

Un módulo posee una capacidad y sus operaciones públicas. Un módulo pequeño puede empezar con `index.js`, `contract.js`, `service.js`, `repository.js` y `ui.js`; separar subcarpetas solo cuando existan responsabilidades que lo necesiten. No crear 32 esqueletos vacíos.

```text
src/modules/welcome/
  index.js                 # API pública y factory
  module.js                # metadatos y conexión del módulo
  contract.js              # formas de entrada/salida y versiones
  service.js               # operaciones de configuración
  policy.js                # permisos y recursos válidos
  repository.js            # contrato de almacenamiento y adaptador inicial
  ui.js                    # disposición del formulario, sin duplicar tipos
  adapters/
    discord.js             # traduce interacción a llamada
    http.js                # traduce request a llamada
```

El núcleo ofrece composición, contexto de operación, registro, autorización, publicación de eventos y ciclo de vida. No aloja reglas de bienvenida, precios de economía ni decisiones de autoplay.

## Datos del manifest

| Campo | Regla |
| --- | --- |
| `id`, `version` | Identidad estable y versión del código; no usarla como revisión del servidor |
| `configSchemaVersion` | Versión de forma de configuración, con mapping legacy explícito |
| `requires` | Capacidades necesarias y contrato compatible; grafo sin ciclos |
| `optional` | Integraciones que pueden faltar y conducta degradada correspondiente |
| `capabilities` | Operaciones realmente disponibles, pendientes o retiradas |
| `permissions` | Política por operación; no una aprobación almacenada indefinidamente |
| `entries` | Slash, prefix, HTTP, customId, evento y job existentes que delegan |
| `config` | Contrato, defaults para nuevos servidores y descriptor de UI |
| `resources` | Claves de traducción/assets y audiencia; no duplicar archivos binarios |
| `lifecycle` | Inicialización, arranque, drenaje y liberación de recursos propios |

Separar manifest público y wiring privado. La web recibe la descripción permitida y estados; no factories, nombres de secretos o dependencias internas. Los campos anteriores se adaptan al manifest existente; no sustituyen de golpe sus nombres y consumidores.

## Dependencias explícitas

La factory recibe solo lo necesario: repositorio de bienvenida, política de acceso a canales, reloj, logger e identificador de operación. No pasar todo `client` o todas las colecciones al dominio. El adaptador Discord puede usar el cliente; el servicio no necesita conocer Interaction o Express.

Entre módulos, llamar a la API pública publicada o a un puerto de capacidad inyectado por composición. Nunca importar schemas, cachés o carpetas internas del otro módulo. Un evento describe un hecho posterior al cambio; no reemplaza una llamada cuyo resultado se necesita para responder.

Para roles concedidos por varios módulos, el servicio propietario recibe origen y motivo de concesión. El módulo consumidor no quita roles directamente al desactivarse si existen otras concesiones vigentes.

## Ciclo de vida del proceso

`registered → initializing → ready | degraded | failed → draining → stopped`.

Registrar no equivale a estar listo. `initialize` valida dependencias; `start` suscribe entradas cuando sus dependencias están listas; `drain` impide nuevas operaciones y espera las aceptadas con límite; `stop` libera listeners, timers, workers y conexiones propios. El cierre es idempotente y continúa con otros módulos si uno falla.

El registro actual envuelve inicializadores legacy y usa `dbReady`. Mantener ese adaptador para módulos no migrados. Los migrados deben registrar suscripciones mediante un scope que retenga las referencias originales y devuelva cleanup. No ampliar la sustitución temporal de `client.on` como mecanismo general de plugins.

No ofrecer recarga de código en caliente en el primer diseño. Editar configuración puede ser dinámico; actualizar código requiere el ciclo de despliegue previsto.

## Activación por servidor

El proceso puede tener un módulo listo y un servidor tenerlo desactivado. Guardar por servidor `enabled`, revisión, generación y autor del cambio. Diferenciar `not_configured`, `disabled`, `enabled`, `degraded` y `suspended` en la proyección de UI.

Desactivar una guild no elimina listeners compartidos ni registra de nuevo slash commands globales. Las entradas aplican la compuerta por guild. Una generación persistida invalida efectos diferidos anteriores cuando la política de la operación así lo permita.

Cada módulo define su política de desactivación: configuración de bienvenida detiene nuevas entregas; tickets conserva lectura y atención de abiertos salvo política explícita; música requiere decidir si drena o detiene y conservar la recuperación. No generalizar una acción destructiva para todos.

## Contrato de operación

Separar `input` y contexto confiable: `guildId`, actor resuelto, audiencia, origen, `operationId`, `correlationId`, revisión y plazo. El body no decide actor, permisos, guild autorizada o destinatario privado.

Devolver `confirmed`, `pending`, `partial`, `unknown` o `conflict`, con código estable, revisión y recibo cuando aplique. Repetir operationId exige comparar actor, guild y payload canónico; un identificador no es autorización ni puede reutilizarse con otro contenido. Si el proveedor pudo aplicar un efecto antes de perderse la respuesta, no anunciar fallo definitivo ni reintentar ciegamente.

## Aceptación

Un módulo se considera extraído cuando todas las entradas incluidas delegan, la autoridad de datos es única, las reglas de imports pasan y se demuestran permisos, concurrencia, fallo y cierre relevantes. Mover archivos y mantener escrituras duplicadas deja la tarea abierta.

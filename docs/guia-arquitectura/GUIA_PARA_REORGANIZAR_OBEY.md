# Guía para reorganizar la arquitectura de OBEY

Trabajá sobre el proyecto existente y conservá sus comportamientos válidos. El objetivo es que cada función tenga un responsable, una operación compartida por sus entradas y una persistencia verificable. Esta guía organiza la migración; no ordena reconstruir el bot ni añadir las propuestas opcionales de comandos.

La referencia remota revisada es `melodiabl/OBEY-YOUR-MASTER`, rama `feature/obey-main-implementation`, commit `c8ba6d3ee86515813e68a028e1221d093301e91b`. Antes de implementar, actualizar la lectura de esa rama y reconciliar cambios posteriores. Las rutas citadas son rutas del repositorio, no archivos de código incluidos en esta guía.

## 1 Alcance y precedencia

El trabajo debe preservar un solo bot OBEY, el diseño Soundy y los IDs de sus doce controles, los favoritos actuales, la recuperación musical, los assets permitidos, el perfil y banner del bot y la landing. El panel interno seguirá la política de tipografía, jerarquía y símbolos funcionales, conservando imágenes que sean datos útiles. La arquitectura no requiere crear nuevas imágenes ni subir emojis para empezar.

Se mantienen las exclusiones documentadas en la rama: contenido NSFW retirado, generadores Fun retirados y configuraciones musicales descartadas no se recuperan desde un ZIP anterior. No se vuelven a incorporar los verificadores y las 122 pruebas que el handoff registra como retirados. Las verificaciones de cada cambio deben ser proporcionadas y no convertirse en otra colección de herramientas de mantenimiento.

El commit local `887bb6e` y el ZIP de código generado en el intento anterior no se consideran una migración aceptada por esta guía. Si el checkout los contiene, revisarlos como propuesta separada. La guía parte del commit remoto citado; no exige aplicar ese refactor.

La existencia de un archivo, un manifest o una captura demuestra presencia de material, no comportamiento correcto. Las afirmaciones de esta guía se distinguen así: observado en la fuente, propuesta de arquitectura, inferencia o pendiente de comprobar. Las decisiones de diseño se presentan como objetivos, no como capacidades ya activas.

## 2 Qué conservar de la rama actual

La rama ya contiene partes de la arquitectura objetivo. Codex debe leerlas antes de inventar reemplazos.

| Base observada | Decisión para la reorganización |
| --- | --- |
| `handlers/feature-registry.js` y manifests actuales | Ampliar el registro existente como metadatos y referencias; no crear otro runtime de módulos |
| `handlers/configuration-service.js` y `dashboard/configuration-routes.js` | Conservar borrador, preview y publicación de bienvenida; extender el patrón cuando corresponda |
| `handlers/music/index.js`, nodos, reloj y publicación | Preservar el motor vigente y extraer responsabilidades sin reinstalar el overlay antiguo |
| `handlers/music/liked-playlist.js` | Mantener la reproducción de Tus Me gusta y sus consumidores actuales |
| `handlers/card-pool.js`, workers y servicio de assets | Conservar aislamiento, límites, selección de fondos y diferencias de audiencia |
| `handlers/jobs/runtime.js` y repositorio de jobs | Mantener la infraestructura y sus recibos; agregar tipos solo al migrar una capacidad aprobada |
| `handlers/sync-map.js` | Conservar compatibilidad temporal y `flush`; retirar usos críticos por operación, no mediante reemplazo global |
| `docs/platform/HANDOFF.md` | Respetar la limpieza y separar resultados históricos de la suite realmente disponible |

[Inferencia] El acceso a configuración y persistencia desde múltiples entradas aumenta la posibilidad de diferencias entre Discord y web. Esta observación orienta qué revisar; no confirma por sí sola un fallo de producción.

## 3 Arquitectura elegida

La decisión tecnológica se concreta en [tecnologia/00_LEER_PRIMERO.md](tecnologia/00_LEER_PRIMERO.md). La primera adopción propone TypeScript para comprobar JavaScript seleccionado, contratos Zod y descriptor UI; la conversión de código a `.ts` sigue siendo posterior y condicionada al piloto. Estos cambios no están instalados en el paquete actual.

La propuesta es un monolito modular. Bot, API, panel y trabajos pertenecen al mismo proyecto y comparten casos de uso. Al principio pueden ejecutarse en el mismo proceso. Preparar puntos de entrada separados no obliga a desplegar microservicios.

Se conserva CommonJS durante la primera migración. TypeScript puede incorporarse después mediante una decisión específica, con comprobación de tipos y build definidos. Renombrar archivos a `.ts` no es una tarea de arquitectura ni una razón para cambiar todas las dependencias. Mantener Express y EJS inicialmente evita migrar a la vez backend, frontend y comportamiento.

El lockfile revisado fija discord.js 14.27.0, voice 0.19.2, Shoukaku 4.3.0, BullMQ 5.81.5 y Mongoose 8.24.4. La entrada voice declara Node >=22.12.0, mientras package.json permite >=20 y Docker usa node:22. Unificar motor, imagen y CI con una versión concreta probada contra el lockfile antes de afirmar compatibilidad. No usar el mínimo de discord.js como mínimo de todo el proyecto.

La dependencia se organiza desde entradas hacia operaciones y reglas. El dominio no necesita un Interaction, Request, Socket o modelo Mongoose para expresar sus invariantes. Las implementaciones de almacenamiento y proveedores cumplen contratos pequeños definidos por la operación que los necesita.

## 4 Estructura objetivo del repositorio

Este árbol representa el destino de la migración. No crear de una vez carpetas vacías ni trasladar archivos cuyo comportamiento todavía no se haya identificado.

```text
obey/
  index.js
  src/
    bootstrap/
      application.js
      configuration.js
      discord-client.js
      handlers.js
      shutdown.js
    entrypoints/
      bot.js
      web.js
      worker.js
    platform/
      discord/
        command-router.js
        component-router.js
        event-router.js
      http/
        authentication.js
        csrf.js
        error-handler.js
      realtime/
        authorization.js
    modules/
      music/
      tickets/
      welcome/
      roles/
      otros modulos aprobados/
    shared/
      authorization/
      configuration/
      operations/
      i18n/
      assets/
      observability/
    infrastructure/
      mongodb/
      redis/
      jobs/
      storage/
      providers/
    web/
      views/
      styles/
      scripts/
      components/
    compat/
      legacy-client.js
      command-aliases.js
  assets/
  migrations/
  docs/
  deploy/
```

`index.js` conserva el contrato de inicio y los consumidores legacy mientras delega gradualmente. Las carpetas actuales `handlers`, `commands`, `slashCommands` y `dashboard` continúan existiendo durante la transición. El destino `src` se introduce por una capacidad completa; no se exige mover todo antes de obtener un cambio funcional verificable.

Un módulo puede empezar con pocos archivos. Separar dominio, aplicación, adaptadores e infraestructura cuando existan responsabilidades diferentes; no añadir una clase y un repositorio abstracto para cada operación trivial.

## 5 Responsabilidades dentro de un módulo

| Parte | Debe contener | Debe evitar |
| --- | --- | --- |
| Dominio | Estados, invariantes y decisiones sobre la entidad | SDK Discord, Express, Mongo y lectura de variables de entorno |
| Aplicación | Autorización de la operación, coordinación y resultado | Construcción de HTML o embeds como condición del negocio |
| Adaptadores | Parseo de entrada, autenticación de superficie y presentación | Escrituras directas o reglas duplicadas del dominio |
| Infraestructura | Repositorios, archivos y comunicación con proveedores | Decidir derechos de negocio solo porque una llamada técnica funciona |
| Manifest y contratos | Capacidades reales, entradas, configuración y DTO | Afirmar que un módulo está listo porque fue registrado |

Por ejemplo, Tickets debe tener una operación canónica de cerrar ticket, invocada por slash, botón, web o job. La operación verifica sujeto, equipo, estado, revisión y política de transcripción. El adaptador web muestra HTML; el adaptador Discord muestra componentes. Ninguno vuelve a implementar el cierre.

Cada módulo expone una API pública pequeña mediante su punto de entrada. Niveles solicita una concesión al servicio de roles y no edita sus documentos. Un módulo no importa archivos internos de otro para saltarse sus políticas. Usar eventos de dominio para notificaciones posteriores al commit; mantener llamadas explícitas cuando el resultado sea necesario para decidir la operación actual.

## 6 Contratos de entrada y resultado

Definir por caso de uso los campos admitidos, sus tipos y límites, los permisos y los efectos. Una forma de contexto propuesta incluye actor autenticado, guild, origen de la solicitud, operationId, correlationId y revisión esperada cuando corresponda. El cliente no elige su actor ni sus permisos mediante un body.

Validar tanto la forma de la entrada como su significado. Un snowflake válido puede pertenecer a otra guild; un canal de texto puede ser invisible al bot; un miembro puede haber perdido el rol después de abrir el modal. La validación del frontend ayuda al usuario, pero no sustituye la autorización del servicio.

| Resultado de operación | Qué significa | Qué debe mostrar la interfaz |
| --- | --- | --- |
| Confirmado | Efecto y persistencia exigidos por el contrato acreditados | Resultado real y entidad afectada |
| Pendiente | Trabajo aceptado, todavía sin resultado final | Referencia y forma autorizada de consultar |
| Parcial | Hay pasos confirmados y otros fallidos o pendientes | Qué ocurrió y qué se puede recuperar sin repetir |
| Desconocido | El proveedor pudo aplicar y no hay confirmación suficiente | Conciliación antes de volver a ejecutar |
| Conflicto | Revisión, permisos o recursos cambiaron | Estado actual y forma de revisar el intento |
| Denegado o inválido | Actor no autorizado o entrada no admisible | Motivo permitido, sin filtrar datos privados |

No equiparar HTTP 200 con efecto confirmado ni cooldown con idempotencia. El recibo de operación debe permitir reconocer un intento repetido incluso después de reiniciar. Si falla la notificación de una sanción aplicada, conservar la sanción y registrar la notificación pendiente.

## 7 Datos y fuente de verdad

Conservar MongoDB inicialmente. Antes de cambiar schemas, identificar por entidad qué módulo escribe, qué colección es canónica y qué lectores siguen dependiendo del formato legacy. Cada dato mutable tiene un dueño; los demás módulos usan consultas o contratos públicos.

SyncMap cambia caché y programa persistencia; `flush` permite esperar sus escrituras. Para dinero, stock, reclamaciones, asignaciones y publicaciones, migrar hacia operaciones asíncronas que confirmen persistencia y condiciones de concurrencia. No retirar la compatibilidad de lectura hasta migrar a todos los consumidores identificados.

MongoDB ofrece atomicidad por documento y permite filtrar por un valor esperado para evitar sobrescribir una revisión cambiada. Si una operación depende de varios documentos, diseñar su integridad y comprobar que el despliegue admite la estrategia transaccional elegida. Una transacción no convierte un mensaje enviado a Discord en parte de la misma transacción de Mongo [F1].

Cuando sea necesario coordinar persistencia y envío, registrar la intención de entrega junto al cambio confirmado y procesarla con recibos. Si el sistema externo no permite garantizar entrega única, exponer el estado desconocido y conciliar. No prometer exactamente una entrega para todos los proveedores.

Cada migración debe especificar clave origen, clave destino, tipo real, tratamiento de ausente/null/false, precedencia, conflictos, checkpoint y rollback. Conservar valores configurados; los defaults nuevos no sustituyen preferencias existentes. No elegir Enmap o Mongo por el nombre del archivo: comprobar consumidores y escrituras reales.

## 8 Configuración y convivencia con otros bots

Reutilizar la publicación de configuración ya existente. Lectura publicada, borrador, preview, diff y publicación son estados diferentes. Guardar borrador no cambia la función activa. Publicar revalida recursos, revisión y permisos y devuelve un recibo persistido.

Definir para cada recurso usar existente, crear o no configurar. La autoridad observe/cooperate/manage debe ser explícita por función. Un canal o rol creado por otro bot no convierte a OBEY en su administrador. Los nombres no demuestran propiedad ni equivalencia.

Las concesiones de roles necesitan origen. Si bienvenida, niveles y un panel conceden el mismo rol, retirar una selección no autoriza quitar otras concesiones válidas. Las importaciones solo admiten fuentes y formatos autorizados; no leer bases privadas de otros bots ni afirmar que existe una integración por compartir nombres de canales.

Migrar las escrituras directas restantes del dashboard a servicios por capacidad. Evitar un formulario gigante que guarde simultáneamente módulos independientes con defaults y aliases diferentes.

## 9 Música y propiedad de la sesión

Conservar el motor actual, su reloj confirmado, pool de nodos, reproducción de favoritos, recuperación y control de publicación ante HTTP 429. El overlay antiguo no debe reemplazar estos archivos. Separar búsqueda, cola, reproducción, recomendación, presentación y persistencia mediante contratos que mantengan una sesión efectiva por guild.

La coordinación de transiciones recibe fin natural, skip, error y recuperación. Debe reconocer identidad de reproducción, revisión y solicitudes canceladas. Stop invalida búsquedas tardías y autoplay. La cola manual tiene prioridad sobre recomendaciones. La explicación de una recomendación procede de señales registradas, no de texto inventado después de elegirla.

El dominio publica estado confirmado antes de esperar una edición de mensaje. La presentación puede agrupar o posponer progreso para respetar límites de Discord, pero no crear otra autoridad de reproducción. Web y componentes ejecutan las mismas operaciones con las diferencias de permiso declaradas.

Mantener los IDs mp_shuffle, mp_prev, mp_toggle, mp_skip, mp_loop, mp_lyrics, mp_voldown, mp_stop, mp_volup, mp_queue, mp_like y mp_autoplay. Comprobar fin natural, error, skip, repeat-track, repeat-queue, shuffle, autoplay sin candidato, pausa, seek, volumen cero y stop durante búsqueda. La guía no exige activar personalización por gustos todavía especificada como trabajo futuro.

Si bot y API se separan en procesos, elegir antes quién es propietario de la sesión. Una cola en memoria por proceso no coordina dos procesos. No repartir reproductores activos entre workers genéricos ni abrir dos conexiones Gateway para aparentar separación modular.

## 10 Trabajos y efectos diferidos

Aprovechar la infraestructura BullMQ y el repositorio de jobs existentes. El módulo define la operación, autorización, generación, checkpoint y efecto; la infraestructura se ocupa de transporte, reintento y ejecución. Agregar un tipo de job exige que exista su handler y su política de recuperación.

Un job debe guardar guild, entidad, operación, tipo, generación o revisión y referencia de resultado. Antes del efecto vuelve a leer cancelación y estado. Reintentar no debe duplicar el cambio confirmado; esa propiedad debe diseñarse en el negocio además de configurar un jobId [F2].

Los recordatorios conservan instante UTC y zona IANA cuando la intención local importe. Una recurrencia define cómo resuelve horario de verano. Cancelar invalida la generación persistida; clearTimeout por sí solo no cancela un job que otro worker ya tomó.

Un estado pendiente no dura indefinidamente sin explicación. Tras agotar reintentos, el operador debe ver la causa redactada y el paso recuperable. No prometer rollback de un efecto externo que no sea reversible.

## 11 Panel y experiencias compartidas

Mantener EJS mientras se reorganiza backend. Separar rutas por dominio y extraer componentes repetidos de formulario, tabla, selector de servidor, estados y cambios pendientes. La política visual del panel se cumple mediante tipografía, espaciado, contraste y controles coherentes. Conservar portadas, avatares y otras imágenes cuando sean datos útiles.

Cada pantalla debe tener estados vacío, sin configurar, cargando, confirmado, parcial, error, conflicto, vencido y acceso revocado cuando apliquen. El usuario puede descartar cambios y entender qué publicará. Un módulo no habilitado no ofrece controles que simulan funcionar.

El backend filtra DTO por audiencia antes de enviarlo. Ocultar con CSS no protege datos ya entregados. Respuestas de sockets y descargas revalidan permiso; caché por usuario/guild/revisión no mezcla perfil público y propio. La atribución de mensajes enviados desde web debe reflejar que los entrega el bot en nombre del agente.

## 12 Mensajes traducciones y recursos

Inventariar texto propio en comandos, componentes, errores, modales, estados vacíos, tooltips y trabajos. Mantener un catálogo canónico de claves con variables permitidas y equivalencia es/en. No traducir IDs ni texto del usuario sin una decisión explícita.

El catálogo de assets existente es la autoridad para emojis, iconos y escenas Discord. Usar objeto emoji en el campo adecuado, texto plano para labels y attachment o URL en imágenes compatibles. Un recurso borrado tiene fallback legible; no desaparece la acción por fallar su decoración. La política web sigue separada del catálogo Discord.

El renderer de tarjetas recibe DTO permitido, versión de plantilla, fuentes y tamaño. No recibe el objeto completo del cliente ni ejecuta scripts del usuario. Aplicar límites de bytes, dimensiones, duración y memoria antes de decodificar. Cambios de privacidad invalidan entregas y caché que pudieran contener datos anteriores.

## 13 Arranque cierre y observabilidad

Extraer la composición desde index.js sin cambiar de golpe el orden de eventos. Identificar inicializadores del núcleo, opcionales y los que dependen de ready/dbReady. Conectar Mongo no significa terminar precarga ni migraciones. Registrar un módulo no acredita salud.

Definir explícitamente qué fallo bloquea login y qué fallo deja una capacidad degradada. Si se decide esperar Mongo antes del Gateway, comprobar que ningún inicializador esperado esté esperando a su vez un evento Gateway. El cierre debe impedir nuevas operaciones, detener productores, guardar resultados pendientes y liberar recursos con un plazo global.

Cada conexión, worker, timer, listener y proceso de render tiene dueño y función de cierre. Un fallo de cleanup se registra y no impide intentar los demás. La web debe cerrar servidor, sockets, store de sesión, listeners e intervalos. Preservar los mecanismos de flush existentes durante la transición.

Registrar operationId, correlationId, código de resultado, duración y revisión cuando resulte útil. Separar tiempo de búsqueda, reproducción y edición Discord para no atribuir un retraso del mensaje a la cola musical. Redactar credenciales, tokens OAuth, direcciones privadas y contenido de tickets. Un healthcheck distingue vivo, listo, degradado y desconocido sin hacer escrituras de prueba.

## 14 Método para migrar una capacidad

1. Fijar SHA y leer cambios locales. Elegir una capacidad cuyo alcance pueda comprobarse por completo.
2. Inventariar slash, prefix, botones, evento, ruta web, job, store, assets y traducciones que participan.
3. Describir el comportamiento observado, el contrato objetivo y las diferencias deliberadas. Registrar conservar/adaptar/aliasar/retirar para cada entrada.
4. Identificar la fuente de verdad y los efectos externos. Definir entrada, permisos, invariantes, revisión y resultado antes de mover archivos.
5. Extraer el caso de uso y su contrato de persistencia más pequeño. Reutilizar servicios que ya existan.
6. Cambiar una entrada para delegar en el servicio y verificar el recorrido. Migrar las otras entradas ofrecidas conservando aliases y customIds.
7. Migrar datos solo cuando el cambio lo requiera, con preflight, copia recuperable y lectura compatible.
8. Comparar permisos, efecto y respuesta de cada superficie. Revisar duplicación, concurrencia, fallo parcial y reinicio donde puedan ocurrir.
9. Retirar la lógica antigua únicamente cuando el inventario no encuentre consumidores restantes y esté documentada la compatibilidad.
10. Entregar diff, evidencia, límites, rollback y siguiente capacidad. No declarar cerrado el módulo porque se haya reorganizado un archivo.

## 15 Orden de ejecución y aceptación

El plan en Markdown `PLAN_POR_ETAPAS.md` define doce tareas transversales y una ficha de conciliación para cada uno de los 32 módulos. Las tareas de dominios futuros se mantienen bloqueadas hasta confirmar alcance; la refactorización no las convierte en nuevas funciones autorizadas.

Primero fijar referencia e inventario. Después definir contratos y composición. Pilotar el método con la publicación de bienvenida, ya existente y más acotada que reescribir música o tickets. Continuar con configuración compartida y propietarios de datos; luego migrar adaptadores y módulos por sus dependencias. Verificar y retirar compatibilidad al final de cada capacidad, no de todo el proyecto.

No estimar duración cerrada sin medir consumidores y diferencias de datos. Si la rama remota cambió desde el SHA revisado, actualizar inventario y plan antes de aplicar una transformación automática.

Un cambio se acepta cuando conserva el resultado acordado, aplica permisos en el servicio, confirma persistencia, evita repetir efectos, comunica estados reales y tiene recuperación documentada. Un traslado de carpetas, una compilación exitosa o un número de tests no basta para certificar la capacidad.

## 16 Verificación sin recuperar herramientas retiradas

Usar las pruebas originales pertinentes solo después de revisar que sus dependencias estén simuladas o sean locales. La suite global no debe ejecutarse a ciegas: algunos catálogos pueden consultar proveedores externos. Preparar comprobaciones temporales cuando hagan falta, sin reinstalar todos los scripts retirados ni convertir cada cambio reversible en otro framework de pruebas.

Comprobar especialmente actor ajeno, otra guild, permiso revocado, recurso borrado, revisión vieja, duplicación, resultado desconocido, reinicio, proveedor caído y diferencias entre superficies. Para UI, verificar pantalla con datos controlados, teclado, móvil y textos largos. Las capturas de otro bot no son evidencia de OBEY.

Registrar por comprobación versión de código, entrada, resultado esperado, resultado observado y límite del entorno. Diferenciar pruebas de unidad, integración aislada, conectadas y producción. No iniciar bot, publicar comandos, sincronizar emojis o desplegar como efecto secundario de validar documentación.

## 17 Entrega que debe producir Codex

Por cada capacidad, entregar archivos modificados y motivo, contratos e índices afectados, compatibilidad preservada, migración si existe, resultados verificados y limitaciones. La descripción debe explicar el comportamiento final para alguien que no leyó este chat.

El registro de cierre debe incluir capacidad, SHA, actor/escenario, invariantes, superficies comprobadas, persistencia, resultado de concurrencia, material/i18n y rollback. Los huecos siguen pendientes con un motivo concreto. Mantener el plan como una sola fuente de estado y no sumar cifras históricas de pruebas como si fueran la suite actual.

Esta guía no autoriza publicar una rama nueva o desplegar. La documentación y el trabajo local pueden prepararse; la publicación bloqueada anteriormente continúa requiriendo la autorización correspondiente.

## 18 Fuentes y lectura del proyecto

[F1] MongoDB Atomicity and Transactions. https://www.mongodb.com/docs/manual/core/write-operations-atomicity/ Consultado el 17 de octubre de 2026. Respalda atomicidad por documento, filtros de valor esperado y necesidad de diseñar operaciones con varios documentos.

[F2] BullMQ Idempotent jobs. https://docs.bullmq.io/patterns/idempotent-jobs Consultado el 17 de octubre de 2026. Respalda que el resultado correcto debe conservarse al reintentar un job.

[F3] Node.js Modules TypeScript. https://nodejs.org/api/typescript.html Consultado el 17 de octubre de 2026. Si se propone TypeScript, revisar límites del soporte nativo y fijar explícitamente comprobación de tipos/build.

La evidencia de rutas y versiones procede del árbol y lockfile del commit remoto citado. `EVIDENCIA_BASE.md` conserva paths y SHA de archivos seleccionados; su hash no demuestra comportamiento. `MATRIZ_DE_CONCILIACION.md` relaciona áreas reales con destinos propuestos. Las 32 fichas amplían recorrido, configuración, privacidad y aceptación sin incluir código del bot.

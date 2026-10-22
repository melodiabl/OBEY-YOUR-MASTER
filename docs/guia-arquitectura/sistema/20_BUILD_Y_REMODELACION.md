# Servidor de OBEY: construcción y remodelación

Edición 0.9 · 21 de octubre de 2026, America/Asuncion. Encargo autorizado: remodelar la experiencia `build` tomando como referencia funcional Server Maker. En las capturas aparece ese nombre; «Server Market» se interpreta aquí como esa referencia. Si el usuario señala otro producto, conservar estos contratos y conciliar las diferencias.

Estado de esta entrega: especificación integrada y revisada contra la base del ZIP 0.7. No se implementó `/servidor`, IA, clonación ni restauración. No se ejecutaron cambios en un servidor. Este capítulo amplía el alcance autorizado de Architect; prevalece sobre la prohibición general anterior de añadir funciones para este recorrido concreto.

## 1. Producto y alcance definido

La función pública se llama **Servidor** y se abre con `/servidor`. El módulo existente identificado internamente como `architect` conserva la autoridad sobre diseño y aplicación de estructura. Los borradores y trabajos se comparten con las superficies existentes. La landing, Soundy y los datos musicales se conservan.

| Capacidad objetivo | Resultado visible y alcance |
| --- | --- |
| Construcción guiada | Elegir comunidad, tamaño, idioma, espacios y estilo; obtener propuesta editable |
| Construcción con IA | Describir la comunidad; recibir un blueprint validado, revisable y sin efectos hasta confirmar |
| Remodelación | Cambiar estructura o apariencia seleccionada conservando IDs existentes |
| Creación puntual | Añadir una categoría, canal o rol mediante formulario o descripción |
| Plantillas | Guardar, importar y aplicar estructura privada; comparar antes de ejecutar |
| Clonación autorizada | Importar estructura de otra guild donde el actor tiene acceso de gestión; mapear IDs al destino |
| Respaldo y recuperación | Capturar estructura, examinar cobertura y preparar un plan de compensación |
| Conectar módulos | Proponer canales/roles para bienvenida, logs, tickets y música; publicar configuración por servicio propietario |
| Historial y diagnóstico | Consultar operaciones confirmadas, parciales y pendientes de revisión |

El primer cierre implementa canales de texto, voz, categorías y roles conforme a las capacidades efectivamente soportadas. Foro, stage, medios, emojis de guild, AutoMod y otras propiedades requieren adaptador, validación y aceptación propios antes de habilitar su edición. Un tipo leído pero no editable se conserva. Una plantilla de estructura no es copia de mensajes, membresías, webhooks, integraciones o identidad original de recursos borrados.

El núcleo es aditivo y de remodelación. El reemplazo destructivo no forma parte del primer cierre. Si se desarrolla posteriormente, exige plan explícito de borrados y confirmación independiente; nunca se implementa como paso oculto de «construir». Biblioteca pública de plantillas, red de servidores y sincronización de sanciones quedan fuera de esta ampliación.

## 2. Base real que debe reutilizarse

| Archivo actual | Evidencia observada y trabajo necesario |
| --- | --- |
| `slashCommands/Config/architect.js` | Consulta, análisis y copia con respuestas privadas; hoy remite a la web para editar. Añadir recorrido Discord completo y traducciones |
| `handlers/architect.js` | Inicializa servicios, registra módulo y usa `OBEY_ARCHITECT_APPLY_GUILDS`. Conservar control de disponibilidad y conciliar metadatos de capacidades |
| `handlers/architect/service.js` | Ya tiene read, preview, save, generate, decorate, captureTemplate y fromTemplate; usar esta autoridad |
| `handlers/architect/wizard.js` | Generador determinista con diez tipos de comunidad y nombres ES/EN/PT; `configuresModules:false`. No llamarlo IA ni configuración publicada |
| `handlers/architect/blueprint.js`, `diff.js`, `preflight.js` | Validación, diferencias y permisos. Extender por operaciones soportadas sin aceptar esquemas arbitrarios |
| `handlers/architect/application.js` | Preparación/confirmación y compilación. Hay restricciones sobre creaciones, reordenamientos y cascadas; no basta con añadir botones |
| `handlers/architect/creations.js` | Roles nuevos solo con permisos cero y posición básica; canales nuevos sin overwrites. Debe ampliarse antes de ofrecer espacios privados completos |
| `workers/architect-edits.js` | Ejecución con recibos, comprobaciones y conciliación de creaciones inciertas; ampliar el ejecutor existente |
| `handlers/architect/permissions.js` | Proyecta permisos. Verificar accesos después de cada etapa y durante la creación privada |
| `handlers/architect/restore-points.js` y repositorios | Capturan y consultan estructura; guardar un punto no acredita restauración |
| `handlers/templates/{format,merge,service,repository}.js` | Formato `obey-template`, merge y persistencia; conservar compatibilidad de importación |
| `database/schemas/Architect*.js`, `TemplateSchema.js` | Borrador, plan, bloqueo y respaldo; evolucionar estos datos con migración explícita |
| `dashboard/architect-routes.js` | Rutas de edición, preview, generación, templates, confirmación y trabajos; mismas políticas y servicios que Discord |

La declaración de capacidades puede ir por detrás del ejecutor: el registro anuncia `applyFields` limitados, mientras el compilador admite otras acciones con restricciones. Conciliar implementación, flag y registro antes de presentar disponibilidad. No crear una segunda cola, colección de borradores o ejecutor `build` paralelo.

## 3. Entradas y navegación en Discord

Propuesta vigente: `/servidor` abre el panel **Servidor**. El parámetro opcional `accion` permite ir a una tarea concreta, y el panel ofrece las mismas acciones mediante selector y botones. No se crean subcomandos obligatorios ni una segunda entrada `/build`. Sustituir los comandos públicos antiguos al registrar la nueva versión; preservar datos y adaptar interacciones antiguas válidas durante su transición. El menú de configuración se etiqueta **Servidor**. Ver [nombres y transición](21_NOMBRES_CLAROS.md). Verificar el registro de comandos realmente cargado: el archivo y el manifiesto actual no son idénticos.

Centro: **Construir**, **Remodelar**, **Crear un recurso**, **Plantillas**, **Copiar estructura**, **Copias de seguridad**, **Historial**. Usar selector si supera el espacio cómodo de botones. Toda acción de gestión es privada; avisos en un canal se publican solo mediante configuración expresa.

Recorrido principal:

1. **Origen:** asistente guiado, descripción IA, plantilla o estructura autorizada.
2. **Objetivo:** nueva sección o remodelación seleccionada; idioma de nombres y estilo independiente del idioma de interfaz.
3. **Propuesta:** categorías, canales y roles por páginas; añadir, editar, excluir y volver sin perder borrador.
4. **Reutilización:** proponer coincidencias por tipo/ID y permitir elegir recursos existentes. No adoptar un canal por parecido de nombre.
5. **Conexiones:** seleccionar módulos y asignar IDs o referencias locales. El administrador puede omitir cualquier conexión.
6. **Revisión:** cantidades create/update/move/permissions, antes/después, permisos sensibles, recursos preservados y alcance del respaldo.
7. **Confirmación:** vinculada al actor, guild, revisión y digest del plan, con expiración y consumo único.
8. **Ejecución:** progreso por operaciones verificadas, opción de detener entre operaciones y referencia durable.
9. **Resultado:** aplicado, parcial, detenido o requiere revisión; detalle de efectos reales y siguiente acción útil.

El editor detallado puede seguir disponible en la web, pero el recorrido guiado básico se termina dentro de Discord. Mantener acciones equivalentes en ambas entradas. Los controles antiguos válidos se adaptan; los expirados muestran «Volver a abrir» sin ejecutar un plan viejo.

## 4. Presentación concreta

Embed «OBEY · Servidor» con acento dorado y encabezados breves. Ejemplo de datos ficticios: «Comunidad de música · Español · Estilo OBEY», «Crear: 3 categorías, 8 canales y 2 roles», «Reutilizar: 4 canales y 1 rol», «Eliminar: ninguno». Mostrar un árbol paginado mediante campos de texto, no un PNG para información que debe ser legible y seleccionable.

En revisión: botones **Editar propuesta**, **Revisar permisos**, **Aplicar cambios**, **Guardar borrador**, **Cancelar**. En progreso: «Aplicando canales · 9/14 operaciones verificadas» y **Ver detalle**, **Detener**. En resultado parcial: «9 aplicadas · 1 fallida · 4 sin ejecutar», **Revisar pendientes**, **Ver cambios**. No mostrar un porcentaje artificial si el total aún no está compilado.

Un resumen compacto permanece arriba y los detalles se consultan por página; todos los botones llevan texto. Validar límites vigentes de Discord al implementar y usar mensajes adicionales solo cuando aporten información. `custom_id` contiene versión, acción y referencia opaca corta; la autorización se resuelve en servidor, no confiando en ese ID.

Nombres de canales: conservarlos por defecto; estilos simple, sutil o expresivo solo por elección. Los nombres son texto de Discord: no insertar markup de emoji personalizado esperando que renderice como en un mensaje. Si se ofrecen símbolos Unicode decorativos, deben ser opcionales y distintos del catálogo visual de mensajes.

## 5. Casos de uso y propietario del código

Destino modular propuesto `src/modules/architect`, con adaptación gradual de los servicios actuales. Domain: blueprint/diff, políticas de recursos y permisos. Application: capturar, generar, editar, revisar, confirmar, aplicar, reconciliar y compensar. Infrastructure: Discord, Mongo y proveedor IA. Presentation: slash, componentes, modales, respuestas y adaptación de rutas web actuales. No mover todos los archivos antes de tener un recorrido comprobado.

| Operación lógica propuesta | Reutilización / extensión |
| --- | --- |
| `openWorkspace` | read + borrador del actor |
| `generateGuided` | generate / wizard |
| `generateFromPrompt` | nuevo puerto IA que devuelve blueprint, sin acceso directo a Discord |
| `editProposal` | validateBlueprint + save con revisión esperada |
| `importTemplate` | templates service y merge existentes |
| `importGuildStructure` | snapshot del origen autorizado + transformación portable + merge |
| `reviewPlan` | preview + preflight + compileEdits soportado |
| `prepareApplication` / `confirmApplication` | servicio application existente |
| `readJob` / `requestStop` | jobs existentes; cancelar no deshace efectos previos |
| `reconcileJob` | observación real + recibos; bloquear nuevos efectos inciertos |
| `prepareCompensation` | nuevo diff contra valores anteriores bajo revisión actual |
| `proposeBindings` / `publishBindings` | delegar a configuración de cada módulo propietario |

Estos nombres son contratos de diseño, no exports que ya existan. Preservar CommonJS, discord.js y Mongo actuales durante la adaptación. Proveedor IA detrás de un puerto; no instalar varios SDK, otro framework o un nuevo ORM para esta función. Reutilizar el sistema de trabajos y disponibilidad existente.

## 6. Persistencia, confirmación y concurrencia

Borrador: guildId, actorId, revisión esperada, snapshot base, blueprint versionado y procedencia. Plan: referencia al borrador/revisión, baseRevision, digest, operaciones ordenadas, destinos, cobertura, expiración y confirmación. Extender los documentos actuales con migración compatible; no tratar el TTL de Mongo como autorización: comprobar expiración en cada lectura/confirmación.

Cada operación registra ID, dependencias, tipo, ID real o local, before/after, estado, intento, razón de auditoría y resultado observado. Mantener mapeo `local:* → snowflake` para padres, roles, permisos y bindings. Un ID de otra guild no se convierte en destino válido por estar en una plantilla.

Una aplicación activa por guild con bloqueo durable y lease/propiedad comprobada según el sistema de jobs. Tras perder el lease, detener efectos nuevos; recuperar solo con conciliación de operaciones previas. Dos confirmaciones del mismo plan deben devolver la misma aplicación o rechazo consumido, nunca ejecutar dos veces. Si el usuario o un tercero cambia el alcance revisado, regenerar diff y confirmar de nuevo.

No hay transacción distribuida entre Discord y Mongo. Persistir intención antes del efecto y recibo observado después. Si se pierde una respuesta de creación, buscar evidencia inequívoca mediante ID devuelto, estado y auditoría autorizada. Nunca reintentar ciegamente ni identificar un recurso solo por su nombre. Si no se puede resolver, estado `needs_review` y sin nuevas mutaciones dependientes.

## 7. Permisos y recursos privados

ManageGuild abre gestión; la aplicación exige además los permisos efectivos para las operaciones concretas. Consultar actor y bot actualizados en preview, confirmación y ejecución. Respetar jerarquía de roles, overwrites, recursos gestionados y accesos efectivos; no crear un rol administrador como valor predeterminado.

Un canal de staff/tickets no debe existir temporalmente público. La creación debe incluir overwrites seguros en la primera petición, con referencias reales ya resueltas y validación del acceso efectivo. Mientras `creationOptions` siga enviando overwrites vacíos, esa capacidad se muestra no disponible. No usar «crear público y privatizar después».

Conservar @everyone, roles managed y recursos protegidos; impedir quitar al actor/bot la gestión necesaria a mitad del plan. El propietario conserva las capacidades de Discord, pero no salta las validaciones de forma, integridad o disponibilidad. Verificar autorización en ambas guilds para clonación y revalidarla al aplicar el destino.

## 8. IA y edición natural

El proveedor recibe instrucciones, elecciones y solo la estructura mínima autorizada. No enviar mensajes, miembros, secretos o URLs de webhooks. Explicar qué estructura se procesa antes del envío y ofrecer modo guiado sin proveedor.

La respuesta IA debe cumplir un esquema cerrado de propuesta; nombres y temas son datos, nunca instrucciones ejecutables. Validar tamaños, tipos de canal, dependencias, colores, permisos y claves desconocidas; pasar siempre por el compilador/preflight. Limitar duración, consumo, concurrencia y un intento de reparación estructurada; al fallar, conservar borrador y ofrecer asistencia guiada. Seleccionar proveedor/modelo con la configuración real del proyecto al implementar, sin inventar credenciales ni prometer gratuidad.

Ejemplo de edición: «añadí una sección de torneos y hacé privado staff» produce un nuevo diff editable. No ejecuta herramientas directamente ni ignora un recurso protegido. Si «staff» coincide con varios canales, exigir selección del recurso dentro del recorrido.

## 9. Plantillas, clonación y módulos de terceros

Mantener lectura del formato `obey-template` v1; versionar de forma explícita cualquier extensión. Exportar estructura portable sin usuarios, tokens, webhooks o IDs privados de miembros. El origen y su versión quedan registrados. Plantillas ajenas se validan igual que una propuesta IA.

Clonar requiere bot presente y actor autorizado en origen/destino; importar solo alcance seleccionable. Remapear roles/categorías y permisos; rechazar referencias de miembros no portables en el primer cierre. `@everyone` se mapea al destino, roles managed se excluyen y se informa. Los permisos de origen se revisan en contexto del destino, no se copian como autorización implícita.

Para servidores creados por Server Maker u otros bots, OBEY permite elegir sus canales y roles por ID, muestra uso y propone bindings de bienvenida/logs/tickets/música. No deduce propiedad por el autor del recurso ni administra configuración privada del otro bot. La confirmación elige qué módulo publica cada ajuste. Si falla un binding, el resultado distingue «estructura aplicada» de «módulo sin configurar» y permite reintentar esa configuración sin recrear canales.

## 10. Recuperación honesta

Cada respaldo declara `structure_only`, campos capturados y excluidos. La compensación de un cambio existente solo procede si el estado actual coincide con el que dejó el trabajo; un cambio posterior de otro administrador produce conflicto. Revertir nombres o permisos genera nuevo plan confirmado.

No borrar automáticamente canales creados durante rollback: pudieron recibir mensajes. Ofrecer conservarlos o preparar su eliminación con alcance visible en una fase que soporte borrados. Un canal ya eliminado no recupera su ID ni sus mensajes mediante recreación. No anunciar «restauración completa» por guardar el JSON del snapshot.

## 11. Progreso, animaciones e idiomas

Reconocer la interacción a tiempo y delegar trabajos largos. Coalescer actualizaciones por cambio significativo; punto de partida de producto: intervalo mínimo de dos segundos por mensaje, ampliable bajo presión. Ese intervalo no es un límite oficial ni garantía de latencia. Respetar buckets y `retry_after`; la cola de operaciones y la presentación se coordinan mediante el job, no bloqueándose entre sí.

Para un trabajo que exceda la ventana del token de interacción, guardar referencia y permitir reabrir estado mediante `/servidor`. No almacenar tokens de interacción como mecanismo durable ni mandar privados al usuario sin elección. Detener deja de programar operaciones entre efectos; una petición en vuelo puede terminar y debe conciliarse.

| Vista / estado | Material del catálogo existente | Regla |
| --- | --- | --- |
| Centro y propuesta | B49 architect, B50 templates, B52 edit | B son propuestas aún por aprobar |
| Análisis/generación real | A12 sincronizar GIF | Animar mientras el servicio esté pendiente |
| Guardar borrador | B53 save PNG/GIF | GIF solo pendiente; confirmación tras persistir |
| Permisos | A07 escudo, B26 permissions, B24 warning | Texto explica permiso concreto |
| Aplicación | A12 motion + contadores | No esperar a que termine la animación para avanzar |
| Éxito verificado | A11 confirmación | Tras comprobar efectos, no durante loading |
| Fallo / parcial / conflicto | B23 error, B24 warning, B28 expired | Mostrar acciones y cobertura, no solo icono |
| Plantilla / importar | B50 templates, B62 upload | No animar si no hay operación activa |

Fallback siempre legible si no existe emoji publicado; no inventar IDs. Usar el mismo registro canónico y plan de publicación del capítulo 18. No se necesitan nuevos diseños para especificar este recorrido. La animación exacta al primer frame depende del cliente Discord.

Los deltas ES/EN están en [build/locales](../build/LEER.md). No están cargados en runtime. Se añaden a los deltas visuales existentes sin reemplazar sus 470 claves por idioma. Idioma de interfaz y de nombres son preferencias separadas; no renombrar contenido del usuario por cambiar idioma.

## 12. Orden de implementación y cierre

| Unidad | Trabajo completo | Evidencia exigida |
| --- | --- | --- |
| BUILD-01 | Conciliar comandos/capacidades y adaptar centro Discord al servicio actual | Entrada cargada, permisos, ES/EN, controles expirados |
| BUILD-02 | Guided → draft → diff → apply básico → resultado | Dos guilds aisladas, reinicio y ningún duplicado |
| BUILD-03 | Ampliar compilador para dependencias/permisos y creaciones privadas | Canal privado desde su creación, jerarquía y pérdida de permiso |
| BUILD-04 | Conexiones por servicio propietario | ID reutilizado, publicación y fallo parcial separados |
| BUILD-05 | IA y edición natural sobre el mismo pipeline | Respuesta inválida, timeout, ambigüedad y ninguna ejecución directa |
| BUILD-06 | Importación y clonación seleccionada | Autorización doble, remapeo y preservación del destino |
| BUILD-07 | Historial y compensación revisada | Drift, efectos irreversibles y resultado incierto |

No llamar terminado al módulo hasta completar las capacidades ofrecidas o retirarlas de la UI con estado explícito. Una feature detrás de canary sigue requiriendo aceptación en entorno autorizado. No reintroducir los tests/scripts retirados; usar comprobaciones proporcionadas y pruebas conectadas necesarias para efectos sensibles.

Aceptación mínima: doble clic no duplica; plan viejo no aplica; perder permiso detiene; timeout de creación no duplica; staff nunca se publica; reinicio conserva ID map; detener no anuncia rollback; otro bot cambia un canal y OBEY no lo pisa; fallo de configuración no recrea estructura; IA inválida no muta; plantilla no filtra datos; token expirado permite reabrir; ES/EN conservan placeholders; emoji ausente conserva acción; una guild no ve borradores de otra.

Consultar [investigación y evidencia](../build/INVESTIGACION_SERVER_MAKER.md) y [contrato de alcance](../build/alcance.json). Son documentos de implementación, no pruebas de funciones nuevas en producción.

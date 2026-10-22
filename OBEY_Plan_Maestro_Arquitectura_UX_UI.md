# OBEY · Plan maestro de arquitectura, UX/UI e idiomas

Fecha de base: 17 de octubre de 2026; materiales ampliados el 20 de octubre (UTC); Build documentado el 21 de octubre de 2026 (America/Asuncion). Versión: 0.15, planificación y materiales ampliados con `lavalink-client` elegido por el usuario como destino de audio. Superficie prioritaria: el bot dentro de Discord.

Este documento define el trabajo y las condiciones de entrega. No acredita una renovación implementada, una prueba en Discord ni un despliegue. El ZIP definitivo será el proyecto completo integrado, con los recursos necesarios y una guía de entrada; no requerirá aplicar parches.

## 1. Objetivo y decisiones de partida

Construir un sistema coherente que permita cambiar una función, un texto, un recurso o una configuración sin perseguir copias repartidas por todo el proyecto. Conservar las funciones útiles existentes y sustituir gradualmente los accesos que mezclan transporte, negocio, datos y presentación.

Decisiones de este plan:

- Un monolito modular para el código de negocio, con los procesos de imágenes y trabajos que el proyecto ya tiene. La separación de responsabilidades precede a una distribución en más servicios.
- Un módulo tiene operaciones y datos propios, permisos explícitos, presentación y traducciones; su existencia no se demuestra por una carpeta o un menú.
- Reutilizar el registro de capacidades, configuración de bienvenida, assets e i18n. Migrar de Shoukaku directo a `lavalink-client`, conservando funciones y datos musicales y una única autoridad de reproducción.
- Priorizar recorridos dentro de Discord y conservar las integraciones del dashboard. La ampliación 0.14 autoriza planificar consulta web de datos, checkout/suscripciones, derechos y despliegue multi-VPS; conserva la landing y no exige reconstrucción completa del frontend para reparar el bot.
- Mantener CommonJS durante la migración inicial. Tipos, validadores y herramientas nuevas se incorporarán solo donde exista un consumidor concreto y compatibilidad comprobada.
- Conservar las decisiones previas de retirada de NSFW y de limpieza de pruebas/herramientas auxiliares.
- Separar configuración dinámica de actualización de código: editar un texto no debe necesitar desplegar; cambiar el motor de ejecución sí exige el ciclo normal de entrega.

## 2. Base comprobada y conciliación obligatoria

Repositorio: [melodiabl/OBEY-YOUR-MASTER](https://github.com/melodiabl/OBEY-YOUR-MASTER).

Rama verificada: `feature/obey-main-implementation`.

Commit remoto consultado: `c8ba6d3ee86515813e68a028e1221d093301e91b`.

Material actual leído o inspeccionado:

| Material | Qué aporta | Límite de la evidencia |
| --- | --- | --- |
| Rama y árbol del commit remoto | Código versionado y estado de entrega | No demuestra qué código está ejecutándose hoy |
| `OBEY_Implementacion_con_Guia.zip`, versión 2 | Proyecto, refactor local de arranque/cierre y 51 Markdown de guía | Contiene cambios posteriores al commit remoto; no todos fueron probados con servicios reales |
| `OBEY_Revision_Iconos.zip` | Material para revisar los recursos previos | No convierte todas las propuestas en recursos aprobados o publicados |
| `obey-tickets-v2-demo.zip` | Ejemplo separado de componentes para tickets | No equivale a integración con los servicios actuales de tickets |
| `OBEY_Renovacion_Funcional.md` y `OBEY_Renovacion_Investigada.md` | Contexto de recorridos, identidad y trabajo anterior | Los conteos y pruebas históricos no describen automáticamente la rama actual |
| Sección inicial de `OBEY_Prompt_Maestro_Integral.md` | Restricciones y alcance previos | No se reabrieron íntegramente todos los capítulos en esta revisión |

Comparación por hash Git de archivos entre el ZIP y el árbol remoto:

- 2.640 archivos coinciden exactamente.
- Diez archivos presentes en ambos difieren; incluyen configuración, `index.js`, `dashboard/index.js` y el documento de entrega. La entrega declara que se vaciaron credenciales; no deben reconstruirse valores privados desde estas diferencias.
- El ZIP no omite ningún archivo del árbol remoto examinado.
- Añade 64 archivos: 51 de guía y 13 adicionales, incluidos ocho de `bootstrap`, documentos de entrega y un archivo temporal de plugin que debe excluirse de un paquete final.

El ZIP documenta el refactor local `887bb6e0af444ad771fed8c39be19ed746391aba`. Antes de implementar, conciliar ese refactor con el commit remoto y fijar una única base de trabajo. No sobrescribir cambios posteriores del usuario ni afirmar que el ZIP y GitHub son idénticos.

Hallazgos técnicos directos:

| Área | Lo observado | Consecuencia para el plan |
| --- | --- | --- |
| Audio | `package.json` declara Shoukaku `^4.3.0`; no declara Kazagumo ni `lavalink-client` como dependencias directas | Migrar al destino confirmado `lavalink-client`; validar compatibilidad y funciones durante la integración |
| Idiomas nuevos | `locales/es.json` y `locales/en.json`: 545 hojas de texto cada uno, sin hojas vacías | Existe una base reutilizable; falta verificar todos sus consumidores y calidad lingüística |
| Idiomas legacy | ES/EN/DE: 4.605 hojas cada uno; `in.json`: 4.592; una hoja vacía en cada archivo revisado | Hay dos sistemas que conciliar; el nombre de archivo no certifica un idioma listo |
| i18n runtime | `handlers/i18n/index.js` normaliza a idioma base y usa fallback español | La normalización actual pierde región; no sirve sin cambios para distinguir todas las variantes regionales |
| Capacidades | `handlers/feature-registry.js` mantiene manifests y referencias a servicios | Es la autoridad a extender, no un runtime completo de plugins |
| Configuración | `handlers/configuration-service.js` declara soporte de borrador/publicación para bienvenida | Extender por operación; no anunciar edición universal ya disponible |
| Presentación | Hay registro de assets, catálogos de producción y constructor común de mensajes | Consolidar consumidores conservando aliases y recursos ya utilizados |
| Música | El manifest conserva doce controles y capacidades marcadas pendientes | El manifiesto debe reflejar disponibilidad real, no deseos de producto |
| Verificación anterior | `HANDOFF.md` registra tres archivos de pruebas originales y retrasos por 429 pendientes | No reutilizar las cifras de 575 pruebas como suite actual ni declarar resuelta la latencia |

No se ejecutaron `npm ci`, la suite del bot, autenticación, Mongo, Redis, nodos de audio ni pruebas conectadas durante esta planificación. El estado operativo de los informes previos es histórico.

## 3. Arquitectura del sistema

La unidad principal será una capacidad de producto con un único dueño. Discord, los eventos, las tareas y las rutas existentes llaman a sus operaciones públicas. Los adaptadores transforman entradas y salidas; las reglas viven en el servicio o dominio del módulo.

### Distribución objetivo, aplicada gradualmente

| Zona | Responsabilidad | Regla de dependencia |
| --- | --- | --- |
| `bootstrap/` | Composición, arranque, conexión y cierre | Conecta módulos y adaptadores; no decide reglas de producto |
| `src/core/` | Contexto de operación, registro, autorización común, routing y contratos de infraestructura | No importa reglas internas de módulos |
| `src/modules/<capacidad>/` | Operaciones y reglas de una capacidad | Expone una API pública pequeña |
| `src/shared/presentation/` | Composición de mensajes, estados comunes y adaptadores de Components V2/legacy | Recibe datos preparados; no consulta colecciones de negocio |
| `src/shared/i18n/` | Resolución de idioma y formato, con puente legacy | No decide permisos ni sustituye contenido del usuario |
| `src/infrastructure/` | Adaptadores Mongo, Redis, Discord REST, proveedores y observabilidad | Implementa puertos definidos por sus consumidores |
| `assets/` | Recursos binarios, fuentes para imágenes y manifiestos existentes | Los módulos usan claves semánticas, no rutas o IDs copiados |
| `docs/guia-arquitectura/` | Contratos, decisiones, estado y aceptación de la migración | Se actualizan las fichas existentes; no se multiplican planes contradictorios |

Son destinos propuestos, no carpetas creadas por esta entrega. Los archivos legacy mantienen adaptadores hasta migrar todos sus consumidores. Un módulo pequeño empieza con pocos archivos; solo se añaden capas cuando separan una responsabilidad real.

### Contrato mínimo de un módulo

| Pieza | Debe definir |
| --- | --- |
| Identidad | `id`, versión de código, versión de configuración y operaciones disponibles |
| Entradas | Comandos slash/prefijo, botones, menús, modales, eventos y jobs existentes |
| Operaciones | Entrada validada, resultado tipado, errores estables y efectos externos |
| Política | Actor elegible, permisos Discord, jerarquía de roles y alcance por servidor |
| Repositorio | Autoridad de datos, índices, concurrencia y compatibilidad histórica |
| Presentación | Datos de vista, estados, audiencia y acciones siguientes |
| Recursos | Claves de traducción y assets realmente consumidos |
| Ciclo de vida | Inicio, estado degradado, drenaje y liberación de sus recursos |
| Migración | Lectura compatible, cambio de datos si hace falta y recuperación |

Contexto confiable por operación: `guildId`, actor resuelto, origen, audiencia, `operationId`, `correlationId`, revisión esperada y plazo. Estos valores se obtienen de la sesión o interacción autorizada, no de un body arbitrario.

Cada cambio crítico diferencia `confirmed`, `pending`, `partial`, `unknown` y `conflict`. Un timeout de un proveedor no permite afirmar que su efecto no ocurrió. Los reintentos deben comprobar deduplicación y estado antes de repetir acciones.

Los identificadores idempotentes se vinculan a guild, actor, operación y contenido canónico; no sustituyen autorización. Un módulo llama a otro por su API pública. Eventos para hechos ya ocurridos; llamadas directas cuando la respuesta depende del resultado.

### Tecnología y edición

Conservar Node, discord.js, Mongo/Mongoose, BullMQ/Redis, workers de imágenes y transporte web existentes donde corresponda. Shoukaku es la implementación actual y referencia de comportamiento durante la migración; el destino del cliente de audio se describe en la sección 10. La versión de Node se fijará contra `package-lock.json`, Docker y CI: el rango `>=20` de `package.json` no basta para acreditar compatibilidad de todas las dependencias.

La guía anterior propone JSDoc comprobado con TypeScript y Zod para contratos nuevos. Mantenerlos como opciones de adopción controlada, no instalarlos en bloque. Elegir una sola fuente de validación por contrato; no mantener un schema manual de formulario que diverja del servidor.

No convertir edición de configuraciones en ejecución de JavaScript, importación de plugins arbitrarios o plantillas con `eval`. Las personalizaciones de servidor son datos validados.

## 4. Alcance funcional y mapa de módulos

Las 32 fichas existentes son un inventario de planificación. Se conservan sus IDs para trazabilidad; se podrán fusionar o dejar diferidas si la revisión del dominio lo justifica. Esta tabla clasifica rutas presentes, no acredita funciones completas.

| Capacidad/ficha | Situación de base | Cierre de producto requerido |
| --- | --- | --- |
| `utilities` | Ayuda y utilidades presentes | Descubrimiento, ejemplos, permisos y navegación por funciones cargadas |
| `welcome` | Handlers, configuración y tarjetas presentes | Configurar, previsualizar, publicar, enviar y diagnosticar |
| `cards` | Renderer, recursos y proceso aislado presentes | Edición y render iguales en preview y evento |
| `music` | Motor, controles, cola y biblioteca presentes | Reproducción, búsqueda, continuidad, recuperación y publicación consistente |
| `tickets` | Handlers y servicios presentes | Abrir, asignar, atender, cerrar, transcribir y recuperar |
| `moderation` | Acciones y casos presentes | Permisos, motivo, duración, historial y resultado verificable |
| `security` | Handlers de seguridad presentes | Incidente, evidencia, alcance y respuesta autorizada |
| `automod` | Reglas de mensajes presentes | Configuración, excepciones, evidencia y revisión |
| `logs` | Registro y eventos presentes | Destinos, privacidad y entrega diagnosticable |
| `roles` | Asignación y entradas presentes | Reglas, jerarquía, concesiones y retirada segura |
| `voice` | Canales temporales y voz presentes | Crear, controlar, limpiar y recuperar sin duplicados |
| `levels` | Ranking y tarjetas presentes | Progreso, recompensas y política de actividad |
| `profiles` | Perfil y títulos presentes | Visibilidad, personalización y estado coherente |
| `economy` | Servicios y comandos presentes | Saldos, transferencias, inventario y concurrencia |
| `fun` | Juegos y acciones presentes | Sesiones, participantes, turnos y traducción apta para el alcance vigente |
| `giveaways` | Handler y schema presentes | Crear, participar, terminar y registrar resultado |
| `suggestions` | Handler y presentación presentes | Proponer, votar, revisar y publicar decisión |
| `reminders` | Cumpleaños y mensajes programados presentes | Zona horaria, programación, ejecución y cancelación |
| `messages` | Constructores y edición presentes | Borrador, variables, preview y publicación |
| `sticky` | Servicios y schema presentes | Publicación coordinada, cambios y desactivación |
| `automation` | Triggers y comandos personalizados presentes | Evento, condiciones, acciones y registro de ejecución |
| `feeds` | Schemas y notificaciones presentes | Fuente, permisos, deduplicación y salud del proveedor |
| `analytics` | Estadísticas y contadores presentes | Definición de métrica, periodo, inicio de captura y privacidad |
| `applications` | Solicitudes y botones presentes | Formulario, revisión, decisión y permisos |
| `architect` | Servicios y rutas presentes | Propuesta, diff, aplicación parcial y recuperación |
| `decoration` | Integración con Architect presente | Estilos legibles, preview y cambios revisables |
| `templates` | Formato y merge presentes | Guardar, importar, conciliar y aplicar con alcance explícito |
| `migrations` | Ficha transversal existente | Herramienta de datos, versiones y recuperación; no un menú vacío para miembros |
| `verification` | Núcleo no confirmado en la conciliación previa | Diferir hasta confirmar necesidad y dominio |
| `events` | Núcleo no confirmado en la conciliación previa | Diferir; no confundir eventos de negocio con una función de calendario |
| `starboard` | Núcleo no confirmado en la conciliación previa | Diferir hasta decidir alcance |
| `collections` | Núcleo no confirmado en la conciliación previa | Diferir; no duplicar favoritos o biblioteca musical |

Backups se concilian con las capacidades de Architect, plantillas y los handlers existentes antes de decidir un módulo separado. Matrimonio y otras funciones sociales se inventariarán por sus entradas reales y se asignarán al dueño que corresponda; no se eliminan porque no aparezcan como categoría independiente en esta tabla.

## 5. Sistema UX de Discord

Organizar la experiencia por objetivo del usuario y rol, no por nombres de archivos o dependencias. La ayuda mostrará lo disponible, sus requisitos y el próximo paso. Los comandos existentes conservarán compatibilidad mientras el registro pueda dirigirlos al mismo caso de uso.

### Roles de experiencia

| Persona | Necesita |
| --- | --- |
| Miembro | Descubrir, ejecutar y entender el resultado sin estudiar el bot |
| Moderador/soporte/DJ | Acciones de su área, contexto suficiente e historial pertinente |
| Gestor del servidor | Activar, configurar, previsualizar, publicar y diagnosticar |
| Operador de OBEY | Salud, configuración global, recuperación y trazabilidad sin mostrar secretos |

### Estados comunes y respuesta esperada

| Estado | Qué comunica y permite |
| --- | --- |
| Sin configurar | Qué falta y acceso directo al paso correspondiente |
| Listo | Información principal y acciones disponibles |
| Procesando | Operación aceptada, sin anunciar un efecto todavía no confirmado |
| Vacío | Motivo y acción útil para comenzar |
| Éxito | Resultado específico y siguiente paso cuando tenga sentido |
| Parcial/desconocido | Qué se confirmó, qué falta y cómo consultar o conciliar |
| Error | Explicación accionable, código de referencia y reintento seguro si corresponde |
| Sin permiso | Requisito concreto sin revelar información privada |
| Conflicto | Alguien cambió el recurso; revisar la versión actual antes de publicar |
| Degradado | Dependencia afectada y funciones que siguen disponibles |
| Caducado | Sesión terminada y forma de abrir una nueva |

Botones persistentes como abrir ticket o controlar el reproductor deben resolverse por un router estable y estado recuperable. Los menús temporales pueden caducar; sus controles se desactivan o responden claramente. No depender exclusivamente de collectors en memoria para paneles que deben sobrevivir reinicios.

Un `custom_id` identifica módulo, acción, versión y una referencia opaca de sesión. No contiene secretos. Cada pulsación revalida actor, guild, recurso, permisos y revisión. Conservar los doce IDs musicales antiguos durante su transición.

## 6. Recorridos prioritarios y criterios concretos

| Recorrido | Camino objetivo | Fallo o concurrencia que debe resolverse |
| --- | --- | --- |
| Inicio/configuración | Abrir asistente → idioma público → módulos existentes → roles/canales → preview → publicar → resumen | Canales eliminados, permisos insuficientes y publicación concurrente |
| Ayuda | Elegir objetivo → buscar/filtrar → detalle → ejemplo → ejecutar o configurar | Función desactivada, no cargada o sin permiso |
| Bienvenida | Elegir destino → editar texto/tarjeta → preview → publicar → evento real | Variable desconocida, imagen no disponible o cambio concurrente |
| Música | Buscar → elegir → validar voz → encolar → confirmar → controlar | Skip y fin simultáneos, búsqueda tardía, proveedor caído o 429 |
| Tickets | Elegir tipo → formulario → abrir privado → asignar → atender → cerrar → transcript | Doble apertura, permisos revocados y cierre simultáneo |
| Moderación | Elegir objetivo → acción → motivo/duración → confirmar cuando proceda → caso | Jerarquía de roles, efecto aplicado con respuesta perdida |
| Roles | Ver opciones → elegir → comprobar reglas → aplicar → confirmar | Varias fuentes conceden un rol; una retirada no elimina concesiones ajenas |
| Economía | Consultar → operar → confirmar saldo/recibo | Doble gasto, transferencia repetida o escritura parcial |
| Juegos/social | Iniciar → aceptar participantes → turnos → resultado → cerrar | Abandono, tiempo agotado o reinicio |
| Automatización | Evento → condiciones → acciones → validar → publicar → historial | Evento duplicado, bucle de ejecución o recurso eliminado |
| Architect/backups | Propuesta → comparar alcance → revisar permisos → aplicar → recibo | Aplicación parcial, falta de permisos y reversión limitada por Discord |

Confirmar acciones de impacto definido; no poner una pregunta adicional delante de cada botón cotidiano. Una confirmación debe describir el efecto, destino y alcance concretos.

## 7. UI compartida y recursos existentes

La identidad documentada para el bot usa personaje, navy/dorado y señales de cian. El inventario actual incluye recursos de producción, alias y propuestas antiguas; se eligen desde el catálogo canónico, no por ser la última imagen generada.

Reglas de composición:

- Información y acción antes que decoración. El personaje acompaña; no sustituye títulos ni resultados.
- Texto normal legible en Discord. Evitar alfabetos Unicode decorativos para navegación o instrucciones.
- Iconos de acción consistentes y etiquetas cuando haya ambigüedad. Un emoji ausente no debe impedir operar.
- Colores semánticos para peligro, éxito y advertencia; no convertir todo estado en dorado.
- Estados activos expresados también con texto. Los tamaños y posiciones se verifican en cliente móvil y escritorio.
- Imágenes de tarjetas con texto dinámico renderizado por el sistema, no incrustado en un fondo fijo.
- Animación solo donde tenga un uso concreto. Un GIF decorativo no representa por sí mismo la posición real de una canción.

### Componentes reutilizables de producto

Panel principal, cabecera de módulo, estado vacío, error con referencia, confirmación, paginador, selector de canal/rol, resumen de configuración, ficha de caso, ficha de ticket, reproductor y aviso de caducidad. Todos reciben datos, claves y acciones; no hacen consultas de negocio ocultas.

### Components V2 y límites de diseño

Usar V2 para composiciones nuevas que lo necesiten, comprobando primero la versión efectiva de discord.js del lockfile y la demostración existente. Mantener un adaptador legacy para mensajes no migrados.

La documentación oficial exige `IS_COMPONENTS_V2`; con esa bandera no funcionan `content` y `embeds` tradicionales, los adjuntos requieren componentes y hay hasta 40 componentes por mensaje. La bandera no se puede retirar después de enviarlo. Por ello la migración se decide por tipo de mensaje, sin mezclar formatos inválidos [D1].

Los mensajes nativos se diseñan con las capacidades de Discord: texto/Markdown, composición, estilos de botón admitidos, medios e iconos. El editor no ofrecerá CSS arbitrario o selección libre de fuente para los controles nativos. Las fuentes propias corresponden a imágenes renderizadas.

No se modifican avatar, banner o recursos globales de identidad como efecto secundario de renovar un panel.

## 8. Personalización por servidor

Separar tres alcances: valores globales de OBEY, configuración de cada guild y preferencias personales. Una escritura incluye su alcance explícito; los valores de un servidor nunca se convierten en defaults globales por accidente.

### Campos editables previstos

| Grupo | Ejemplos | Validación |
| --- | --- | --- |
| Activación | Función habilitada y requisitos pendientes | Capacidad disponible y política de desactivación |
| Idioma | Idioma público y preferencias de módulos autorizadas | Catálogo disponible; no solo nombre de archivo |
| Destinos | Canales de avisos/tickets/logs y roles de operación | Guild correcta, existencia y permisos efectivos |
| Presentación | Texto permitido, acento, recursos seleccionados y tarjeta | Límites de Discord, contraste y claves del registro |
| Reglas | Cooldowns, permisos DJ, límites y condiciones | Contrato del módulo y límites operativos |
| Variables | Nombre de miembro, servidor y datos permitidos por plantilla | Lista permitida; campos privados según audiencia |

Los overrides se guardan por clave e idioma y distinguen ausencia, texto vacío permitido y valor explícito. La herencia se explica en la interfaz. Los mensajes de seguridad y errores internos no se convierten en plantillas arbitrarias del servidor.

### Recorrido único de edición

Editar → validar → guardar borrador → previsualizar con datos de ejemplo identificados → revisar diferencias → publicar con revisión esperada → confirmar lo persistido.

Guardar borrador y activar en el servidor son acciones diferentes. La preview usa el mismo contrato y renderer del envío real. Si otro gestor publica entre medias, se informa el conflicto en vez de sobrescribirlo silenciosamente.

Permitir restaurar un campo a su default y exportar/importar configuración revisable como mejora posterior. Una importación valida versión, guild destino, referencias, permisos y diferencias antes de escribir; no copia secretos o IDs de otro servidor sin conciliarlos.

Desactivar tiene significado por módulo: bienvenida deja de producir nuevos avisos; tickets conserva atención de abiertos según política; música define drenaje o detención explícita. Nunca borrar datos como efecto automático de apagar un interruptor.

## 9. Sistema multidioma completo

La igualdad de cantidad de claves no prueba calidad, uso efectivo, pluralización o ausencia de español incrustado. La migración cubrirá comandos, opciones, ayuda, mensajes, botones, modales, errores de dominio, formatos, tarjetas y respuestas de jobs.

### Política de selección propuesta

| Audiencia | Precedencia |
| --- | --- |
| Mensaje público compartido | Override autorizado del módulo → idioma de la guild → español de OBEY |
| Respuesta privada/efímera | Preferencia explícita del usuario → locale de la interacción → idioma de la guild → español |
| DM sin guild | Preferencia del usuario → locale disponible → español |
| Trabajo diferido | Revalidar idioma y revisión al entregar según contrato del módulo; registrar la resolución usada |

Un usuario que abre letras en privado puede recibirlas en su idioma de interfaz; pulsar un botón no cambia el idioma del reproductor público de todos. No traducir títulos musicales, nombres propios, motivos escritos por moderadores o mensajes del usuario sin una función explícita para ello.

### Estructura y compatibilidad

- Claves semánticas estables por módulo y operación. La organización física puede separarse por módulo al migrarlo, manteniendo un único resolvedor público.
- Locale interno con región cuando corresponda: `pt-BR`, `en-US`, etc. Mantener un mapa explícito hacia los locales admitidos por Discord para registrar comandos.
- Fallback de variante a idioma base y después al default; no reducir todos los locales a dos letras de forma irreversible.
- Un único puente de claves legacy a canónicas. No una segunda copia de cada texto en cada comando.
- Variables verificadas con el mismo contrato para ES y traducciones; escaping y `allowed_mentions` según destino.
- Plurales y formatos de fecha/número con una implementación acordada; no componer frases concatenando fragmentos traducidos.
- Zona horaria configurada y persistida aparte del idioma.
- `name_localizations` y `description_localizations` para slash y opciones; IDs y lógica estables independientemente del nombre mostrado [D3].

### Despliegue lingüístico propuesto

Primero cerrar ES y EN para las capacidades de la primera entrega. Portugués de Brasil es un candidato de ampliación, no un idioma ya aprobado o implementado. Los archivos DE/`in` existentes se conservan durante la conciliación y se etiquetan por cobertura real antes de anunciarlos.

Cada idioma publicado necesita revisión lingüística y todos los recorridos soportados. Las traducciones de ejemplo o automáticas sin revisión se identifican como borrador. Añadir idioma nuevo implica catálogo, mapeo de comandos, revisión de variables, textos largos y validación en Discord; no tocar el dominio de negocio.

## 10. Música: decisiones que no deben mezclarse con UI

El usuario eligió explícitamente `lavalink-client` durante esta planificación. El destino es sustituir el uso directo de Shoukaku por `lavalink-client` detrás de una API musical de OBEY. La sesión actual sirve como referencia de comportamiento hasta completar la migración. La elección está confirmada; la versión concreta y la compatibilidad deben verificarse al implementar.

### Elección confirmada y alternativas consideradas

`lavalink-client` es la biblioteca seleccionada. Documenta colas con almacenamiento extensible, adaptación Lavalink/NodeLink y controles de reproductor [A2, A3]. La selección no demuestra por sí sola una mejora de rendimiento: se comprobarán las funciones reales, recuperación y métricas antes de dar por terminada la migración.

| Alternativa | Hecho comprobado en fuentes oficiales | Papel en la decisión |
| --- | --- | --- |
| Kazagumo | Wrapper de Shoukaku con cola y plugins; su paquete declara Shoukaku como dependencia [A1] | Alternativa considerada; no se incorpora al plan elegido |
| `lavalink-client` | Colas con store extensible, filtros, validaciones y adaptación para NodeLink; su paquete no declara Shoukaku [A2, A3] | Destino confirmado de la migración |
| Otras bibliotecas | La lista oficial incluye varias opciones Node.js con soporte DAVE [A4] | Referencia comparativa; no se añaden clientes competidores |

La documentación de `main` puede adelantarse al paquete publicado. Fijar una versión liberada, comprobar que contiene las APIs elegidas y validar CommonJS, Node y nodos reales antes de cambiar el lockfile. El soporte de fuentes/plugins depende también del nodo.

### Frontera musical independiente del proveedor

Crear una API pequeña de OBEY para conectar, buscar, encolar, reproducir, pausar, seek, detener, leer estado y administrar filtros. Comandos y paneles consumen esa API; los objetos de la biblioteca permanecen dentro del adaptador.

Elegir una única autoridad de cola, un mapping de persistencia y un responsable de cada transición. No avanzar pistas simultáneamente desde una cola propia y la de la biblioteca. Las reglas de autoplay, permisos, favoritos y publicación permanecen explícitas en OBEY.

Inventariar referencias a `client.shoukaku`, eventos de player/nodo, extensión de `Player`/`Rest`, selección de nodos y cierre antes de sustituirlos. Se encontraron referencias directas en `handlers/music/index.js`, `node-session.js`, `node-player.js` y `player-events.js`. La conexión examinada usa `shardId: 0`; derivar el shard real de la guild antes de admitir despliegues fragmentados.

### Aceptación de la sustitución

1. Mantener búsqueda, playlists, cola, pausa, volumen, filtros, loop, autoplay, favoritos, letras y los doce controles del alcance vigente.
2. Distinguir reconexión del WebSocket, reanudación de sesión conservada por el nodo, reconstrucción tras reinicio del bot y recuperación tras pérdida del nodo. Cada escenario necesita su comprobación; la guía de resuming de la biblioteca es un punto de partida [A5].
3. Verificar voz/DAVE y la combinación exacta de cliente, nodo, fuente y plugins; anunciar Lavalink/NodeLink solo para combinaciones comprobadas.
4. Comprobar fin/skip simultáneos, stop durante búsqueda, respuesta perdida, caída de nodo y reinicio con cola sin reproducción duplicada.
5. Comparar tiempos, errores, memoria y recuperación con la base actual bajo escenarios equivalentes; medir publicación Discord aparte.
6. Activar un solo adaptador por guild en cada momento. El anterior permite volver atrás de forma controlada, sin conectar dos reproductores simultáneos.
7. Retirar Shoukaku como dependencia directa cuando todos sus consumidores hayan migrado a `lavalink-client` y la recuperación esté comprobada. No añadir Kazagumo ni mantener dos gestores activos para la misma guild.

Separar tres problemas:

| Problema | Dueño y medición |
| --- | --- |
| Cortes o continuidad del audio | Nodo, fuente, red, eventos de voz y recuperación; registrar causa y resultado |
| Tiempo de una acción | Recepción de interacción, autorización, cola de acción, llamada al nodo y confirmación |
| Tiempo hasta ver el panel actualizado | Publicador de mensajes, límites REST y render del cliente Discord |

El `HANDOFF.md` actual informa ediciones lentas y respuestas 429. Cambiar una dependencia de audio no acredita resolver ese retraso de publicación.

### Publicación y estado

- Una autoridad de estado musical por guild y versión de sesión. Lecturas consistentes del reproductor, cola, favoritos y letras.
- Una cola serial de acciones por sesión cuando haga falta; deduplicar fin/skip y rechazar respuestas de búsquedas invalidadas por stop.
- Una coordinación de publicación por mensaje para reproductor y sus estados relacionados. Agrupar actualizaciones obsoletas; una actualización de progreso no adelanta una respuesta de control pendiente.
- ACK temprano y respuesta final basada en resultado confirmado. Discord exige respuesta inicial dentro de tres segundos; los tokens de interacción duran quince minutos [D2]. Abrir modales usa su respuesta inicial válida, no un defer indiscriminado.
- Usar respuestas de interacción donde sea correcto y medirlas; no prometer que evitan todos los límites.
- Manejar 429 con `Retry-After`/`retry_after`, sin bucles de reintento paralelos [D4].
- Reloj anclado a posición confirmada del nodo y estado de pausa/seek. No representar progreso por la edad de un GIF.
- La cadencia de progreso será adaptativa y definida tras medición; no se fija una promesa de actualizaciones por segundo.
- Cola manual antes de autoplay; favoritos privados con audiencia validada.

### Escala futura

Dimensionar por sesiones de audio simultáneas, peticiones por segundo, distribución regional y presupuesto, además del número de guilds. Preparar un propietario único por guild, aislamiento de datos y trabajo recuperable; la coordinación distribuida y el fencing se incorporan antes de ejecutar varios propietarios potenciales.

El número de servidores instalados no demuestra capacidad para millones de reproducciones. Cualquier afirmación de escala requiere pruebas de carga y capacidad de los nodos, sin depender de una lista de nodos públicos como garantía de continuidad.

## 11. Datos, seguridad y operación

Mongo/Mongoose permanece como persistencia principal de las capacidades actuales. No convertir una caché local en autoridad de saldos, tickets o acciones de moderación. Aplicar CAS, índices únicos o transacciones según la operación y topología comprobadas.

Los trabajos durables reutilizan BullMQ/Redis donde ya están justificados. Un evento de UI no sustituye la confirmación del cambio. El fallo de una dependencia opcional se expresa como degradación; la política de arranque/cierre concilia lo descrito en `bootstrap` antes de adoptarse.

Autorización por operación y recurso, incluidas interacciones antiguas, transcripciones, archivos y rutas compartidas. Revalidar permisos revocados. Canales privados de tickets y notas internas no se muestran por errores, traducciones o previews públicas.

Observabilidad con identificadores, duración y resultado estable; no incluir tokens, contenido privado o credenciales en logs. Conservar Sentry y el logger existentes mientras se define una interfaz estructurada. Estados de salud distinguen proceso vivo de dependencias y capacidades listas.

Retención y acceso definidos por tipo de dato. Los backups especifican qué recuperan y qué no puede deshacerse en Discord. Una recuperación no reactiva NSFW ni sobreescribe las credenciales actuales.

## 12. Orden de ejecución

Esta versión consolida decisiones; la fuente de avance seguirá siendo la guía existente y sus IDs `ARCH-*`/`MOD-*`. Al incorporar este plan se actualizan esos documentos y se retiran contradicciones; no se añaden 32 listas paralelas sin dueño.

| Etapa | Trabajo | Condición para avanzar |
| --- | --- | --- |
| 0 · Conciliación | Fijar base remota/local, diferencias, recursos canónicos y alcance | Una base identificable; cambios del usuario preservados |
| 1 · Fundaciones | Extender registro, contexto, permisos, router, presentación e idioma; piloto completo de bienvenida | Un recorrido que configura, previsualiza, publica y entrega con concurrencia controlada |
| 2 · Descubrimiento y edición | Ayuda, asistente y editor nativos usando el piloto | Miembro y gestor completan tareas sin depender de documentación interna |
| 3 · Música | Implementar frontera de audio, integrar `lavalink-client`, migrar consumidores de Shoukaku y consolidar publicaciones/mediciones | Funciones preservadas, recuperación comprobada y retrasos restantes medidos y declarados |
| 4 · Operaciones | Tickets, moderación, roles, logs y seguridad por recorridos completos | Permisos, privacidad y recuperación de cada recorrido comprobados |
| 5 · Comunidad | Niveles, perfil, economía, juegos y comunicaciones | Datos/concurrencia y experiencia ES/EN cerrados para el alcance elegido |
| 6 · Automatización | Architect, plantillas, jobs y automatizaciones según capacidades confirmadas | Operaciones largas recuperables, diff y resultados parciales claros |
| 7 · Candidato de entrega | Integración, instalación limpia, comprobación conectada y empaquetado | Matriz final completa con evidencia y pendientes explícitos |

El primer módulo piloto será bienvenida: ya existe una base de borradores, publicación y tarjetas que permite comprobar edición, permisos, datos, idioma y presentación en un recorrido acotado. La música recibe diagnóstico y contrato de sustitución tempranos; la integración de la biblioteca elegida se verifica en su propia etapa.

## 13. Verificación proporcionada y criterio de terminado

Respetar la limpieza registrada en `HANDOFF.md`: no restaurar la batería masiva de pruebas y verificadores retirados ni generar herramientas auxiliares como fin del proyecto. Mantener las pruebas originales y seleccionar verificaciones necesarias para cambios críticos. Los criterios escritos no se contabilizan como tests ejecutados.

Un módulo se cierra solo cuando:

1. Se conocen entradas, consumidores y autoridad de datos del alcance entregado.
2. Todas las entradas de ese alcance usan el mismo servicio y política.
3. Hay recorrido feliz, vacío, error, permiso insuficiente, caducidad y concurrencia relevantes.
4. Las respuestas ES/EN y las personalizaciones respetan límites, audiencia y variables.
5. El recurso visual proviene del registro y tiene fallback válido.
6. Se conserva compatibilidad de datos e interacciones necesarias; las migraciones son recuperables.
7. Existe evidencia del entorno utilizado y se diferencia simulación, local y servicio real.
8. La ficha de migración, operación y cambios queda actualizada.

Pruebas de aceptación del sistema: dos guilds con configuraciones e idiomas distintos; usuario con locale distinto al público; dos gestores editando; doble pulsación; reinicio con panel persistente; pérdida de permisos; proveedor caído; nombres/textos largos; cliente móvil y escritorio.

Objetivos operativos se fijan tras baseline: registrar tiempos de ACK, ejecución, confirmación y publicación por separado; comparar percentiles y tasa de errores bajo una carga descrita. No declarar «sin lag», «audio sin pérdida» o «millones de servidores» a partir de una prueba local.

## 14. Composición del ZIP definitivo

| Contenido | Requisito |
| --- | --- |
| Proyecto completo integrado | Fuente de la base elegida y cambios terminados; una carpeta principal |
| Dependencias reproducibles | `package.json`, lockfile y versión de Node conciliados; instalación limpia comprobada |
| Recursos | Assets realmente necesarios, registro y licencias; fuentes para tarjetas cuando correspondan |
| Idiomas | Catálogos publicados y puente legacy; cobertura y estado de revisión documentados |
| Configuración de ejemplo | Nombres y ejemplos sin credenciales ni estado privado |
| Guía de entrada | `LEER_PRIMERO.md`: qué instalar, configurar, ejecutar y comprobar |
| Manual de edición | Matriz de dónde cambiar texto, asset, regla, permiso, módulo e idioma |
| Arquitectura y decisiones | Diagramas/contratos útiles, autoridad de datos y límites de imports |
| Cambios y migración | Base exacta, diferencias, datos afectados y recuperación |
| Estado final | Implementado y probado, probado parcialmente, diferido y limitaciones |

Excluir `.env` real, tokens, sesiones, backups privados, datos de producción, `node_modules`, `.git`, cachés y temporales como el archivo parcial de plugin encontrado. Validar integridad del ZIP, extracción, rutas relativas y referencias de `LEER_PRIMERO.md` antes de entregar.

Las credenciales y mapas privados no se inventan ni se recuperan de copias históricas para llenar el paquete. Si un paso necesita acceso de ejecución que no está disponible, se deja explícitamente pendiente y el paquete se denomina candidato; no se anuncia verificación completa.

## 15. Matriz de edición cotidiana objetivo

| Quiero cambiar… | Lugar previsto | Qué debería permanecer estable |
| --- | --- | --- |
| Un texto de OBEY | Clave del catálogo del módulo | IDs, permisos y reglas de negocio |
| Un texto de mi servidor | Override validado de esa guild/idioma | Defaults globales y otros servidores |
| Un icono | Entrada del registro canónico y su recurso | Consumidores por clave y fallback |
| La disposición de un panel | Componente de presentación del módulo | Operación y autoridad de datos |
| Una regla de tickets | Servicio/política de tickets | Transporte Discord y contratos ajenos |
| Un permiso | Política de la operación | Traducciones y datos del usuario |
| Un idioma nuevo | Catálogo, mapa de locales y revisión | Dominio del módulo |
| Una fuente musical | Adaptador/proveedor y configuración autorizada | Interfaz de operaciones y sesión única |
| Un módulo | Implementación y contrato público registrado | Núcleo y capacidades ajenas |

## 16. Plan ampliado e implementación siguiente

Esta edición concreta la arquitectura, contratos de operación, UX/UI, configuración, idiomas, recursos, música con lavalink-client, datos y operación en los [20 capítulos del sistema](docs/guia-arquitectura/sistema/00_INDICE.md). Las 32 fichas existentes se ampliaron en su ubicación original con operaciones, configuración, invariantes, UI y criterios específicos. No se generó otra colección de módulos.

Código remoto revisado en esta ampliación: dependencias, registros de capacidades/comandos, configuración común, manifest musical, eventos del reproductor, publicador y registros de assets. El árbol estático se inventarió por categorías; no se auditó línea por línea cada comando ni se ejecutaron servicios conectados.

El ZIP contiene el proyecto base previo, sus materiales y la guía vigente integrada. El código no se remodeló en esta entrega: Shoukaku sigue en la base y su sustitución está documentada. No se presenta como implementación terminada, prueba conectada o despliegue.

La base canónica se concilia al iniciar desarrollo entre remoto y bootstrap local. Primera unidad: bienvenida/configuración como recorrido completo. Música tiene contrato concreto de sustitución, cola única, loop/shuffle/autoplay, recuperación y conservación de doce controles. Los demás módulos se cierran por sus fichas con evidencia, sin anunciar propuestas diferidas como funciones disponibles.

El catálogo vigente se integra en `assets/obey/catalog-eventos/`: equivalentes propios para 113 tipos de registro documentados y cuatro auxiliares, con variantes dorada/por estado, 234 PNG y 234 SVG. El [capítulo 15](docs/guia-arquitectura/sistema/15_CATALOGO_EVENTOS.md) fija precedencia, mapa de consumidores e integración. La muestra anterior de 24 iconos de registros se retiró; se conservan tres escenas y seis GIF en expansion-20261020. No se acreditó un inventario completo de emojis originales de Quark. Los recursos están incluidos para implementar, sin IDs inventados, binding runtime o publicación Discord.

## Fuentes y precedencia

Primero instrucciones actuales del usuario; después código y estado de la rama/base conciliada; después contratos vigentes; los informes históricos aportan contexto y no reemplazan una comprobación actual.

- [Base remota y estado de entrega](https://github.com/melodiabl/OBEY-YOUR-MASTER/blob/c8ba6d3ee86515813e68a028e1221d093301e91b/docs/platform/HANDOFF.md).
- [Dependencias declaradas](https://github.com/melodiabl/OBEY-YOUR-MASTER/blob/c8ba6d3ee86515813e68a028e1221d093301e91b/package.json).
- [Resolvedor i18n actual](https://github.com/melodiabl/OBEY-YOUR-MASTER/blob/c8ba6d3ee86515813e68a028e1221d093301e91b/handlers/i18n/index.js).
- [Registro de capacidades](https://github.com/melodiabl/OBEY-YOUR-MASTER/blob/c8ba6d3ee86515813e68a028e1221d093301e91b/handlers/feature-registry.js).
- [Manifest musical actual](https://github.com/melodiabl/OBEY-YOUR-MASTER/blob/c8ba6d3ee86515813e68a028e1221d093301e91b/handlers/music/manifest.js).
- D1: [Discord · Component Reference](https://docs.discord.com/developers/components/reference), consultado el 17/10/2026.
- D2: [Discord · Receiving and Responding to Interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), consultado el 17/10/2026.
- D3: [Discord · Application Commands](https://docs.discord.com/developers/interactions/application-commands), consultado el 17/10/2026.
- D4: [Discord · Rate Limits](https://docs.discord.com/developers/topics/rate-limits), consultado el 17/10/2026.
- A1: [Kazagumo · repositorio oficial](https://github.com/Takiyo0/Kazagumo) y [dependencias](https://github.com/Takiyo0/Kazagumo/blob/main/package.json), consultados el 17/10/2026.
- A2: [lavalink-client · funciones y NodeLink](https://github.com/Tomato6966/lavalink-client), consultado el 17/10/2026.
- A3: [lavalink-client · paquete y exports](https://github.com/Tomato6966/lavalink-client/blob/main/package.json), consultado el 17/10/2026.
- A4: [Lavalink · lista oficial de clientes](https://lavalink.dev/clients), consultado el 17/10/2026.
- A5: [lavalink-client · resuming](https://tomato6966.github.io/lavalink-client/extra/resuming/), consultado el 17/10/2026.

Las decisiones de diseño están expresadas como objetivos o propuestas. Los conteos provienen de inspección estática y no certifican calidad, funcionamiento o despliegue.

## Actualización integrada 0.6 · 20/10/2026 UTC

La entrega principal ya contiene el catálogo seleccionado; no hay que combinar ZIPs. [MATERIALES.md](MATERIALES.md) es el acceso único a galerías, manifiestos y estado. Se actualizaron las 32 fichas y las guías de UI, configuración, idiomas, recursos, aceptación e instrucciones para IA.

Los IDs de tipos de referencia no son IDs de emojis. El mapa propone claves semánticas estables de OBEY; se concilian con el resolvedor existente antes de cargar recursos. Los cuatro originales públicos de Quark aparecen solo en una lámina de investigación atribuida; no se publican como recursos propios.

Esta actualización integra materiales/documentación y retira únicamente muestras visuales de registros sin consumidores. No cambia código runtime, dependencias, datos, Soundy, avatar/banner o landing. La migración lavalink-client y la publicación de recursos tienen sus pasos pendientes explícitos.


## Ampliación integrada 0.7 · catálogo y mapa de consumidores

A01–A12 y sus animaciones fueron aprobados por el usuario y se integraron como archivos en assets/obey/ui-state-catalog. La extensión añade 65 familias B (130 PNG, 65 SVG, 16 GIF) y 14 propuestas de plataformas con fuentes Simple Icons; C15/JioSaavn conserva la base con su procedencia nueva pendiente. B/C mantienen revisión visual pendiente. Personaje, tarjetas y recursos previos se conservan.

La galería unificada, el mapa por 32 fichas y los capítulos 16–19 definen estados, consumidores, recetas, ES/EN y publicación. Los deltas tienen 470 hojas por idioma y no están cargados por el runtime.

Se examinó estáticamente el alcance de 1050 archivos y se registraron 11866 apariciones, 1030 referencias de assets, 676 llamadas de componentes y 23 referencias calculadas. Cada fila conserva archivo, línea, columna, hash, clave y destino de material. No se interpreta ese conteo como reemplazos necesarios. El conteo actual de idiomas incluye strings de arrays; consultar translation-summary.json frente a las métricas históricas.

La revisión humana específica documenta nueve hallazgos en siete archivos, incluidos los selectores musicales divergentes y la separación entre markup de mensajes y objetos de componentes. No se afirma revisión semántica manual completa de todos los comandos. El backend, las dependencias y los datos de la base permanecen sin cambios en esta ampliación. La publicación de emojis, binding runtime, correcciones musicales y migración lavalink-client continúan como implementación pendiente.

La rama remota consultada conserva c8ba6d3ee86515813e68a028e1221d093301e91b. No se mezcló el checkout local con cambios no conciliados. El ZIP principal incluye la ampliación completa y no requiere aplicar un parche.

Se trazaron además las 23 referencias calculadas: veinte sitios de claves/defaults y tres accesos de imágenes administradas por guild, que no son emojis. Consultar dynamic-resolution.json. La traza es estática y no acredita ejecución conectada.

## Build y remodelación · ampliación autorizada 0.8

El usuario pidió remodelar Build tomando como referencia el constructor Server Maker (escrito «Server Market» en el encargo). La identificación se apoya en las capturas previas y las fuentes públicas del autor; no se inspeccionó código privado ni se ejecutó el producto externo.

Documento de implementación: [capítulo 20](docs/guia-arquitectura/sistema/20_BUILD_Y_REMODELACION.md). Evidencia: [investigación](docs/guia-arquitectura/build/INVESTIGACION_SERVER_MAKER.md). Contratos y **53 textos por idioma ES/EN**: [Build](docs/guia-arquitectura/build/LEER.md).

Architect continúa como autoridad única: centro Discord, asistente guiado o IA, creación puntual, edición, temas, plantillas, clonación autorizada de estructura, conexiones a módulos e historial/compensación revisada. Conservar recursos por defecto, validar permisos y revisión en cada fase, registrar operaciones e IDs reales y conciliar resultados inciertos. No prometer restaurar mensajes ni crear canales privados temporalmente públicos.

Esta ampliación permite desarrollar los casos definidos y `/servidor` pese a la restricción general anterior de no añadir funciones durante la reorganización. No añade otros bots ni habilita borrados, publicación remota o despliegue. El runtime y dependencias se conservan; los estados de la entrega 0.7 siguen vigentes. No hay nuevos PNG/GIF: el contrato usa los recursos existentes y mantiene las aprobaciones previas.

## Nombres públicos · decisión 0.9

El usuario rechaza comandos llamados Architect por falta de claridad. La entrada objetivo pasa a **`/servidor`** (inglés: `/server`), panel **Servidor**, con acciones Construir, Remodelar, Crear un recurso, Plantillas, Copiar estructura, Copias de seguridad e Historial. El parámetro opcional `accion` permite acceso directo; no se añaden subcomandos que impidan abrir el panel con el comando solo.

[Capítulo 21](docs/guia-arquitectura/sistema/21_NOMBRES_CLAROS.md) y [contrato de nombres](docs/guia-arquitectura/build/comandos-propuestos.json) sustituyen la propuesta pública anterior. El identificador técnico del módulo y sus datos permanecen hasta su migración conciliada. Actualizar ayuda y registro público al implementar; esta edición no cambia el runtime ni registra comandos.

## Servidor de soporte e integración GitHub · edición 0.10

El video del usuario muestra la organización existente de la comunidad. [Capítulo 22](docs/guia-arquitectura/sistema/22_COMUNIDAD_Y_GITHUB.md) define el perfil separado de soporte, mapeo por ID, audiencias propuestas, comandos por permiso y recorridos de bienvenida, música, tickets, registros, estado y publicaciones. [Mapa y plantilla](docs/guia-arquitectura/comunidad/LEER.md) incluyen destinos observados sin IDs inventados y textos ES/EN pendientes de integración.

Para avisos técnicos se elige primero el webhook nativo GitHub → Discord hacia un destino de equipo confirmado. No requiere otro bot ni un nuevo receptor en OBEY. Los anuncios públicos se revisan y no confunden commit, release y despliegue. Un receptor propio con marca/filtros avanzados es extensión condicional de feeds/jobs, no implementación acreditada. Se conserva `/servidor` como entrada clara. Runtime, dependencias y materiales existentes permanecen; no se publicaron mensajes ni se conectaron cuentas.

## Mensajes autorizados · edición 0.11

El usuario autorizó incorporar los seis mensajes de los recorridos de su comunidad: CM01 conexión de canales, CM02 bienvenida, CM03 panel de soporte, CM04 confirmación de reporte, CM05 aviso técnico GitHub personalizado y CM06 novedades públicas revisadas.

[Mensajes completos](docs/guia-arquitectura/comunidad/MENSAJES_DE_LA_COMUNIDAD.md) y [capítulo 23](docs/guia-arquitectura/sistema/23_MENSAJES_DE_COMUNIDAD.md) definen contenido, controles, materiales, estados y condiciones. Se añaden 76 claves por idioma bajo `community.messages`, manteniendo las 16 previas del perfil y otros deltas. El mensaje GitHub personalizado requiere adaptador propio; no altera la elección inicial de webhook nativo. Los anuncios de disponibilidad exigen evidencia del alcance del despliegue.

Estado: documentación y catálogos de diseño incorporados; código, dependencias y datos conservados. No se enviaron mensajes, publicaron comandos, subieron emojis o conectaron webhooks.

## Aprovechamiento nativo de Discord · edición 0.12

El usuario autorizó incorporar la investigación de capacidades Discord. [Capítulo 24](docs/guia-arquitectura/sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) define 18 capacidades, matriz para las 32 fichas y nueve recetas de implementación: comandos/localización, autocomplete/contexto, selectores y formularios modernos, V2 por vista, emojis de aplicación, tiempos relativos, respuestas privadas, estado de voz, encuestas, eventos, AutoMod, hilos y registros/integraciones.

[Compatibilidad](docs/guia-arquitectura/discord-nativo/COMPATIBILIDAD.md) observa discord.js 14.27.0 y builders 1.14.1 en lockfile. La raíz permite Node >=20, mientras voice 0.19.2 requiere >=22.12.0; resolver el contrato de runtime y validar el grafo instalado antes de desplegar. No se instalaron ni actualizaron dependencias en esta entrega.

Se incluyen 30 textos ES/EN de diseño y [contratos/recetas](docs/guia-arquitectura/discord-nativo/LEER.md), con propietario, permisos, disponibilidad y aceptación. La edición amplía el alcance definido; no afirma cubrir toda la API ni habilita dominios diferidos automáticamente. Soundy y sus doce IDs, datos, materiales y servicios base se conservan. Código y efectos externos siguen pendientes de implementación y pruebas por unidad.

## Cobertura de cambios solicitada · edición 0.13

El usuario solicita asegurar la cobertura de cambios de Discord. [Capítulo 25](docs/guia-arquitectura/sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) incorpora clasificación de 82 entradas de recepción Gateway y 69 acciones de auditoría documentadas, revisión individual de 117 materiales y siete hallazgos de la base. Cada referencia tiene disposición de diseño; ninguna se declara probada por estar en una matriz.

El logger actual suprime cambios de flags de voz y usa comparaciones excluyentes para algunos campos de canales/roles; falta garantía de persistencia/entrega en su helper. La implementación debe registrar todas las diferencias observadas, distinguir antes ausente, correlacionar actor solo con evidencia, habilitar consumidores/intents por alcance y mostrar huecos de captura. La eliminación de mensajes no recupera contenido no retenido; los límites de la API y permisos son parte del contrato.

Se añaden 24 textos ES/EN para estados de captura, matrices CSV/JSON y evidencia de fuentes/archivos. Código y dependencias se conservan. No se capturaron datos reales ni se actualizaron listeners/intents en esta entrega.


## Ampliación vigente 0.14: investigación y preparación para crecer

Leer [investigación y arquitectura de crecimiento](docs/guia-arquitectura/investigacion-20261022/00_LEER_PRIMERO.md). Incluye 20 bots seleccionados por categorías, fichas con evidencia y límites, siete archivos leídos de cuatro repositorios, ocho imágenes inspeccionadas y propuestas aplicadas a los 32 módulos. Se incorporan arquitectura de varios VPS, Top.gg v1, suscripciones/entitlements, seis locales semilla y orden del repositorio. Esta sección amplía las exclusiones anteriores de planificación comercial/multi-VPS; no activa funciones de pago ni despliegues.

La rama remota se volvió a comprobar el 22/10/2026 y conserva el SHA c8ba6d3ee86515813e68a028e1221d093301e91b. El inventario nuevo registra 674 archivos candidatos a comandos, no 674 comandos funcionales o registrados. Los criterios de aceptación y el backlog permanecen pendientes hasta ejecutar los recorridos con el backend y Discord.

Se añadieron cuatro propuestas originales NX01–NX04, 16 PNG, ocho SVG y dos GIF para voto, suscripción, acceso y traspaso. No se publicaron en Discord ni se aprobaron por el usuario todavía. Las ocho imágenes de competidores quedan solo en investigación con fuentes/avisos; nunca son recursos de producción OBEY. Soundy y materiales anteriores se preservan.

No se promete soporte para todas las acciones de Discord: la cobertura depende de eventos expuestos, permisos/intents autorizados y datos observables. Tampoco un segundo VPS transfiere mágicamente memoria, reproductores o datos. Los contratos exigen propiedad explícita, persistencia, idempotencia y recuperación.


## Materiales 0.15 · primera ampliación tras la investigación

Se añadieron doce variantes de eventos dorado/azul con animación, vinculadas a las claves del catálogo actual; 24 PNG estáticos, 12 SVG editables y 12 GIF transparentes. Se generó además una ilustración PNG de tickets tomando como referencia el personaje actual. Galería, ejemplos y reglas en [materiales-20261022](docs/guia-arquitectura/materiales-20261022/LEER.md). Son propuestas pendientes de aprobación, sin IDs reales, sin publicación y sin cambio de backend. El personaje anterior y los recursos A aprobados se conservan.

Una animación no activa un efecto de negocio ni se inicia por sí sola al pulsar un botón. El backend debe confirmar el estado y actualizar la presentación cuando corresponda; estático y texto siguen disponibles. Los GIF de logs representan eventos, no audio grabado o una medición en vivo.

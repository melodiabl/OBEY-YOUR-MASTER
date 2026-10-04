# OBEY Your Master — Prompt maestro integral para Codex

Adjunta este documento, el ZIP `OBEY_Diseno_Completo_Codex.zip` y, si es posible, los siete documentos de contexto originales. Este prompt reemplaza las versiones anteriores que reducían el proyecto a una renovación visual de funciones existentes.

## Prompt para ejecutar

Actúa como responsable técnico de OBEY Your Master. Audita y desarrolla el proyecto como una plataforma completa para construir, configurar, decorar, administrar y operar servidores de Discord. Discord y la aplicación web autenticada son dos interfaces de la misma plataforma.

Implementa por fases verificables. No te limites a emitir recomendaciones, copiar recursos gráficos o desarrollar formularios sin lógica conectada. Tampoco intentes una reescritura total de una sola vez.

### 1. Repositorio, alcance y autorización

Repositorio: `melodiabl/OBEY-YOUR-MASTER`.
Rama base elegida: `feat/motor-soundy`.

Lee las instrucciones y todos los AGENTS.md aplicables. Verifica el estado actual y crea una rama de trabajo basada en la rama elegida. Preserva cambios ajenos. Prepara uno o varios PR hacia esa base según el tamaño real del trabajo. No fusiones ni despliegues en producción.

Esta autorización comprende auditoría, planificación, implementación incremental, documentación, pruebas y preparación de PR. No comprende aplicar diseños sobre servidores reales de usuarios, ejecutar restauraciones, publicar plantillas de terceros o gastar en servicios externos. Implementar los controles de esas operaciones sí forma parte del alcance; probarlas sobre un servidor expresamente autorizado es una actividad distinta.

El alcance incluye funcionalidades nuevas descritas aquí. Que un sistema no exista todavía es motivo para planificar e implementar su núcleo funcional, no para excluirlo automáticamente. Una imagen aislada del ZIP, en cambio, no autoriza por sí sola cualquier función imaginable.

No cambies de motor musical ni de base de datos por preferencia personal. No supongas versiones de Node, discord.js ni cantidades de comandos a partir de textos anteriores: compruébalas en el repositorio actual.

### 2. Fuentes y resolución de contradicciones

Lee los siete documentos originales y el ZIP. Trata sus afirmaciones sobre productos externos, límites de Discord y versiones de librerías como antecedentes que requieren verificación cuando sean relevantes para implementar.

Orden de decisión:
1. Requisitos explícitos de este prompt y correcciones posteriores del usuario.
2. Compatibilidad y comportamiento real del repositorio.
3. Recursos aprobados del ZIP.
4. Propuestas históricas, como contexto para detalles no contradichos.

Resuelve expresamente estas contradicciones:
- Conserva el landing público. No lo rediseñes como parte de esta tarea.
- La zona autenticada necesita capacidades de producto completas y mejoras de UX. Reutiliza su identidad visual válida; no le impongas la paleta del personaje ni rehagas colores por sistema.
- Dentro de Discord sí utiliza los recursos aprobados con el personaje. La sugerencia histórica de no usar su rostro no debe anular la aprobación posterior del paquete.
- No adoptes el violeta histórico como nueva marca obligatoria.
- Mantén los identificadores musicales existentes aunque incorpores un router nuevo.
- No prometas restauración exacta de IDs, mensajes o datos que Discord no permita recuperar.
- Las capacidades nuevas explícitas forman parte del roadmap; no las rebajes a «solo maqueta» porque aún no hay backend.

Lee del ZIP README.md, PARA_CODEX.md, VER_TODO.html, la auditoría, VALIDATION.json, los contratos, los helpers y los recursos. Los helpers son referencias para adaptar, no componentes ya probados dentro del bot.

### 3. Referencias conceptuales y diferenciación

Usa las siguientes referencias para estudiar profundidad funcional y flujos, no para copiar marcas, código sin licencia, assets o interfaces literalmente:

| Dominio | Referencias de los documentos | Patrón a desarrollar |
|---|---|---|
| Administración | Carl-bot, Dyno | Organización modular, roles, configuración y casos |
| Seguridad | Wick | Anti-raid, anti-nuke, quarantine, gate y lockdown |
| Onboarding | MEE6, ProBot | Setup comprensible, bienvenida y presentación |
| Soporte | Ticket Tool | Bandeja, conversación, asignación, cierre y transcripción |
| Automatización | YAGPDB | Eventos, condiciones, acciones y respuestas dinámicas |
| Comunidad | Arcane, Tatsu | Niveles, recompensas, perfiles y economía |
| Analíticas | Statbot | Métricas administrativas útiles y datos reales |
| Música | Jockie Music | Búsqueda, sesiones, colecciones, historial y gestión de cola |
| Architect | Server Maker, VibeBot, Discord Architect | Propuesta conversacional, preview y construcción |
| Templates y backups | Xenon, DiscordCraft | Biblioteca, edición, versiones y restauración |
| Configuración completa | Pagodane | Estructura y módulos configurados conjuntamente |

La tabla identifica las referencias mencionadas por el usuario; no certifica sus capacidades actuales. Si necesitas comparar una función concreta, verifica documentación primaria y registra fecha y enlace. No hagas una investigación extensa que retrase la inspección del código.

El objetivo no es llegar a 300 comandos. Es ofrecer sistemas coherentes con comandos, menús, botones, modales, web y automatizaciones utilizando los mismos servicios.

### 4. Fase cero: auditoría y trazabilidad

Inspecciona bot, web, API, modelos, música, interacciones, jobs, scripts, Docker, CI y pruebas. Cuenta comandos raíz y subcomandos por separado. Detecta duplicación y rutas que no se utilizan.

Entrega antes de cambios importantes, sin detenerte para una confirmación rutinaria:
- Mapa de arquitectura con puntos de entrada reales.
- Inventario de comandos, módulos, permisos, intents y eventos.
- Mapa de páginas y endpoints autenticados.
- Infraestructura de realtime y jobs existente.
- Configuración persistida y cachés.
- Dependencias y versiones efectivas.
- Deuda que afecta directamente al alcance.
- Plan por etapas con dependencias y criterios de aceptación.

Clasifica subsistemas como KEEP, EXTEND, REFACTOR, REPLACE o MISSING, justificando cada decisión con archivos concretos.

Crea una matriz de requisitos con identificadores estables. Para cada uno registra origen, implementación actual, cambio necesario, fase, interfaz Discord, interfaz web, permisos, persistencia, pruebas y estado.

No pierdas requisitos cuando cambies de contexto. Mantén documentos de estado y decisiones en el repositorio. Terminar una fase no equivale a terminar la plataforma.

### 5. Arquitectura: monolito modular y eventos

Evoluciona hacia un monolito modular orientado a eventos. Separa procesos de bot, API/web y workers donde sea necesario, sin crear microservicios innecesarios ni mover todos los archivos solamente para cumplir una estructura ideal.

Centraliza infraestructura compartida: configuración, contratos, permisos, eventos, assets, primitivas de UI, errores, observabilidad, localización y utilidades de prueba.

Mantén lógica de negocio por módulos: music, moderation, automod, security, verification, logging, roles, welcome, tickets, suggestions, starboard, levels, economy, profiles, voice, giveaways, reminders, embeds, automation, feeds, analytics, utility, fun, architect, decoration y templates.

Cada módulo debe declarar mediante un manifest o registro equivalente:
- Identificador y versión.
- Configuración y defaults.
- Permisos.
- Comandos e interacciones.
- Eventos consumidos y emitidos.
- Jobs.
- Rutas de API.
- Contratos de realtime.
- Dependencias y capacidad de habilitación por guild.

Los handlers delegan en servicios. Web y Discord llaman a los mismos casos de uso. Las operaciones no deben duplicar reglas en el frontend y el bot.

Usa repositorios o límites de acceso a datos en las partes que vas a modificar. Aísla proveedores externos mediante adapters. No conviertas esta separación en una reescritura académica de todo el proyecto.

### 6. Fuentes de verdad y eventos

Discord es autoridad sobre recursos actuales de Discord: canales, roles, miembros, overwrites, mensajes y estado de voz. MongoDB o la persistencia actual es autoridad sobre configuración y datos de OBEY: workflows, economía, niveles, metadata de tickets, colecciones, blueprints, templates, permisos propios y auditoría.

Redis se utiliza para caché, locks, coordinación y estado temporal. Socket.IO transporta actualizaciones en vivo. BullMQ o la cola existente adecuada ejecuta trabajos persistentes. No utilices Pub/Sub como sustituto de una cola durable.

Define un envelope compartido con id, type, version, guildId cuando aplique, actorId, timestamp, correlationId, source y payload validado. Define esquemas por tipo y proyecciones según el permiso del receptor.

Incluye eventos de miembros, canales, roles, configuración, música, tickets, casos, seguridad, trabajos de Architect y workflows. Distingue estado efímero, estado persistente y trabajos durables.

Evita perder eventos críticos entre guardar y publicar. Usa una estrategia coherente con la infraestructura, como outbox persistente para cambios que requieran entrega posterior. No prometas exactamente una entrega; utiliza deduplicación y consumidores idempotentes.

### 7. API, OAuth y permisos

Autentica mediante Discord OAuth2 usando el flujo seguro existente o completándolo. Revisa state, sesiones, cookies, protección CSRF en mutaciones y almacenamiento de tokens.

El servidor valida acceso a cada guild, acción y recurso. Mostrar una guild en el listado OAuth no concede permiso de administración.

Implementa permisos granulares de OBEY con roles de administración, moderación, seguridad, soporte, música, comunidad y analíticas. Deben complementar las restricciones reales de Discord, nunca saltarlas.

Los sockets también se autentican y autorizan. No aceptes guildId o room arbitrarios del cliente sin comprobar acceso. Revalida ante cambios de permisos y revoca suscripciones cuando corresponda.

Las mutaciones siguen: petición autenticada, autorización, validación, servicio, ejecución o job, resultado persistido, auditoría y evento. El frontend no escribe directamente a la base de datos.

### 8. Sincronización web y Discord

El estado inicial se obtiene por HTTP autenticado. Los sockets entregan cambios incrementales. Usa rooms por usuario, guild y módulo; evita broadcast global de información privada.

Implementa revisiones o secuencias para descartar cambios antiguos y detectar desincronización. Al reconectar, reautoriza, suscribe y resincroniza sin crear una ventana que pierda eventos. No presupongas recovery del adaptador seleccionado: verifica su soporte.

Pruebas obligatorias: Discord cambia y la web refleja; web cambia y Discord refleja; una segunda pestaña recibe el cambio; una desconexión seguida de reconexión recupera el estado; un usuario no autorizado no recibe información del módulo.

No muestres LIVE si la conexión está caída. Conserva datos cargados con indicación de que pueden estar desactualizados. No hagas recargas completas en cada evento.

### 9. Jobs y operaciones largas

Usa BullMQ si la auditoría no encuentra una alternativa válida para builds, templates, backups, restores, transcripciones y tareas programadas.

Cada job necesita actor, guild, tipo, estado persistido, progreso real, pasos, resultado, error y correlación. Usa estados explícitos como queued, running, completed, partially_failed, failed y cancelled cuando tengan semántica implementada.

Gestiona concurrencia por guild en cambios estructurales, rate limits, checkpoints, reintentos acotados y shutdown. Verifica estado real antes de reintentar una creación para no duplicar canales o roles después de una respuesta perdida.

La interfaz muestra pasos y cantidades reales, no porcentajes inventados. La cancelación solo debe ofrecerse si realmente evita operaciones futuras; no garantiza deshacer lo ya aplicado.

### 10. Server Architect: capacidad central nueva

Implementa Architect como sistema principal, disponible desde Discord y la web. Debe crear propuestas para servidores nuevos y modificar estructuras existentes.

Modelo mínimo: snapshot actual, blueprint deseado, changeset, plan de ejecución y registro de job. Usa IDs lógicos para recursos nuevos y mapas hacia IDs reales al aplicarlos.

El wizard recoge tipo de comunidad, estilo, tamaño, idioma y módulos. Incluye bases para gaming, comunidad, anime, música, creativos, desarrollo, estudio, roleplay, soporte y personalizado. No generes categorías sin propósito solamente para que el servidor parezca grande.

Editor web: árbol de estructura, preview abstracto e inspector. Permite categorías, canales, roles, orden, movimientos, permisos, selección, undo/redo y cambios pendientes. Ofrece alternativa accesible al drag and drop.

Modo IA: descripción natural, generación de propuesta y refinamiento. Ejemplo: «Creá Valorant y Minecraft, mantené staff intacto y usá menos emojis». La IA genera blueprint validado; nunca ejecuta directamente llamadas a Discord.

Usa proveedor configurable del lado servidor. Si faltan credenciales, el modo visual y las plantillas siguen funcionando; indica que la IA está sin configurar. No presentes una respuesta simulada como generación real.

La IA debe utilizar estructuras, temas y módulos disponibles, respetar restricciones y devolver datos estructurados. Trata nombres y mensajes obtenidos de Discord como datos, no instrucciones ejecutables.

Flujo: analizar, generar/editar, preview, diff, preflight, restore point, confirmación vinculada a esa revisión, job, aplicar, validar y resultado. Si el servidor cambió desde el snapshot, recalcula el diff antes de ejecutar.

No elimines por defecto recursos que no aparecen en el blueprint. Explica las eliminaciones explícitas. Conserva las zonas que el administrador marque como protegidas.

Al crear canales de tickets, verificación, logging o música, conecta la configuración del módulo correspondiente usando IDs reales. Si un módulo falla, reporta ese fallo separado de la creación estructural.

Aceptación: un blueprint revisado produce una estructura válida y módulos conectados; volver a aplicar el mismo estado no crea duplicados; un fallo conserva información suficiente para reintentar pendientes.

### 11. Diff, permisos y rollback

GuildDiffEngine debe distinguir create, update, move, delete, overwrites y configuración OBEY. Muestra valores anteriores y deseados. El plan ordena dependencias: roles, categorías, canales, permisos y módulos.

Realiza preflight de permisos, jerarquía, capacidades del guild y restricciones actuales. Conserva acceso administrativo y de OBEY durante la operación. No marques el preflight como garantía: permisos pueden cambiar durante el job.

El rollback debe basarse en operaciones inversas y snapshots, con límites explícitos. No prometas recuperar IDs borrados, historial de mensajes ni enlaces originales de canales recreados. Informa qué se conservó, qué se recreó y qué no se puede recuperar.

No ejecutes rollback automático si podría sobrescribir cambios posteriores de otra persona. Detecta conflictos y prepara una propuesta para revisión.

### 12. Backups y puntos de restauración

Implementa backups manuales, programados y previos a operaciones grandes o destructivas. Captura estructura, roles, overwrites, configuración de OBEY y referencias de módulos dentro del alcance definido.

Cada backup tiene versión de esquema, fecha, creador, alcance, completitud, advertencias y política de retención. No llames completo a un snapshot incompleto.

Permite inspeccionar, comparar, preparar restauración y ejecutar como job confirmado. Valida backups importados. Mantén privacidad y limita el acceso.

Una restauración debe remapear IDs recreados y actualizar las referencias de módulos. No restaures tokens, sesiones ni secretos a través de una plantilla o backup público.

### 13. Theme Engine y Decoration Studio

Separa estructura, tema y decoración. Cambiar tema no modifica permisos ni elimina canales.

Ofrece previews de nombres de canales/categorías, colores y nombres de roles, densidad de emojis y opciones admitidas por el servidor. Incluye temas iniciales funcionales como Midnight, Minimal, Sakura, Nebula, Gaming, Luxury y un preset OBEY, adaptados a recursos disponibles.

Permite decorar un canal, una categoría, roles o el servidor completo. Muestra antes/después y aplica mediante el mismo motor de cambios. No publiques opciones especiales que el guild no soporte.

Conserva nombres legibles y límites válidos. Ofrece estilos con poca o ninguna decoración.

### 14. Biblioteca de plantillas

Una plantilla OBEY incluye estructura, roles, permisos, tema y configuración portable de módulos: welcome, verification, AutoMod, tickets, logging, levels, voice y automations cuando estén incluidos.

Implementa esquema versionado, referencias lógicas, validación, preview e instalación mediante Architect. Nunca transportes IDs de canales de otro servidor como referencias activas del destino.

Biblioteca: oficiales, privadas, propias, guardadas y comunitarias. Añade búsqueda, categorías, favoritos, versiones y publicación con controles de visibilidad y moderación. Las valoraciones y estadísticas deben basarse en acciones registradas, no cifras de muestra.

Importación/exportación: distingue formato OBEY y templates nativos de Discord. Verifica las operaciones realmente admitidas por la API; no inventes un endpoint de importación. Cuando un formato no transporte un recurso, informa esa limitación.

Si necesitas dividir la entrega, completa primero plantillas oficiales/privadas e instalación; conserva publicación comunitaria y valoraciones como fase explícita con aceptación, no como requisito eliminado.

### 15. Aplicación autenticada y navegación

Conserva el landing. Después del login muestra selector de servidores con instalado/administrable, instalado/sin permisos y no instalado. Añadir OBEY utiliza el flujo de instalación correspondiente.

La navegación debe organizarse por dominios, no con 50 enlaces en una lista: Overview; Server; Management; Community; Entertainment; Automation; Analytics; System.

Server incluye Architect, Templates, Channels, Roles, Decoration, Welcome y Verification. Management incluye Moderation, AutoMod, Security, Logs y Tickets. Los demás dominios agrupan sus sistemas respectivos.

Mantén selector de servidor accesible, búsqueda global, contexto de página, estado real de conexión y notificaciones útiles.

Overview: actividad, atención requerida y salud de servicios. Miembros online y otras métricas solo cuando exista acceso válido al dato; utiliza unavailable/unknown cuando no lo haya. No inventes cifras.

Live Server Explorer: árbol actual de categorías/canales, roles e información de voz disponible. Cambios en Discord actualizan el explorador. Los editores individuales no deben requerir abrir Architect para una modificación sencilla.

Command Center: comandos buscables, habilitación y restricciones por módulo, usuario, rol y canal. Settings aloja opciones globales como idioma, timezone, retención e integraciones; evita duplicar todos los formularios de módulos.

### 16. Design systems separados y relacionados

Discord: usa recursos con el personaje aprobado, navy/gold y acentos adecuados. Botones y selectores son nativos; no se les puede aplicar CSS propio. El acabado viene de composición, texto, imágenes y emojis.

Web: conserva la identidad válida actual. Unifica tokens, spacing, tipografía, estados y componentes sin forzar los colores del anime. Usa una sola familia funcional de iconos existente; Lucide es una opción si no hay sistema coherente. No conviertas el dashboard en una fanpage ni imites el cliente Discord.

Crea primitivas de botones, inputs, selects, modales, drawers, tablas, badges, tabs, skeletons, estados vacíos, errores, progreso y confirmaciones. Mantén semántica de colores y foco visible. Evita glassmorphism, gradientes y grandes tarjetas indiscriminadas.

En cada pantalla debe entenderse dónde estoy, qué sucede, qué puedo hacer y cuál fue el resultado. Diseña mobile específico para tickets, música, moderación, alertas, diffs y progreso. En editores complejos permite al menos revisión y seguimiento en móvil.

Incluye accesibilidad, teclado y reduced motion. No comuniques estados solo con color.

### 17. UI Discord y arquitectura de interacciones

Centraliza builders para éxito, error, advertencia, carga, vacío, confirmación, paginación, player, caso, ticket, perfil, ayuda y settings.

Utiliza Components V2 cuando corresponda y verifica sus reglas actuales. No mezcles formatos incompatibles ni supongas que todo ActionRow top-level es siempre inválido: valida contra el tipo de mensaje y la documentación efectiva.

El router debe admitir botones, selects, modales y autocomplete. Nuevos custom_ids pueden seguir una convención versionada y referenciar estado mediante IDs opacos. No expongas secretos; comprueba actor, guild, recurso y caducidad. Mantén aliases de IDs históricos.

Organiza comandos administrativos en namespaces/subcomandos donde mejore la UX, preservando comandos musicales populares y compatibilidad. Cuenta límites antes de publicar. Añade menús de contexto útiles para perfil, casos, reportes y evidencias según servicios implementados.

Help se genera desde registros y presenta categorías, acciones y documentación contextual. Setup guía por tipo de comunidad, módulos, canales/roles, preview y guardado. No declares configurado lo que solo está seleccionado.

### 18. Assets y tarjetas

El ZIP contiene 6 masters, 89 variantes de emojis, 13 banners, 3 bases y 59 propuestas. Las variantes no son 89 dibujos independientes; los SVG no necesariamente son ilustraciones completamente vectoriales.

Crea un Asset Registry con clave semántica, rutas, formato, ID real, fallback y uso. Implementa un pipeline reproducible que valide dimensiones/peso, cargue o actualice emojis sin duplicados y genere el mapa. Tokens solo desde entorno y sin logs sensibles. Si faltan credenciales, deja el pipeline preparado y el fallback operativo.

No cargues todos los recursos si no se utilizan. Prueba legibilidad pequeña. No inventes assets animados que el paquete no contiene.

Canvas debe recibir datos y buffers seguros, usar fuentes incluidas y reutilizar renderers entre eventos y previews. Limita descargas, cachés y archivos temporales. Incluye assets/fuentes en Docker.

Herramienta de preview: muestra builders y tarjetas con estados normales, vacíos, error y textos largos. Identifica las previews como aproximaciones, no reproducciones exactas del cliente Discord.

### 19. Bienvenida y despedida

Renderiza avatar, nombre visible, servidor y contador actual. Mantén mensajes, canales, DM, fondos, colores y opciones existentes. Añade elección de plantilla y personaje por guild sin sobrescribir configuraciones anteriores.

Unifica evento y vista previa. Comprueba welcome.js, leave.js, canvasUtils.js y los comandos tarjeta/test. Verifica la divergencia welcome.message/welcome.msg, define precedencia y compatibilidad.

Incluye nombres largos, Unicode, avatar ausente, fondo fallido y envío sin tarjeta si el renderer falla y el flujo lo permite. Despedida no debe presentar el contador como posición histórica de ingreso.

Aceptación: dos guilds pueden utilizar ajustes distintos; preview y evento comparten composición; un fallo de imagen no tumba el proceso.

### 20. Música y Music Center

Conserva búsqueda, picker, canciones/álbumes/playlists, cola, progreso, tiempo real, letras, filtros, favoritos, autoplay y 24/7 que realmente existan. Audita antes de duplicarlos.

Una sola MusicSession y QueueState por sesión efectiva; Discord y web controlan lo mismo. Evita una cola web paralela. Identifica guild, canal de voz y sesión; valida permisos musicales desde ambas interfaces.

Preserva los 12 controles: mp_shuffle, mp_prev, mp_toggle, mp_skip, mp_loop; mp_lyrics, mp_voldown, mp_stop, mp_volup, mp_queue; mp_like, mp_autoplay. Conserva los IDs y estados.

Integra portada real, título, artista, solicitante, duración/live y siguiente pista. El personaje acompaña, no sustituye portada. Tiempo/progreso permanecen dinámicos en contenido nativo; no renderices imágenes cada tick.

La revisión anterior detectó embeds.js/index.js/liveupdate.js como flujo activo. Verifica que la integración afecte al reproductor utilizado, no solo ui.js.

Desacopla gradualmente metadata, búsqueda, reproducción y lyrics mediante interfaces alrededor de las integraciones actuales. No desarrolles adapters vacíos para múltiples engines ni cambies backend sin necesidad.

Completa según el inventario: historial, recently played, favoritos, colecciones privadas/compartibles, colas guardadas, estadísticas de sesión y operaciones de cola como mover, eliminar varias pistas y ordenar. Permisos y alcance deben ser explícitos. Toda operación web se refleja en Discord y viceversa.

No confundas soporte de enlaces de Spotify con audio nativo. Respeta capacidades reales y errores de proveedores. Conserva generación guards, serialización y limpieza de intervalos.

### 21. Letras

Conserva seguimiento de posición, pausa/reanudación, seeks y cambio de pista. Verifica los hallazgos: fallback con slice(0,1800) y /lyrics que muestra solo primera página. Corrige si siguen vigentes.

Letra normal: acceso a todo el texto mediante paginación, anterior/siguiente, página actual/total, caducidad y permisos. No obligues a repetir el mismo comando para ver la misma primera página.

Evita mostrar letra vieja después de una respuesta tardía. Maneja letra ausente, proveedor caído y live. La web debe representar el mismo modo y estado, sin consultas duplicadas indiscriminadas.

### 22. Moderación, AutoMod, Security y Verification

Separa responsabilidades: acciones humanas, reglas de contenido, protección estructural/entrada y auditoría.

Moderación: warn, timeout, kick, ban/unban, softban, purge, lock y slowmode según alcance. Casos normalizados con actor, objetivo, motivo, duración, evidencias, estado, fuente y fechas. Web y Discord utilizan el mismo servicio. Edición de motivo/revocación aplica cuando la acción lo permite.

AutoMod: spam, flood, caps, mentions, invites, links, palabras, attachments y filtros externos configurados. Combina mecanismos nativos y del bot según capacidades. Ofrece presets y reglas comprensibles, no solo parámetros técnicos.

Security: anti-raid, anti-nuke, quarantine, gate, lockdown y alertas de permisos peligrosos. Define qué detecta cada regla, ventana, umbral, excepciones y acciones. No prometas impedir una acción que solo se detecta después. Evita castigar automáticamente al bot por sus propios jobs; usa correlación y excepciones acotadas, no inmunidad global.

Verification: botón y reglas de entrada con estados pendiente/verificado/fallido. Captcha solo si se implementa de verdad. Restablecimientos y asignación de rol respetan jerarquía.

Security Center muestra incidentes, estado real y recomendaciones. Un score, si existe, explica su cálculo y es orientativo. No reemplaza evidencias ni garantías.

### 23. Logging, roles y permisos efectivos

Logging configurable para miembros, mensajes, moderación, voz, roles, canales, webhooks e invites donde haya datos/intents. Retención y acceso explícitos; no archives todo «por si acaso».

Roles: autoroles, sticky, temporales y menús de botones/selects. Limita roles asignables; impide escalada a roles peligrosos. Jobs temporales deben sobrevivir reinicios.

Editores de canales y roles independientes de Architect. Presenta permisos heredados, allow/deny y sincronización de categoría. La vista «como rol» debe reconocer el efecto de Administrator y sus límites para modelar un miembro con varios roles.

### 24. Tickets como sistema de soporte

Flujo completo: panel, categoría, modal, apertura, conversación, claim, transferencia, cierre, transcript, calificación y estadísticas.

Web: bandeja, conversación y detalles. Respuestas desde web aparecen en el ticket Discord; respuestas Discord actualizan web. Conserva un único ticket persistido, elimina duplicados por IDs de mensaje y respeta acceso al canal.

Incluye reapertura, respuestas guardadas, notas internas separadas de mensajes públicos y base de conocimiento como capacidades del módulo por fases explícitas. Define retención de transcripts y protección de adjuntos. Una nota interna nunca debe enviarse accidentalmente al usuario.

Métricas de primera respuesta y resolución se calculan de eventos reales; no atribuyas al staff mensajes automáticos como atención humana.

### 25. Comunidad y entretenimiento

Suggestions: propuesta, voto, estados y respuesta staff; Starboard: boards, umbrales, filtros y prevención de duplicados.

Levels: texto/voz, cooldowns, multiplicadores, recompensas y leaderboard. Define actividad contabilizable y evita sumar voz a bots o estados excluidos según reglas.

Economy: wallet, daily, work, shop, inventario y recompensas por guild. Operaciones atómicas, idempotencia y prevención de doble cobro/claim. No mezcles saldos de servidores.

Profiles: badges, reputación, preferencias y estadísticas reales. Giveaways: requisitos, entradas, cierre persistente, reroll auditado y resultados reales.

Voice: join-to-create, propiedad, límites, lock/whitelist y limpieza de canales temporales. Reminders: personales/guild, timezone, recurrencia y programación resistente a reinicios.

Utility/Fun: conserva herramientas actuales, polls, dados y minijuegos; integra el UI Kit sin convertir cada respuesta simple en una tarjeta gigante.

IA general, knowledge base o Activities son extensiones opcionales posteriores. Distingue estas de la IA explícita requerida para Architect y no las utilices para posponer los sistemas centrales.

### 26. Embeds, feeds y Automation Engine

Embed/message builder: editor, variables validadas, preview, plantillas y edición de mensajes publicados que OBEY pueda gestionar. Evita mentions masivas involuntarias y valida límites.

Feeds: YouTube, Twitch, RSS u otros proveedores disponibles. Polling/webhooks según APIs, credenciales y cuotas; deduplicación, estado de integración y recuperación. No anuncies conexión activa sin credenciales.

Automation Engine: Trigger, cero o más Conditions y una o más Actions. Builder visual de nodos especializados en Discord; drafts, validación, prueba sin efectos, publicación, habilitación y runs.

Eventos: member.join/leave, message, level.up, tickets, voice, casos, scheduled y external.feed. Condiciones: roles, canales, antigüedad, contenido disponible y configuración. Acciones: mensajes, roles, moderación permitida, tickets, logs y servicios internos registrados.

No permitas JavaScript arbitrario inicialmente. Impón límites, prevención de ciclos, profundidad, cooldown, permisos de ejecución y deduplicación. Evita que una acción dispare su propio workflow indefinidamente.

Ejemplos funcionales de aceptación: ingreso joven→quarantine+log; level.up→reward role; ticket.closed→transcript; feed nuevo→mensaje. Eventos deshabilitados por falta de intents deben informarse, no fallar silenciosamente.

### 27. Analytics y observabilidad

Analíticas de crecimiento, texto/voz, canales, comandos, música, tickets y moderación según eventos disponibles. Define ventana, timezone, retención y cálculo. Explica cuándo empieza la recolección; no inventes historia previa.

Gráficos responden preguntas concretas y muestran valores textuales. Diferencia cero, sin datos y sin permisos.

Salud de Gateway/shards, DB, Redis, workers, realtime y nodos musicales: healthy, degraded, recovering, offline o unknown según mediciones reales. No expongas secretos ni infraestructura sensible a usuarios sin permiso.

Errores esperados de permisos/cola vacía son resultados de dominio; fallos inesperados se registran con contexto y correlación en la observabilidad existente. Timeouts, retries solo seguros, circuit breakers cuando aporten recuperación y shutdown ordenado.

### 28. Migraciones, pruebas y CI

Preserva configuraciones previas con defaults y precedencia documentados. No supongas soporte de transacciones sin verificar el deployment de MongoDB. No cambies todo a TypeScript ni a monorepo solamente por una propuesta histórica.

Prueba servicios, validadores y workflows críticos. Incluye contratos de API/eventos, integración de DB/jobs, startup, schemas de comandos, custom_ids, componentes y build/Docker. Usa límites de Discord verificados, no números obsoletos copiados del contexto.

Casos críticos: aislamiento por guild, usuarios sin permiso, pérdida/reconexión socket, job reiniciado, creación duplicada, cambios concurrentes, fallo parcial de Architect, rollback limitado, paginación completa de letras, controles musicales, transcript privado, doble claim económico y ciclos de automations.

UI: loading, empty, error, denied, desconectado, datos grandes, texto largo, red lenta y móvil. Inspecciona renderizados finales; los mockups del ZIP no validan integración.

CI ejecuta los checks adecuados al stack. No declares «probado en Discord» por pasar tests locales. Si falta entorno, identifica esas pruebas con instrucciones concretas.

### 29. Secuencia, checkpoints y entrega

Orden sugerido ajustable por dependencias:
0. Auditoría, matriz y decisiones.
1. Registros, permisos, errores, contratos y UI/Asset Registry.
2. Fuente canónica de configuración, API y realtime.
3. Welcome/farewell, música y lyrics con recursos aprobados.
4. Jobs, snapshot/diff, Architect visual, backups y temas.
5. Architect IA y templates con módulos conectados.
6. Tickets, administración, seguridad y roles.
7. Community, feeds, builder y automations.
8. Dashboard completo, analytics y validación transversal.

Trabaja con incrementos verificables, no un PR inmanejable. No dejes la web para el final sin conectar cada dominio: implementa sus endpoints/eventos/UI junto al servicio correspondiente.

En cada checkpoint actualiza matriz, archivos, pruebas y pendientes. Si el trabajo supera una sesión, deja un checkpoint ejecutable con siguiente tarea y dependencias. No lo presentes como entrega completa.

No solicites confirmación rutinaria para trabajo reversible ya autorizado. Detente solo ante una decisión verdaderamente bloqueante, cambio destructivo fuera del alcance o acceso necesario. Completa todo lo independiente de credenciales.

Entregables finales: rama/PR, código conectado, matriz completa, documentación de arquitectura y decisiones, configuración/migraciones, instrucciones Docker, mapa de assets, ejemplos renderizados, pruebas con evidencia, estado de integraciones/credenciales y pendientes exactos.

Un sistema está implementado cuando tiene flujo real, datos, persistencia adecuada, permisos, errores, UI y pruebas; no cuando existe su nombre en la navegación. Una plataforma completa requiere todos los requisitos centrales de esta matriz resueltos o explícitamente pendientes, nunca omitidos.

## Trazabilidad de las fuentes originales

Esta sección registra procedencia, no confirma hechos externos ni el estado actual del código.

| Documento | Aportes incorporados |
|---|---|
| Sin título.md | Sistemas multipropósito, benchmarks, música desacoplada, automatización, confiabilidad y comandos |
| Sin título 1.md | Architect conversacional, themes, templates, decoración, despliegue de módulos y backups |
| Sin título 2.md | Plataforma compartida, realtime bidireccional, API, Redis, jobs, RBAC y fuentes de verdad |
| Sin título 3.md | Flujos de producto, selector de guild, diff, editores, soporte web, permisos y mobile |
| Sin título 4.md | Componentes web, jerarquía, estados, accesibilidad y revisión visual |
| Sin título 5.md | Propuesta de identidad inspirada en personaje y semántica de color |
| Sin título 6.md | Separación web/Discord, monolito modular, manifests, router, assets y documentación viva |
| Conversación posterior y ZIP | Personaje aprobado, recursos seleccionados, rama elegida, 12 controles y preservación de progreso/lyrics |

## Correcciones respecto de los prompts anteriores

- Architect, templates, decoración y realtime son sistemas centrales con implementación prevista, no simples banners ni propuestas descartables.
- Los módulos nuevos explícitos se desarrollan por fases; no se excluyen por no existir actualmente.
- El landing se conserva y la web no adopta obligatoriamente la paleta del personaje.
- Se mantienen los recursos con el personaje aprobados para Discord.
- Restaurar estructura no equivale a recuperar íntegramente historial e IDs originales.
- Los hechos históricos sobre versiones, límites y bots externos deben verificarse antes de utilizarlos como base técnica.

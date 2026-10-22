# Cobertura de eventos y cambios de Discord

Edición 0.13 · 22/10/2026, America/Asuncion. El usuario solicita asegurar la cobertura completa de lo observable. El compromiso de diseño es inventariar cada fuente documentada, implementar los consumidores elegidos y hacer visible cualquier limitación o interrupción. No prometer acceso a toda actividad privada ni una entrega histórica sin pérdidas.

La matriz de esta entrega clasifica **82 entradas de recepción Gateway**, **69 acciones Audit Log** y **117 materiales de eventos/auxiliares existentes**. Los primeros incluyen mensajes de control y eventos de recursos; no representan 82 funciones de registro de guild. Las acciones de auditoría pueden complementar los mismos cambios del Gateway. Los materiales son presentación y no prueban captura.

[Matriz JSON](../cobertura-eventos/matriz.json), [Gateway CSV](../cobertura-eventos/gateway.csv), [Audit Log CSV](../cobertura-eventos/audit-log.csv) y [materiales CSV](../cobertura-eventos/materiales.csv). Cada fuente tiene disposición; nombres SDK y listeners son candidatos estáticos que deben conciliarse contra versión/cargador. Ninguna fila se declara probada en Discord.

## 1. Familias cubiertas por el plan

| Familia | Proyección objetivo |
| --- | --- |
| Servidor | Nombre, icono, banner y configuración visible recibida; permisos y cambios administrativos cuando constan |
| Canales y categorías | Creación, eliminación y todos los campos observados que cambiaron: nombre, tema, orden, padre, límites, permisos, tags y opciones según tipo |
| Roles | Creación/eliminación, nombres, colores, iconos, posición, permisos y otros campos expuestos |
| Miembros | Entradas/salidas, apodo, cambios de roles, timeout y datos de miembro observables; sanciones con evidencia de auditoría |
| Mensajes | Identidad de creación/edición/eliminación, pin y bulk; diferencias de contenido/adjuntos solo si disponibles y permitidas |
| Reacciones y encuestas | Altas/bajas/limpieza y votos expuestos; conciliación de resultados y ausencia de datos explícita |
| Hilos y foros | Creación, actualización, cierre/reapertura, bloqueo, pertenencia, tags y sincronización según visibilidad |
| Voz y Stage | Entrada/salida/movimiento, mute/deaf propios o de servidor, cámara/stream, solicitud de hablar y estado de sesión recibidos |
| Expresiones | Cambios observables en emojis, stickers y soundboard |
| Invitaciones | Crear/eliminar y metadata disponible; atribución de invitación usada solo si existe evidencia suficiente |
| Integraciones y webhooks | Notificaciones y recursos autorizados; cambios correlacionados sin persistir credenciales |
| Eventos programados | Creación/edición/eliminación y altas/bajas de interés expuestas |
| AutoMod | Reglas, disparos y acciones con sus intents/permisos; evitar sanción duplicada |
| Permisos/onboarding/guía | Cambios administrativos expuestos por auditoría y recursos correspondientes |
| Propio OBEY | Configuración, tickets, música, trabajos, publicación y automatizaciones mediante recibos de sus servicios |
| Operación | Disponibilidad de guild, conexión/resume, límites, captura degradada y recuperación |

La selección de campos se implementa por tipo de recurso sobre un esquema versionado y permitido. Un evento update puede cambiar varios campos: generar una lista completa, sin `else if` que oculte el resto. Permisos como bitfields se comparan de forma estable; comparar listas por identidad, no por orden accidental. Distinguir campo ausente, null, valor vacío y valor igual.

Las etiquetas de voz describen estados, no acceso a conversaciones o a imágenes del stream/cámara. Los datos de miembros/perfiles se limitan a lo entregado al bot autorizado. Interacciones de otros bots, mensajes efímeros ajenos y conversaciones privadas entre terceros no son fuentes generales de OBEY.

## 2. Hallazgos reales de la base

Lectura de `handlers/logger.js`, `bootstrap/discord-client.js` y `handlers/events.js` en el ZIP edición 0.12:

- El listener de voz retorna cuando cambia mute/deaf/video/stream, suprimiendo esos estados e incluso una transición de canal simultánea.
- Canales comparan nombre/tipo/tema mediante ramas excluyentes; roles, nombre/color. No hay diff completo de cambios simultáneos en esos handlers.
- El log de mensaje eliminado usa contenido/autor de caché sin un estado explícito de datos no disponibles.
- Fallos de envío se silencian. Ese helper no acredita cola durable, recibos o reintentos conciliados.
- Los intents explícitos de la base no incluyen eventos programados, configuración/ejecución AutoMod o votos de encuesta. Activarlos solo al habilitar sus consumidores, y verificar Portal/SDK.
- El wrapper de archivos de eventos de guild descarta su llamada durante indisponibilidad DB; la captura debe declarar ese hueco o tener un mecanismo acotado de degradación.

La evidencia detallada y hashes están en [proveniencia](../cobertura-eventos/proveniencia.json). No se alteró ese código en esta edición. Los 113 candidatos de listeners/archivos del inventario no equivalen a 113 listeners cargados únicos ni funciones completas.

## 3. Arquitectura de captura

Extender el módulo logs y sus adaptadores existentes. Separar captura autorizada, normalización/diff, correlación y presentación. Elegir un propietario para cada fuente: usar raw y eventos SDK como evidencia relacionada cuando haga falta, evitando publicar dos veces el mismo efecto.

Modelo de diseño `ObservedChange`: eventId, schemaVersion, guildId, sourceKind, sourceEvent/actionType, entidad/targetIds, receivedAt, observedAt si existe, secuencia/sesión/shard cuando estén disponibles, campos antes/después con estado de disponibilidad, actor/razón opcionales, evidencias, confidence, versión de configuración y política de retención. No incluir tokens de Gateway/voz/interacción, URLs de webhooks o payload bruto sin filtrar.

Registrar una proyección durable con whitelist y tamaño limitado antes de programar la entrega del log. El Gateway no ofrece confirmación de aplicación por cada evento: guardar en DB no elimina huecos de red, proceso o almacenamiento. Ante caída, usar buffer acotado/redactado si el diseño lo soporta; al agotarse, marcar conteos/hueco y degradación. No usar una cola infinita ni afirmar que el evento quedó guardado antes de persistir.

Proyección de recurso: snapshot mínimo autorizado y revisión. Mensajes necesitan política aparte de caché/retención; un snapshot de estructura Architect no es historial de conversaciones. El mecanismo de backup existente no cubre estos mensajes por sí mismo.

## 4. Antes, después y responsable

Cada valor usa uno de: observado, retenido previamente, no entregado, no autorizado o no disponible. Si no existe antes válido, mostrar solo después y aclaración; no convertir falta de datos en texto vacío o eliminación.

Gateway informa el cambio; Audit Log puede aportar actor, motivo y cambios de una acción administrativa. Correlacionar guild, tipo de acción, target y opciones relevantes, junto con tiempo y evidencia de operación OBEY cuando exista. Puede ser tardío, agrupar objetivos o no contener actor. La proximidad temporal por sí sola no identifica al responsable. Guardar auditEntryId cuando la correspondencia sea inequívoca; en otro caso actor desconocido o varios candidatos sin acusación pública.

Un miembro que desaparece no confirma por sí solo una salida voluntaria, kick o ban. Un mensaje eliminado no confirma su autor como responsable del borrado. Un timeout vencido no implica que un moderador lo retiró. Un cambio de canal observado tras reconexión no demuestra el orden exacto de acciones intermedias.

Ejemplo de presentación: «Canal actualizado · #general», lista de nombre/tema/permisos que realmente cambiaron, «Responsable: no identificado» cuando corresponda, hora relativa y referencia. No mostrar «Antes: vacío» si no se recibió el valor anterior. Enriquecer el mismo registro después de correlación en vez de crear acusaciones o duplicados.

## 5. Mensajes eliminados y contenido

El evento de eliminación aporta IDs, no el cuerpo borrado. Solo puede mostrarse contenido anterior si OBEY ya lo tenía en una caché/proyección autorizada. MessageContent condiciona los datos disponibles; ReadMessageHistory no recupera un mensaje que ya fue eliminado. Mensajes parciales y ediciones sin snapshot deben indicar la limitación.

Diseño de configuración: captura de metadata y cambios estructurales por categorías elegidas; conservación de contenido de mensajes como opción independiente con canales/roles excluidos, audiencia y plazo definidos. No activar archivo íntegro de todas las conversaciones como consecuencia de activar logs. Capturar metadata observable y guardar contenido son capacidades distintas.

No conservar el archivo de todo adjunto automáticamente. URL o metadata de un adjunto no prueba que el archivo siga disponible, y eliminar un mensaje no demuestra la eliminación del archivo en CDN. Transcript, caché, exportación y retención deben compartir política de acceso y borrado definida por el módulo.

## 6. Recuperación y cobertura efectiva

Usar resume/controles del SDK para recuperar lo que Discord permita en la sesión válida. Si no se puede reanudar, registrar intervalo de cobertura desconocida y hacer reconciliación de recursos actuales autorizados. Una diferencia de snapshot muestra un cambio neto; no reconstruye todos los eventos intermedios.

Audit Log conserva entradas durante 45 días según la documentación consultada y requiere ViewAuditLog. Consultar de forma paginada y acotada desde cursor, deduplicar por ID y respetar límites. No existe recuperación universal de acciones que no produjeron auditoría, contenido eliminado no retenido o eventos fuera de esa cobertura.

Deduplicación: auditEntryId para auditoría; identidad de operación para OBEY; sesión/shard/secuencia y proyección cuando estén disponibles para Gateway. Un hash del texto/segundo no basta: dos cambios idénticos pueden ser acciones reales diferentes. Mantener causalidad y orden por recurso cuando se conozcan. Una cascada de permisos puede generar varios cambios legítimos: agrupar visualmente con referencias sin descartar evidencia.

La matriz de salud de cada guild muestra permiso/intents solicitados y observados, consumidor habilitado, snapshot disponible, última recepción/persistencia/entrega, cola/reintentos y huecos conocidos. Intents declarados en código no acreditan aprobación o habilitación del Portal ni visibilidad de todos los canales. No pedir todos los intents si no hay consumidor.

## 7. Destinos, volumen y seguridad de datos

Mantener configuración `logChannels.*` y compatibilidad de logger.channel, pero verificar guild y audiencia del destino. Registros de tickets/seguridad no hacen fallback a un canal público por faltar su destino privado. No enviar cambios de guilds cliente al servidor de soporte de OBEY.

Separar almacenamiento del evento y entrega de mensajes. Procesar colas por guild/destino, respetar 429 y coalescer/grupar ruido sin perder referencias a eventos conservados conforme a política. Evitar bucle de logs producidos por los propios mensajes/ediciones del logger, manteniendo evidencia interna de sus acciones relevantes.

Presencia, escritura y actividad de reacciones pueden ser de alto volumen; se clasifican en la matriz y se habilitan por consumidor/selección de metadata. No confundir soporte de un evento con necesidad de publicar cada paquete en un canal. Los eventos de control Gateway y VOICE_SERVER_UPDATE se destinan a operación/transporte con campos secretos excluidos, no al feed de moderación.

## 8. Materiales y campos nuevos

Los 117 recursos existentes se revisan individualmente en materiales.csv. Algunos corresponden a diferencias derivadas, otros a eventos internos del producto y cuatro son auxiliares de presentación. No se leen ajustes internos de otros bots por existir un icono de configuración. No se usa el catálogo Quark como prueba de que Discord entrega un evento dedicado para cada etiqueta.

Reutilizar claves semánticas y variantes del catálogo. Nuevas acciones de auditoría sin icono específico usan un recurso genérico aprobado más título legible. No exigir un emoji nuevo por cada campo ni publicar IDs de diseño. Los textos de estados de captura están en [locales ES/EN](../cobertura-eventos/LEER.md), pendientes de integración con el resolvedor único.

## 9. Cierre de implementación

Orden: reemplazar los descartes/diffs incompletos del logger → proyección durable y recibos → gating de intents/permisos → correlación de auditoría → snapshots/caché autorizados → cola/destinos → reconciliación y salud → ampliar familias pendientes. Conservar operaciones y presentación existentes hasta validar su reemplazo; no crear otro bot de registros.

Aceptar por familia: dos campos simultáneos, permiso retirado, antes ausente, actor desconocido, evento duplicado, DB fuera, cola llena, desconexión con/sin resume, hueco irreconciliable, borrado con/sin caché, canal inaccesible, dos guilds y ruido del propio logger. Voz: mute y movimiento simultáneos deben conservar ambos cambios. Roles: nombre y permisos simultáneos deben aparecer como dos diferencias. Un recurso eliminado no se recrea automáticamente por el log.

La entrega demuestra clasificación de todas las filas extraídas de las fuentes consultadas y documentación de los límites. No demuestra entrega completa del runtime ni una garantía absoluta de captura. Las comprobaciones conectadas y correcciones del código siguen pendientes.

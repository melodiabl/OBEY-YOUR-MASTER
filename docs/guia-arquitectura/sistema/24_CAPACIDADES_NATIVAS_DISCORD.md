# Capacidades nativas de Discord para OBEY

Edición 0.12 · 22/10/2026, America/Asuncion. El usuario autorizó ampliar el plan con las capacidades investigadas de Discord. Este capítulo define su uso dentro del único bot OBEY; la entrega añade especificación, contratos y traducciones. No registra comandos, habilita módulos ni ejecuta efectos en Discord.

Entrada: [catálogo de 18 capacidades y matriz por módulo](../discord-nativo/capacidades.json), [compatibilidad real](../discord-nativo/COMPATIBILIDAD.md), [recetas](../discord-nativo/RECETAS.md) y [fuentes](../discord-nativo/FUENTES.md). La matriz abarca las 32 fichas como objetivos condicionados a que cada dominio se ofrezca; no activa dominios diferidos por aparecer en esa matriz.

## 1. Decisiones de producto

Cada capacidad tiene un consumidor, servicio propietario, configuración, audiencia, idioma, recurso visual y criterio de cierre. Las superficies Discord delegan a los casos de uso existentes. La edición permite desarrollar estas funciones concretas pese a la restricción general previa contra funciones nuevas durante una mera reorganización.

`/servidor` sigue siendo el acceso claro al diseño/configuración del servidor. Comandos, botones, formularios y menús contextuales que hagan la misma operación comparten política y datos. No sumar gestores de música o configuración competidores. Conservar favoritos, datos y doce IDs musicales Soundy; migración a lavalink-client sigue su capítulo específico.

## 2. Interacciones y configuración

**D01/D02.** Adaptar registro y ayuda a nombres/localizaciones ES/EN; enrutamiento interno estable. Autocomplete propone recursos elegibles de listas/favoritos o resultados acotados. Una sugerencia no autoriza su ejecución: volver a validar al enviar. Evitar búsquedas externas costosas en cada pulsación; reutilizar caché con timeout, límite y fallback vacío. El proyecto ya tiene soporte parcial que debe ampliarse.

**D03.** «Reportar mensaje» parte de una referencia real seleccionada, verifica acceso y abre el mismo flujo privado de soporte; «Consultar perfil» delega al propietario de perfil. La incorporación debe resolver registro por tipo y despacho de interacción, no solo añadir un archivo de comando. No asignar contexto de guild a una interacción donde no exista.

**D04.** Configuración por selector de canales/roles/usuarios. La selección guarda IDs, nunca nombres como autoridad. Filtrar por tipo y verificar pertenencia, permisos efectivos, jerarquía y audiencia después de seleccionar y al publicar. Un rol elegido para atención no recibe privilegios administrativos por esa elección.

**D05/D06.** Reportes y solicitudes usan formulario con campos de negocio. Formulario de referencia: módulo afectado, descripción, captura opcional y «Pude repetir el error». El primer recorrido de reporte no solicita secretos ni publica el contenido recibido. Los campos modernos deben pasar por el parser de la versión usada, con fallback al formulario básico si la capacidad está deshabilitada.

Abrir un modal es la respuesta inicial de esa interacción: no diferir primero y luego intentar abrirlo como segunda respuesta. Guardar sesión y elecciones antes cuando haga falta. La entrega del formulario es una interacción nueva: verificar actor/guild/revisión y confirmar rápidamente o diferir la operación posterior. Trabajos persistentes continúan mediante referencia consultable; no dependen del token efímero para sobrevivir.

**D10/D18.** Configuración, errores, confirmaciones y resultados personales se muestran privados. El panel común permanece estable mientras cada usuario opera. Publicaciones de bienvenida, tickets y novedades siguen los contratos CM01–CM06. Comprobar disponibilidad de módulo, actor, bot, recurso y destino; un componente habilitado no sustituye esas políticas.

## 3. Diseño con componentes nativos

**D07.** Adoptar Components V2 por vista: ayuda, configuración, soporte y anuncios nuevos son candidatos. Usar contenedor con acento OBEY, texto legible y acciones necesarias. Las imágenes apoyan el contenido; los datos que el usuario debe leer o copiar permanecen como texto. Mantener navegación corta y detalle paginado.

La elección de renderizador se registra como `legacy` o `v2` por mensaje publicado. El modo V2 es irreversible en ese mensaje y excluye content/embeds/poll/stickers tradicionales; los adjuntos deben presentarse mediante sus componentes. Para volver a una vista legacy, crear un reemplazo compatible y conciliar IDs de mensajes, sin fingir que puede quitarse el flag. El renderizador aplica presupuesto de componentes y longitud. No mezclar accidentalmente payloads de ambos modos. Fuente técnica resumida en FUENTES.md.

Soundy mantiene su distribución y doce IDs. Evaluar V2 en una vista aislada después de comprobar paridad; el cambio visual no altera reproducción. Los estilos nativos de botones y el cliente controlan su apariencia: no prometer CSS, tipografías externas o animación programable frame por frame dentro de un mensaje.

## 4. Materiales y tiempo

**D08.** Usar emojis de aplicación para el catálogo elegido, con mapa canónico, ID, archivo/hash y formato verificados. Existe capacidad documentada de hasta 2.000 emojis de aplicación; no significa que todos los archivos del ZIP deban publicarse ni que esa capacidad esté libre en la aplicación real. Consultar inventario remoto autorizado, deduplicar y conciliar el plan de publicación vigente. PNG estático y animación son recursos/IDs distintos cuando se publican por separado. Conservar los diseños A aprobados y revisión pendiente B/C.

No ejecutar todos los uploads por iniciar el bot. Reutilizar scripts/obey-assets.js y la validación de registry.js; registrar avance, fallos y bindings reales. Un emoji borrado o ausente conserva etiqueta de texto y diagnóstico; nunca resucitar su ID desde una copia vieja.

**D09.** Persistir instantes UTC y renderizar fecha relativa cuando corresponda: apertura de ticket, cierre de sorteo, recordatorio o evento. La frase se traduce, el timestamp es un dato. Cambiar idioma o zona horaria no modifica el instante guardado. El cliente representa el tiempo relativo sin que OBEY edite el mensaje continuamente.

Un timestamp de fin musical es estimado: recalcular al pausar, buscar posición, cambiar velocidad o recuperar el reproductor, según los datos confirmados disponibles. No presentar GIF o animación como barra de progreso sincronizada. El reloj y la continuación se derivan del motor de reproducción, no de editar el panel.

## 5. Estado de voz conectado al motor

**D11.** Configuración optativa por guild/canal: mostrar canción/artista, pausa o espera. El servicio musical emite una proyección de estado después de confirmar la transición. Un adaptador Discord escribe el estado del canal; nunca llama play/skip ni modifica la cola como efecto secundario.

Ruta documentada: `PUT /channels/{channel.id}/voice-status`. Exige SetVoiceChannelStatus y, si el bot no está conectado, también ManageChannels. La ausencia de permiso deshabilita esta presentación y genera diagnóstico privado; no detiene el audio. No confundirlo con presencia global del bot ni nombre del canal.

Mantener secuencia de reproducción, último valor enviado y canal para descartar escrituras obsoletas de la canción anterior. Coalescer cambios, deduplicar texto igual y respetar 429. No actualizar cada segundo. Limpiar el estado al terminar solo conforme a propiedad/configuración y evidencia disponible; si otro actor cambió el estado, no restaurar valores ajenos a ciegas. La API no ofrece una transacción entre el reproductor y el texto visible.

La documentación de VoiceChannel 14.27.0 consultada no lista un setter específico de estado; no inventar `channel.setStatus`. Reconciliar exports y, si hace falta, usar REST dentro del adaptador existente. Lectura del estado debe seguir su API/eventos documentados; no asumir que `channel.status` llega en un GET convencional.

## 6. Comunidad y moderación

**D12.** Encuestas nativas para decisiones sencillas de comunidad. Vista previa, duración, opciones y multiselección elegidas por gestor. Guardar ID y autor/configuración; manejar voto/resultados conforme al permiso. Resultado no disponible se trata como desconocido; publicar resultado final tras cierre/finalización. Si se requieren votos privados, quórum de DJ o reglas de un sorteo, usar el sistema propietario: no cambiar su semántica para encajarlo en una encuesta. La encuesta se publica en un mensaje compatible independiente de V2.

**D13.** Eventos programados para sesiones de escucha o reuniones: nombre, inicio, zona horaria interpretada, destino, cobertura y permisos. Preview con fecha inequívoca antes de crear; guardar ID y conciliar un resultado incierto. Consultar/editar/cancelar el mismo recurso. Un evento no inicia automáticamente música, manda privados ni da permisos de voz sin su caso de uso y configuración. Si el módulo de eventos no está ofrecido todavía, esta capacidad queda pendiente y no aparece como funcional.

**D14.** AutoMod nativo: inspeccionar reglas existentes, proponer reglas propias, excepciones y acciones; publicar solo la selección revisada. Registrar IDs/propiedad por guild. No reemplazar reglas de Discord u otros bots sin alcance explícito. No ejecutar una segunda sanción de OBEY por el mismo disparo: elegir si la regla bloquea/avisa o delega una acción adicional justificada. Conciliar eventos y disponibilidad del contenido sin pedir intents amplios por defecto.

**D15.** Hilos/foros pueden organizar sugerencias, solicitudes y ayuda pública. Un foro no es destino privado por el solo hecho de crear un post. Tickets sensibles conservan el transporte con privacidad comprobada. Comprobar permisos del padre, miembros y moderadores; archivo no significa eliminación ni borrado de datos. No migrar todos los tickets a hilos como efecto de habilitar esta capacidad.

**D16/D17.** El Gateway alimenta cambios de miembros, voz, roles/canales y los registros pertinentes; auditoría complementa atribución cuando existe evidencia. No inventar autor de una eliminación basándose solo en cercanía temporal. Intents, parciales y permisos se eligen por consumidores. La integración GitHub conserva las decisiones del capítulo 22, sin duplicar entrega nativa y adaptador propio.

## 7. Arquitectura y adopción

Un adaptador común traduce interacción → contexto autenticado → caso de uso → resultado → presentador. Los contratos del módulo conservan negocio y datos. El despachador reconoce tipos distintos; handlers legacy mantienen puente hasta conciliar todos sus consumidores. Debe haber un único propietario por interacción, aunque hoy existan varios listeners.

Registrar capacidades como plataforma documentada, biblioteca documentada, payload validado localmente, recorrido probado en guild de pruebas y disponibilidad publicada. Son etapas distintas. El JSON de esta entrega es de diseño, no la configuración del feature-registry actual. Sin soporte o permiso, usar alternativa prevista o mensaje claro, sin controles muertos.

Orden: resolver discrepancia de runtime y validar exports → selectores/CM01 → formulario reporte/CM04 → emojis/timestamps → estado de voz → V2 en un panel nuevo → menús contextuales y autocomplete musical → encuestas/eventos/AutoMod. GitHub y registros se concilian con módulos existentes. Pruebas proporcionales por recorrido; no restaurar baterías retiradas ni instalar todos los paquetes de Discord.

La edición 0.14 incorpora el alcance solicitado de monetización y Top.gg en el capítulo 28 y su especificación; siguen sin estar habilitados. Otras áreas como Activities, instalación en usuario o roles vinculados necesitan un problema de producto y alcance propios. No se habilitan ni se prometen por querer aprovechar Discord. La cobertura actual son estas 18 capacidades, sin afirmar que se implementó toda la API.

## 8. Aceptación de esta unidad

Cada capacidad ofrecida funciona con ES/EN, dos guilds aisladas, permisos válidos/retirados y fallback visual. Autocomplete no autoriza un recurso fuera de audiencia; contexto de mensaje no filtra contenido de otro canal; modal antiguo no guarda sobre revisión nueva; archivo no se publica en foro; V2 no rompe Soundy; timestamp no fuerza ediciones periódicas; voz refleja la canción actual y una escritura vieja no pisa la nueva; encuesta sin resultado no anuncia cero; evento duplicado no crea dos recursos; AutoMod no sanciona dos veces.

Las recetas y [validación documental](../discord-nativo/validacion.json) no sustituyen pruebas de SDK o Discord. Esta edición mantiene código, dependencias, datos y assets binarios de la base intactos.

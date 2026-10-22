# Recetas de implementación por recorrido

Estos contratos describen resultados; nombres de operaciones nuevos son propuestas, no exports existentes. Usar servicios actuales y registrar adaptaciones en su ficha. [recetas.json](recetas.json) permite que otra IA recorra objetivos, controles y casos de fallo sin interpretar nombres genéricos como funciones implementadas.

## R01 · Elegir canal de bienvenida

`/servidor` → configuración → bienvenida → selector de canal → comprobar permisos → vista previa → guardar/publicar por welcome-configuration/configuration-service. Mostrar CM01 y su confirmación privada. Si otro gestor publicó una revisión, rechazar la revisión antigua y conservar el borrador. Elegir canal no envía una bienvenida de prueba automáticamente. ID guardado debe seguir resolviéndose después de renombrar el canal.

## R02 · Reportar con captura

Panel CM03 o acción contextual Reportar mensaje → sesión privada → modal → validación → servicio de reporte/ticket → referencia → CM04. Campos: área afectada (Música/Tickets/Otro), descripción, archivo opcional y confirmación informativa de reproducibilidad. Las etiquetas están en ES/EN; valores de área son music/tickets/other.

Abrir el modal antes de ejecutar efectos o diferir esa misma interacción. En su submit validar actor, guild, sesión y recursos; diferir la persistencia si hace falta. Validar número, tamaño, tipo real y acceso a adjuntos en servidor, no solo filtro de extensión del cliente. Archivos se guardan solo conforme a política de retención y acceso del módulo; no publicar ni confiar en una URL firmada como almacenamiento permanente. Si upload moderno no está disponible, formulario de texto y solicitud posterior de adjunto en el ticket privado.

## R03 · Nuevo panel de soporte V2

CM03 → renderizador V2 con contenedor dorado, TextDisplay y selector. Registrar modo e ID de mensaje. No agregar embed/poll al mismo payload. Conservar texto y acciones del contrato. Recibos personales se envían privados; no editar el selector de todos a loading. Reponer un panel perdido solo mediante configuración y conciliación autorizadas. Fallback se elige antes de crear el mensaje.

## R04 · Música y estado de voz

Evento confirmado del reproductor → proyección actual → presentador Soundy y adaptador de estado de canal. Estado propuesto: Sonando: canción — artista / Reproducción pausada / Esperando canciones. Actualizar por transición, no por reloj. Fallo al escribir estado no provoca skip, stop o fallo de audio. Un retry conserva secuencia; si la canción ya cambió, descartar operación anterior. Testear pausa, resume, skip, vaciado, cambio de canal, pérdida de permiso y cambios externos de estado.

## R05 · Fecha relativa

Servicio guarda endsAt en UTC → helper de presentación genera timestamp relativo → mensaje de sorteo/recordatorio. Reabrir/editar fecha requiere actualizar el dato y representación; visualizar el tiempo no edita la fecha guardada. No usar relative time como temporizador que ejecuta la tarea: el job del módulo cierra/avisa. Para música con pausa, fin estimado se vuelve a calcular sobre estado confirmado.

## R06 · Encuesta de comunidad

Gestor elige pregunta/opciones/duración → preview → permiso actual → Create Message con poll en mensaje compatible → guardar ID y recibo → cerrar/consultar/finalizar. No mezclar con V2. Si la respuesta de creación se pierde, no reenviar de inmediato sin conciliación. No convertir reglas de votos privadas o ponderadas en encuesta simple sin decisión explícita.

## R07 · Evento de escucha

Gestor elige nombre y destino → fecha local interpretada en zona elegida → preview → creación confirmada → registrar evento. Antes de guardar, rechazar fecha inválida/pasada según política y comprobar permiso/tipo de destino. Editar/cancelar usa ID existente y estado permitido. El evento anuncia el encuentro; reproducir música es otra operación autorizada del módulo.

## R08 · Regla AutoMod propia

Leer reglas → elegir alcance y excepciones → simular/preview → confirmar → crear/modificar regla propia → guardar ID → consumir acciones en logs. Actualizar solo recursos identificados como propios y revisados. Probar una excepción y un disparo en guild de pruebas; confirmar que no produce sanción duplicada. Ante permisos retirados, informar y dejar política anterior registrada; no borrar reglas ajenas.

## R09 · Publicar emojis de aplicación

Elegir diseños aprobados y variantes → conciliar registro actual → validación local sin --apply → inventario remoto autorizado → publicación con mecanismo existente → recibos/IDs → referencias canónicas → vistas públicas/privadas. No tratar el límite de 2.000 como objetivo de cantidad. Un recurso cambiado invalida el binding por hash y recupera texto legible. Probar que un ID borrado no queda como markup roto en el mensaje.

## Cierre común

Registrar archivo/entrada real, caso de uso propietario, revisión de configuración, traducciones, recurso/ID, efecto y evidencia. Distinguir validación local, prueba real y disponibilidad publicada. No ejecutar estas recetas como automatizaciones al abrir el JSON.

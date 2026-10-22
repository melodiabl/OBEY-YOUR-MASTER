# 16 · Iconos estáticos, animaciones y estado real

Edición 0.7. A01–A12 aprobados; extensión B01–B65 y plataformas C pendientes de revisión visual. Todos son recursos incluidos para implementar; no están conectados por el mero hecho de aparecer en una galería.

## Autoridad y superficies

El servicio del módulo confirma la operación; el presentador decide qué mostrar. Conservar el registro de handlers/assets/registry.js y assets/obey/registry.json.selected. integration-plan.json es un plan de migración, no un segundo resolvedor runtime.

| Estado | Mensaje | Botón |
| --- | --- | --- |
| Listo | Icono que identifica el contenido | PNG del estado o siguiente acción disponible |
| Pendiente | Explicación de la operación en curso | GIF pertinente si sigue pendiente y el control lo admite |
| Confirmado | Resultado concreto | Estado confirmado o siguiente acción, no siempre un tick |
| Fallo | Causa y siguiente paso seguro | Control recuperable o deshabilitado según el caso |
| Desconocido/parcial | Qué se confirmó y qué falta | Consultar/conciliar; no repetir efectos a ciegas |
| Vacío/caducado/sin permiso | Motivo y salida clara | Nueva sesión, configuración o requisito pertinente |

Un mensaje acepta markup de emoji; un componente usa el objeto de emoji resuelto. No interpolar el objeto en texto, no poner markup en labels que se limpian y no enviar la URL PNG al campo emoji. Imágenes grandes y tarjetas son medios, no emojis.

## Secuencia de una acción

1. Resolver interacción, actor, guild y revisión. Revalidar permisos incluso en paneles antiguos.
2. Aceptar la interacción con la respuesta válida. Abrir un modal no lleva un defer genérico previo.
3. Ejecutar una sola operación por el servicio del módulo; deduplicar dobles pulsaciones.
4. Mostrar pendiente si todavía hay trabajo. No introducir una espera para que el GIF termine.
5. Publicar resultado confirmado, fallo o desconocido según la evidencia. Un error al editar el emoji no repite el efecto de negocio.
6. Descartar resultados de sesiones anteriores y coordinar publicaciones por mensaje.

Discord no expone un control de fotogramas para reiniciar una animación exactamente desde el clic en todos los clientes. Un GIF puede estar detenido por las preferencias del cliente. Mantener PNG y texto comprensibles. No editar por fotograma ni derivar progreso musical del tiempo de un GIF.

## Controles de Soundy

| ID conservado | Recurso de acción/estado | Movimiento y resultado |
| --- | --- | --- |
| mp_shuffle | A04 | Cambiar a GIF durante la solicitud; mostrar modo confirmado |
| mp_prev | B01 | Indicador compartido si tarda; nueva pista o falta de historial |
| mp_toggle | A03 play/pausa | A03 animado representa reproducción activa; la conexión pendiente usa otro indicador |
| mp_skip | B02 | Nueva pista o cola vacía; no avanzar dos veces por fin/skip |
| mp_loop | A05 y B12 para pista | Texto distingue off/pista/cola; confirmar modo real |
| mp_lyrics | B08 | Carga y después letras, no encontradas o fallo |
| mp_voldown | B04 | Volumen confirmado, sin editar por cada pulsación acumulada |
| mp_stop | B03 | Detención confirmada; una búsqueda anterior no reinicia la sesión |
| mp_volup | B05 | Volumen confirmado y límites actuales |
| mp_queue | B07 | Consulta coherente y paginación; no alterar la cola por abrirla |
| mp_like | A02 | Preferencia privada del actor; no representar favoritos de todos en el corazón público |
| mp_autoplay | A06 | Modo confirmado; no implica que una recomendación ya fue elegida |

Conservar orden/disposición de Soundy. Comandos prefix, slash, botones y entradas existentes deben llamar al mismo servicio; la renovación visual no arregla por sí sola continuidad, autoplay, mezcla o repetir. Mantener el contrato lavalink-client del capítulo 07.

## Tickets y demás módulos

A01 abre; B13 asigna; B14 cierra; B15 reabre; B16 prepara transcripción; B17 archiva; B18 valora; B19/B20/B21 distinguen tipos y asistencia; B22 muestra espera. La acción visible nunca autoriza por sí misma: se valida actor, ticket, roles y revisión. Evitar canales duplicados y no publicar transcripciones privadas en un panel público.

capability-materials.json cubre las 32 fichas con recursos declarados, familias propuestas, estados y alcance diferido. Las funciones verification/events/starboard/collections siguen diferidas donde la base no confirme su dominio; no se anuncian por tener icono.

## Recursos conservados del personaje y tarjetas

character-cards.json conserva 23 entradas del personaje, escenas, fondos y plantillas. Previews y evento real deben usar el mismo renderer y esquema de variables. Avatar/banner permanecen. No añadir textos traducibles al dibujo base.

Configurar destino, texto, fuente aprobada, fondo, avatar, colores y variables como datos validados por servidor. Renderizar fuera del bucle principal, acotar tamaño/tiempo, reutilizar caché por contenido y usar una salida de texto si el render falla. Validar URLs y descargas de recursos mediante el adaptador existente, no desde plantillas arbitrarias.

Antes de cerrar: comprobar nombres largos, avatar ausente, caracteres ES/EN, móvil, contraste, transparencia, doble clic, permisos revocados y reinicio. Los criterios son pendientes de ejecución conectada, no resultados de esta entrega.

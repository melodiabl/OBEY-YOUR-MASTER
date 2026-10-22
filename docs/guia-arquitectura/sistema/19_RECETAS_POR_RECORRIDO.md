# 19 · Recetas de implementación por recorrido

Edición 0.7. Estas recetas conectan materiales y operaciones existentes; no añaden funciones disponibles al bot. Consultar las 32 fichas y capability-materials.json para el alcance de cada capacidad.

| Recorrido | Datos/operación del módulo | Presentación y materiales | Resultado y fallo |
| --- | --- | --- | --- |
| Buscar música | Buscar proveedor, separar pistas/álbumes, invalidar consulta anterior | B09 y claves icon.music/icon.album; ordinal como texto; no emoji objeto interpolado | Resultados paginados, vacío o proveedor afectado; seleccionar valida voz y encola una vez |
| Mensaje privado musical | Resolver actor, permisos y biblioteca propia | Misma traducción/registro; A02 y B07/B08 según la operación | DM bloqueado ofrece una salida privada válida sin publicar favoritos al canal |
| Reproducción | API musical única, estado de sesión y propietario de guild | Doce controles de Soundy; capítulo 16 | Confirmar pista/pausa/cola desde el nodo; no afirmar que los GIF arreglan autoplay |
| Ticket | Tipo, formulario, apertura, asignación, cierre y transcripción | A01, B13–B22, texto localizado y destino privado | Doble clic no duplica; permisos revocados y efecto desconocido se concilian |
| Bienvenida/despedida | Configuración publicada, usuario/guild y renderer existente | B31/B32, A10, personaje y fondos conservados | Preview y evento usan el mismo esquema; fallo de imagen conserva mensaje legible |
| Perfil/niveles | Visibilidad, datos confirmados y recompensas | B36/B37, fondos y plantillas actuales | No anunciar XP o recompensa por haber terminado un render |
| Economía | Operación atómica/deduplicada y recibo | B38/B39; movimiento de regalo después de confirmar | Error de edición no repite una transferencia; privacidad y saldos confirmados |
| Moderación/seguridad | Política, jerarquía, motivo, caso y efecto | A07, B24/B26/B34, catálogo de eventos | Mensaje de caso confirmado o efecto parcial; no afirmar protección universal |
| Roles/voz | Concesiones, propietario, permisos y recurso | B13/B26/B33/B55/B56/B57 | No retirar concesiones ajenas; reinicio no duplica canal |
| Juegos/sorteos | Sesión, participantes, turno, inscripción y resultado | B40/B41 y símbolos propios del render | No cambiar comparadores internos; celebrar solo ganador confirmado |
| Mensajes/solicitudes | Borrador, audiencia, formulario, revisión y envío | B44/B48/B52/B53/B63 | Caducidad, conflictos y permisos; no publicar notas privadas |
| Automatización/fuentes | Evento, regla, job durable y deduplicación | A12/B43/B45/B46/B58 | Un GIF no demuestra entrega; registrar ejecución, parcial y error |
| Architect/plantillas | Propuesta, diff, aplicación autorizada y recuperación | B49/B50, A12 y estados comunes | Mostrar cambios parciales; no modificar canales/roles de otros bots por asociación implícita |

## Dónde cambiar cada cosa

| Cambio | Lugar y regla |
| --- | --- |
| Forma/color de A | Fuente SVG de approved/<familia>/; mantener aprobación registrada y reexportar con nueva revisión |
| Forma/color de B | new/<familia>/icon.svg; propuesta para revisar antes de promocionar |
| Movimiento | Fuente de generación de materiales y GIF; respetar significado pending/active/confirmed |
| Texto | Namespace visual tras merge y traducciones del módulo; no incrustarlo en PNG |
| Destino o override por servidor | Servicio de configuración y schema del módulo, no el catálogo de archivos |
| Qué icono aparece | Presentador de la operación y clave resuelta por el registro existente |
| Regla, permiso o efecto | Servicio/política del módulo; no el componente visual |
| ID publicado | Mapa real reconciliado de la aplicación; nunca copiar IDs de ejemplos o tipos de eventos |

## Aceptación útil

Elegir un recorrido completo y verificar dos guilds, dos idiomas, móvil/escritorio, doble pulsación, sesión antigua, fallo de dependencia y reinicio. Registrar evidencia de operación y de publicación por separado. No restaurar la suite o los scripts retirados por el usuario: seleccionar únicamente las comprobaciones necesarias para el cambio real.

Esta entrega completó archivos y documentación de recursos; las nuevas conexiones runtime, migración de audio, subida y pruebas reales mantienen sus tareas pendientes. No marcar una ficha de módulo terminada porque tenga dibujos o traducciones delta.

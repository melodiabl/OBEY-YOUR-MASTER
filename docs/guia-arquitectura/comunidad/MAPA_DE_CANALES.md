# Mapa del servidor de soporte OBEY

Edición 0.10. Transcripción normalizada de etiquetas visibles del video proporcionado. No incluye decoración exacta ni IDs. Las audiencias y usos son propuestas, no permisos observados. La lista no sustituye un inventario en vivo.

| Canal observado | Propietario funcional propuesto | Audiencia propuesta | Uso |
| --- | --- | --- | --- |
| `anuncios` | messages | public | Anuncios revisados del proyecto |
| `bienvenida` | welcome | public | Bienvenida configurada para esta comunidad |
| `reglas` | messages | public | Reglas fijadas y versionadas por staff |
| `primeros-pasos` | messages | public | Guía breve y accesos útiles |
| `seleccion-de-roles` | roles | public | Panel de roles permitidos |
| `sobre-obey` | messages | public | Presentación y enlaces del proyecto |
| `invitar-obey` | messages | public | Enlace autorizado para añadir OBEY |
| `funciones` | messages | public | Solo capacidades disponibles y verificadas |
| `comandos` | utilities | public | Ayuda y uso general permitido |
| `estado-del-bot` | operations | public | Estado verificable e incidentes revisados |
| `faq` | messages | public | Preguntas frecuentes y rutas a soporte |
| `music-chat` | music | public | Búsqueda, cola y controles de música |
| `playlists` | music | public | Listas y favoritos según capacidades implementadas |
| `music-help` | messages | public | Ayuda musical y acceso a reportes |
| `music-feedback` | suggestions | public | Comentarios sobre la experiencia musical |
| `Music Lounge` | music | public | Canal de voz elegido para reproducción |
| `Listening Room` | music | public | Canal alternativo; misma política de reproducción por guild |
| `abrir-ticket` | tickets | public | Panel de apertura; conversaciones en destino privado |
| `ayuda-general` | messages | public | Preguntas de uso sin datos privados |
| `reportar-errores` | tickets | public | Entrada a reporte; pedir información sensible por ticket |
| `sugerencias` | suggestions | public | Propuestas de miembros |
| `problemas-conocidos` | messages | public | Incidentes publicados y estado revisado |
| `soluciones` | messages | public | Soluciones confirmadas por el equipo |
| `general` | community | public | Conversación general; sin publicaciones técnicas automáticas |
| `presentaciones` | community | public | Presentaciones de miembros |
| `media` | community | public | Contenido compartido por miembros |
| `mudae` | external | public | Reservado para el bot externo y sus reglas propias |
| `creaciones` | community | public | Creaciones de la comunidad |
| `proyectos` | community | public | Proyectos compartidos |
| `eventos` | events | public | Eventos según capacidad habilitada |
| `off-topic` | community | public | Conversación libre según normas |
| `General` | community | public | Voz general; no ocupar automáticamente con música |
| `Chill` | community | public | Voz comunitaria |
| `AFK` | community | public | Canal AFK; no usar como destino musical |
| `actualizaciones` | messages | public | Resumen de versiones aprobado |
| `changelog` | messages | public | Cambios publicados en lenguaje comprensible |
| `roadmap` | messages | public | Plan del proyecto, con etiquetas de estado |
| `proximas-funciones` | messages | public | Propuestas; no presentarlas como funciones listas |
| `votaciones` | suggestions | public | Votaciones con reglas explícitas |
| `dev-chat` | external-github | team | Conversación técnica y avisos GitHub filtrados |
| `resources` | community | team | Documentación y recursos técnicos |
| `beta-testing` | operations | beta | Pruebas autorizadas en entorno separado |
| `test-reports` | operations | beta | Resultados de prueba; no declarar producción por una simulación |
| `contributors` | community | team | Coordinación y reconocimiento del equipo |
| `staff-chat` | community | staff | Conversación interna |
| `staff-commands` | administration | staff | Gestión, moderación y /servidor según permiso |
| `mod-logs` | logs | staff | Registros de moderación de esta guild |
| `ticket-logs` | tickets | staff | Metadatos y enlaces con audiencia restringida |
| `security-alerts` | security | staff | Alertas de seguridad sin secretos |
| `Staff Meeting` | community | staff | Reuniones privadas del equipo |

`public`: comunidad; `staff`: equipo de gestión; `team`: desarrollo/contribución autorizada; `beta`: participantes seleccionados. Confirmar el alcance real de cada rol antes de publicar. El campo owner es clasificación de diseño: community, operations, administration y external-github no declaran módulos nuevos implementados.

Cada entrada de [perfil-soporte.propuesto.json](perfil-soporte.propuesto.json) tiene ID null y publicación deshabilitada. Elegir el recurso por ID, comprobar tipo, guild y permisos; no crear canales por detectar un nombre ausente ni asignar por coincidencia textual. En canales de voz comprobar tipo real antes de usar el destino. El video no verifica esos tipos ni las autorizaciones.

No es necesario automatizar cada espacio. General, media, proyectos o staff-chat pueden seguir siendo conversación. El canal mudae pertenece al uso del bot externo; OBEY no intercepta sus comandos ni administra sus datos privados. La estructura existente se conserva.

## Mensajes incorporados 0.11

Los seis textos de configuración, bienvenida, tickets, reportes, GitHub y novedades se documentan en [mensajes completos](MENSAJES_DE_LA_COMUNIDAD.md). `mensajes.propuestos.json` define estados, audiencia, controles y materiales. Los nuevos textos `community.messages` amplían ES/EN sin borrar las 16 claves previas. Es material de implementación, sin mensajes publicados.

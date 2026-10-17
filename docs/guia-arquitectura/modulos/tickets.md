# Guía de migración del módulo tickets

Tarea `MOD-TICKETS`. Estado `audit_before_migration`. Destino propuesto `src/modules/tickets`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/TicketSchema.js`
- `handlers/ticket.js`
- `handlers/ticketevent.js`
- `handlers/tickets/application-buttons.js`
- `handlers/tickets/presentation.js`
- `handlers/tickets/service.js`
- `slashCommands/Ticket/add.js`
- `slashCommands/Ticket/claim.js`
- `slashCommands/Ticket/close.js`
- `slashCommands/Ticket/remove.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Solicitante/participantes; agente y observador de equipo; responsable reasigna.

1. Elegir panel.
2. validar formulario/cupo.
3. reservar apertura.
4. crear canal.
5. claim independiente de lifecycle.
6. responder o nota privada.
7. cerrar.
8. transcript.
9. borrar por acción separada.

## Fuente de verdad y límites

Ticket y TicketOperation canónicos; adaptar stores legacy/Mongo; TranscriptArtifact y CloseJob privados

Nota interna se almacena aparte, no en un hilo supuesto privado. DTO y transcript para solicitante excluyen notas y evidencias del staff.

Fallo transcript requerido impide borrado. Nueva respuesta invalida autocierre viejo; reabrir conserva historial y valoración. DM fallido no revierte cierre.

## Pasos concretos de reorganización

1. Relacionar cada entrada real con una acción de negocio. Leer los archivos candidatos y completar referencias adicionales; esta lista no es un grafo exhaustivo.
2. Identificar la colección o estado propietario y los efectos externos de esa acción. Registrar todo acceso directo que deba migrar.
3. Extraer el caso de uso pequeño y sus políticas. Si ya hay un servicio, adaptarlo; no crear otro con nombre distinto.
4. Hacer que una entrada delegue y comprobar permiso, efecto y respuesta. Migrar las demás superficies ofrecidas, conservando aliases y customIds.
5. Mantener un adaptador legacy hasta no encontrar consumidores. Aislar el acceso al cliente global detrás de ese adaptador cuando sea necesario.
6. Separar cambios de archivos y cambios de datos. Si hace falta migración, escribir mapping, checkpoint, lectura compatible y rollback antes de ejecutar.
7. Retirar lógica vieja con evidencia de referencias y recorrido; no eliminarla por tener una carpeta nueva.

## Configuración objetivo por conciliar

Campos de diseño de los contratos anteriores. No son claves runtime confirmadas: registrar clave legacy, tipo real, valor existente y fuente canónica antes de adaptarlos. Preservar ausente, null y false como estados distintos.

| Campo | Tipo | Default de diseño | Regla del contrato |
| --- | --- | --- | --- |
| panel.teamId | referencia | obligatoria | Agentes y observadores separados |
| panel.openCategoryId | snowflake | obligatoria | Preflight de permisos antes de abrir |
| panel.closedCategoryId | snowflake nullable | null | Cerrar restringe conversación aunque no mueva canal |
| panel.maxOpenPerMember | int | 1 | 1–5 por panel |
| panel.questions | lista | [] | 0–5 preguntas iniciales; short/paragraph, label,required,min,max |
| transcriptRetentionDays | int | 30 | 7–365; cambio no borra antes de confirmar purga |
| feedbackEnabled | boolean | true | Autor del ticket, una puntuación 1–5 |
| autoCloseHours | int nullable | null | Deshabilitado inicialmente; aviso previo de 24 h si se activa |
| waitingOn | enum none,member,staff | none | Independiente de asignación y lifecycle |
| aiDraftEnabled | boolean | false | Revisión y envío humano obligatorios |
| deleteRequiresTranscript | boolean | true | Bloquear borrado si falla; descarte explícito autorizado como alternativa |

## Casos de aceptación escritos

### tickets FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo tickets.

Cuando Elegir panel y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; borrar por acción separada.

### tickets RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos agentes intentan claim sobre el ticket abierto sin responsable.

Entonces Solo uno queda asignado; el otro recibe responsable actual y puede seguir acciones permitidas.

### tickets RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Fallo transcript requerido impide borrado. Nueva respuesta invalida autocierre viejo; reabrir conserva historial y valoración. DM fallido no revierte cierre.

### tickets PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Nota interna se almacena aparte, no en un hilo supuesto privado. DTO y transcript para solicitante excluyen notas y evidencias del staff.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

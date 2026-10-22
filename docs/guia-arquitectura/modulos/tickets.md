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

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Publicar panel, abrir, asignar/reclamar, añadir participante autorizado, atender, cerrar y transcribir. |
| Configuración | Tipos, categoría, roles soporte, formulario, horarios/mensajes y límite de abiertos; no crear pricing nuevo sin decisión de producto. |
| Datos e invariantes | Ticket con guild, número estable, canal, estado, responsables, participantes, revisión y efectos; política de apertura duplicada explícita. |
| UX/UI | Panel por necesidad; formulario breve; ficha privada con Asignar/Cerrar y aviso de transcripción pendiente. |
| Fallo/concurrencia | Dos aperturas/cierres simultáneos, canal creado con timeout o permiso perdido: comprobar recibo/estado antes de crear/borrar otro canal. |
| Criterio específico | No se filtra transcripción o nota interna a miembros; cerrar y generar transcript tienen resultados separados; panel sigue funcionando tras reinicio. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.ayuda`, `icon.ticket`, `icon.claim`, `icon.close`, `icon.reopen`, `icon.transcript`, `icon.send`, `ticket.icon.abrir`, `ticket.icon.ayuda`, `ticket.icon.tecnico`, `ticket.icon.reporte`, `ticket.icon.atencion`, `ticket.icon.espera`, `ticket.icon.cierre`, `ticket.icon.valoracion`, `icon.info`, `icon.search`, `motion.cargando`, `icon.success`, `icon.error`, `icon.warning`, `motion.ticket-espera`, `motion.ticket-atencion`, `motion.ticket-confirmado`, `motion.character-sobre`, `motion.character-gracias`, `icon.delete`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

El catálogo de eventos complementa los registros del sistema; no sustituye los recursos propios de este módulo ni exige decorar todos sus mensajes. Conservar sus claves actuales y usar auxiliares solo donde exista un consumidor real.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `tickets`. Familias propuestas de este recorrido: `A01`, `A09`, `B13`, `B14`, `B15`, `B16`, `B17`, `B18`, `B19`, `B20`, `B21`, `B22`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 58 apariciones y 45 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Aplicación al servidor de soporte · edición 0.10

El [capítulo 22](../sistema/22_COMUNIDAD_Y_GITHUB.md) y [mapa de canales](../comunidad/MAPA_DE_CANALES.md) proponen destinos del servidor mostrado por el usuario. Conservar este módulo como propietario de sus datos y publicación; validar IDs, permisos y audiencia antes de habilitar. El perfil de soporte no se hereda en guilds cliente. No acreditar funciones por un nombre de canal. GitHub usa inicialmente webhook nativo para avisos técnicos; receptor propio de feeds queda condicional.

## Presentación autorizada 0.11

[Capítulo 23](../sistema/23_MENSAJES_DE_COMUNIDAD.md) conecta las seis familias CM01–CM06 al propietario correspondiente, con [textos completos](../comunidad/MENSAJES_DE_LA_COMUNIDAD.md), localización y condiciones de publicación. Conservar servicios y datos actuales; no confirmar efectos antes de su recibo. El webhook GitHub nativo no consume la plantilla personalizada CM05.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `tickets`. Capacidades dirigidas a esta ficha: D03, D04, D05, D06, D07, D09, D15. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.

## Cobertura de cambios 0.13

[Capítulo 25](../sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y [matriz](../cobertura-eventos/LEER.md) definen fuentes, cobertura condicionada y evidencia del logger base. El propietario de negocio conserva efectos; logs observa y registra sin repetir acciones de moderación. No inferir datos anteriores, responsables o estado funcional a partir de un icono o listener candidato.


## Conciliación de investigación 0.14

El alcance de tickets se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

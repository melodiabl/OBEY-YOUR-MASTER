# Guía de migración del módulo events

Tarea `MOD-EVENTS`. Estado `deferred_no_confirmed_domain`. Destino propuesto `src/modules/events`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

No se confirmó una ruta de dominio. La primera tarea es investigar consumidores; no iniciar una implementación nueva por este documento.

No se identificó un núcleo de eventos con RSVP y cupos en este mapeo. Mantenerlo fuera del refactor operativo hasta confirmar alcance y consumidores.

## Recorrido objetivo y permisos

Organizador configura; miembros elegibles reservan o cancelan.

1. Crear ocurrencia con zona.
2. revisar fecha local y UTC.
3. publicar.
4. reservar plaza o espera.
5. cancelar/promover.
6. recordar.
7. cerrar ocurrencia conservando historial.

## Fuente de verdad y límites

EventSeries, EventOccurrence, RSVP y ReminderDelivery; UTC más zona IANA

Eventos y listas respetan acceso al canal; interés nativo de Discord no equivale a inscripción confirmada.

Guardar zona IANA y política DST para series. Job tardío no envía recordatorio de ocurrencia cancelada; promoción requiere elegibilidad vigente.

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
| timezone | IANA | UTC | Usuario ve conversión; persistencia UTC |
| capacity | int nullable | null | 1–10000 si se limita |
| waitlistEnabled | boolean | true | Solo opera cuando capacity tiene valor |
| reminderMinutes | int[] | [60] | 1–10080, máximo 3 |
| recurrence | enum none,weekly,monthly | none | Repetición con política explícita de horario de verano |
| eligibleRoleIds | snowflake[] | [] | Vacío permite miembros |
| responseOptions | lista id,label,capacity | asistir/no_asistir/quizas | Solo opciones reservables ocupan plaza |
| waitlistPromotion | enum auto,confirm | auto | Primer elegible; confirm con plazo |
| confirmationMinutes | int | 30 | Propuesta 5–1440; libera reserva al vencer |
| nativeEventSync | boolean | false | Interés nativo no equivale a plaza |

## Casos de aceptación escritos

### events FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo events.

Cuando Crear ocurrencia con zona y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; cerrar ocurrencia conservando historial.

### events RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos miembros solicitan la última plaza disponible.

Entonces Solo uno reserva; el otro pasa a espera ordenada sin sobrecupo.

### events RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Guardar zona IANA y política DST para series. Job tardío no envía recordatorio de ocurrencia cancelada; promoción requiere elegibilidad vigente.

### events PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Eventos y listas respetan acceso al canal; interés nativo de Discord no equivale a inscripción confirmada.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

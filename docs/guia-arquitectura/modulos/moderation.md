# Guía de migración del módulo moderation

Tarea `MOD-MODERATION`. Estado `audit_before_migration`. Destino propuesto `src/modules/moderation`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/ModerationSchema.js`
- `handlers/moderation/action.js`
- `handlers/moderation/cases.js`
- `slashCommands/Moderation/ban.js`
- `slashCommands/Moderation/cases.js`
- `slashCommands/Moderation/kick.js`
- `slashCommands/Moderation/purge.js`
- `slashCommands/Moderation/slowmode.js`
- `slashCommands/Moderation/timeout.js`
- `slashCommands/Moderation/unban.js`
- `slashCommands/Moderation/unwarn.js`
- `slashCommands/Moderation/vdeafen.js`
- `slashCommands/Moderation/vkick.js`
- `slashCommands/Moderation/vmute.js`
- `slashCommands/Moderation/warn.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Staff con capacidad y jerarquía efectivas; sujeto puede ver aviso permitido.

1. Elegir acción y sujeto.
2. verificar rol y límite de acción.
3. pedir motivo.
4. mostrar efecto.
5. aplicar sanción.
6. registrar recibo y caso.
7. intentar notificación.

## Fuente de verdad y límites

ModerationCase y secuencia atómica; acción, persistencia y DM tienen resultados distintos

Historial staff según capacidad; sujeto solo su notificación/expediente permitido; evidencia restringida, sin publicación automática.

Sanción aplicada y DM fallido devuelven resultado parcial, no sanción fallida. Si Discord responde con resultado incierto, conciliar antes de repetir.

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
| reasonRequired | boolean | true | 3–500 caracteres |
| notifyMember | boolean | true | Fallo DM se registra; no revierte sanción aplicada |
| reasonAliases | lista | [] | Clave única, texto, acción sugerida; no ejecutar por escribir alias |
| evidenceRetentionDays | int | 90 | 7–365 |
| defaultTimeoutSeconds | int | 600 | Validar máximo oficial al implementar |
| appealChannelId | snowflake nullable | null | Enlace informativo; no canal público de evidencia |
| automaticActions | conjunto | aviso,borrado,timeout | Kick/ban requieren revisión salvo regla avanzada explícita |

## Casos de aceptación escritos

### moderation FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo moderation.

Cuando Elegir acción y sujeto y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; intentar notificación.

### moderation RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El staff confirma dos veces una sanción mientras el primer envío está pendiente.

Entonces Un recibo evita una segunda sanción; el caso conserva una sola actuación.

### moderation RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Sanción aplicada y DM fallido devuelven resultado parcial, no sanción fallida. Si Discord responde con resultado incierto, conciliar antes de repetir.

### moderation PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Historial staff según capacidad; sujeto solo su notificación/expediente permitido; evidencia restringida, sin publicación automática.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

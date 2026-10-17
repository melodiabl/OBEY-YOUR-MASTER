# Guía de migración del módulo giveaways

Tarea `MOD-GIVEAWAYS`. Estado `audit_before_migration`. Destino propuesto `src/modules/giveaways`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/GiveawaySchema.js`
- `handlers/command.js`
- `handlers/giveaway.js`
- `slashCommands/Giveaway/end.js`
- `slashCommands/Giveaway/list.js`
- `slashCommands/Giveaway/pause.js`
- `slashCommands/Giveaway/reroll.js`
- `slashCommands/Giveaway/resume.js`
- `slashCommands/Giveaway/start.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Organizador publica/cierra; miembros elegibles participan.

1. Validar premio y fecha.
2. publicar.
3. aceptar participación única.
4. al cierre verificar requisitos.
5. seleccionar resultado.
6. persistir.
7. anunciar.
8. reroll separado con motivo.

## Fuente de verdad y límites

Giveaway, Entry y DrawResult con revisión y operationId

Participantes ven reglas y resultado público; staff ve recibos y exclusiones justificadas. Sorteo no debe exponer datos privados de elegibilidad.

Persistir ganadores antes de anunciar. Reintentar cierre anuncia mismo resultado; reroll crea evento nuevo y conserva resultado previo.

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
| winners | int | 1 | 1–20 y máximo participantes elegibles |
| endsAt | timestamp | obligatorio | Futuro al publicar |
| requiredRoleIds | snowflake[] | [] | Verificar al entrar y al finalizar |
| excludedRoleIds | snowflake[] | [] | Exclusión prevalece |
| prize | string | obligatorio | 1–200 caracteres |
| allowReroll | boolean | true | Solo organizador, motivo obligatorio |

## Casos de aceptación escritos

### giveaways FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo giveaways.

Cuando Validar premio y fecha y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; reroll separado con motivo.

### giveaways RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos workers alcanzan endsAt al mismo tiempo.

Entonces Una sola operación fija ganadores y el segundo worker reutiliza ese resultado.

### giveaways RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Persistir ganadores antes de anunciar. Reintentar cierre anuncia mismo resultado; reroll crea evento nuevo y conserva resultado previo.

### giveaways PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Participantes ven reglas y resultado público; staff ve recibos y exclusiones justificadas. Sorteo no debe exponer datos privados de elegibilidad.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

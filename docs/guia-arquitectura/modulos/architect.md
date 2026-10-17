# Guía de migración del módulo architect

Tarea `MOD-ARCHITECT`. Estado `audit_before_migration`. Destino propuesto `src/modules/architect`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `dashboard/architect-routes.js`
- `handlers/architect.js`
- `handlers/architect/application-repository.js`
- `handlers/architect/application.js`
- `handlers/architect/blueprint.js`
- `handlers/architect/cascades.js`
- `handlers/architect/creations.js`
- `handlers/architect/decoration.js`
- `handlers/architect/diff.js`
- `handlers/architect/moves.js`
- `handlers/architect/permissions.js`
- `handlers/architect/preflight.js`
- `handlers/architect/reorders.js`
- `handlers/architect/repository.js`
- `handlers/architect/restore-point-repository.js`
- `handlers/architect/restore-points.js`
- `handlers/architect/service.js`
- `handlers/architect/snapshot.js`
- `handlers/architect/themes.js`
- `handlers/architect/wizard.js`
- `workers/architect-edits.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor con propiedad del borrador; aplicación requiere capacidad habilitada.

1. Capturar estructura.
2. editar blueprint.
3. preflight.
4. diff con permisos/borrados.
5. snapshot de cobertura conocida.
6. confirmación vinculada.
7. aplicar por operación.
8. reconciliar.

## Fuente de verdad y límites

Blueprint, Plan, Operation, RestorePoint y ResourceBinding por guild

Solo gestor ve propuesta y trabajos propios/autorizados; plantillas no incluyen tokens ni datos privados de conversaciones.

Cambio externo invalida revisión. Aplicación parcial conserva recibos y reanuda solo operaciones seguras; rollback no promete recuperar mensajes o identidad original de recursos borrados.

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
| applyMode | enum additive,reconcile | additive | Reconcile explicita borrados; nunca default destructivo |
| blueprintId | referencia | obligatorio | Versión fijada al crear plan |
| preserveRoleIds | snowflake[] | roles protegidos | Bot,managed,owner y referencias críticas |
| namePolicy | enum preserve,template | preserve | Transformación solo si elegida |
| snapshotRequired | boolean | true | Cobertura explícita antes de aplicar |
| dryRun | boolean | true en preview | Aplicación separada del borrador |
| aiPlanEnabled | boolean | false | Genera plan editable; no ejecuta sin diff y confirmación |

## Casos de aceptación escritos

### architect FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo architect.

Cuando Capturar estructura y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; reconciliar.

### architect RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Otro bot renombra un canal entre preview y confirmación.

Entonces Se detecta drift y se vuelve al diff en lugar de pisar el cambio externo.

### architect RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Cambio externo invalida revisión. Aplicación parcial conserva recibos y reanuda solo operaciones seguras; rollback no promete recuperar mensajes o identidad original de recursos borrados.

### architect PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Solo gestor ve propuesta y trabajos propios/autorizados; plantillas no incluyen tokens ni datos privados de conversaciones.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

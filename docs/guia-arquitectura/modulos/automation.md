# Guía de migración del módulo automation

Tarea `MOD-AUTOMATION`. Estado `audit_before_migration`. Destino propuesto `src/modules/automation`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/CustomCommandSchema.js`
- `database/schemas/KeywordSchema.js`
- `handlers/keyword.js`

Keywords y comandos personalizados son antecedentes; no prueban un motor general evento condición acción. Migrar lo que exista antes de ampliar.

## Recorrido objetivo y permisos

Gestor/editor define reglas; servicio ejecuta solo acciones allowlist.

1. Definir evento.
2. condiciones.
3. acciones.
4. presupuesto.
5. simular.
6. habilitar.
7. evaluar evento con correlationId.
8. registrar efectos y resultado.

## Fuente de verdad y límites

AutomationRule, Run y ActionReceipt; ejecución idempotente y jobs registrados

Editor ve trace redactado; secretos nunca se devuelven. Reglas no ejecutan JavaScript del usuario ni convierten texto en permisos.

Evitar ciclos por origen/correlación y máximo de pasos. Retry respeta recibo por efecto; parte aplicada y parte fallida se muestra como parcial.

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
| trigger | enum | obligatorio | Solo eventos registrados en catálogo |
| conditions | árbol declarativo | all:[] | Profundidad máxima 3,20 condiciones |
| actions | lista | obligatoria | Máximo 5; allowlist de acciones |
| cooldownSeconds | int | 60 | 1–86400 por regla/objeto |
| runMode | enum simulate,live | simulate | Simular no causa efectos |
| stopOnFailure | boolean | true | Acciones posteriores skipped con motivo |
| webhookIntegration | enum disabled,n8n | disabled | Firmas, scope, replay protection; no dependencia del core |

## Casos de aceptación escritos

### automation FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo automation.

Cuando Definir evento y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; registrar efectos y resultado.

### automation RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando La acción cambia un rol y ese cambio vuelve a activar la misma regla.

Entonces La correlación y el presupuesto cortan el ciclo sin añadir otro efecto.

### automation RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Evitar ciclos por origen/correlación y máximo de pasos. Retry respeta recibo por efecto; parte aplicada y parte fallida se muestra como parcial.

### automation PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Editor ve trace redactado; secretos nunca se devuelven. Reglas no ejecutan JavaScript del usuario ni convierten texto en permisos.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

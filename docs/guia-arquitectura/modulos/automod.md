# Guía de migración del módulo automod

Tarea `MOD-AUTOMOD`. Estado `audit_before_migration`. Destino propuesto `src/modules/automod`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/anticaps.js`
- `handlers/antidiscord.js`
- `handlers/antilinks.js`
- `handlers/antimention.js`
- `handlers/antispam.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor elige autoridad y reglas; staff revisa incidentes.

1. Crear regla.
2. seleccionar trigger y condiciones.
3. excluir canales/roles válidos.
4. simular coincidencia.
5. observar.
6. habilitar enforce.
7. emitir un incidente por efecto.

## Fuente de verdad y límites

AutoModRuleBinding y EnforcementOperation por mensaje/regla/acción

Staff ve fragmentos solo si retención permite; miembro recibe aviso mínimo. Una autoridad nativa o propia por regla, sin castigo duplicado.

Reintento de borrado no suma infracciones; contador usa ventana definida. Acción no autorizada se reporta como bloqueada y conserva evidencia permitida.

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
| mode | enum observe,enforce | observe | Activación inicial observa sin sancionar |
| rules | lista | [] | Trigger,condiciones,exclusiones,acción,orden |
| counterWindowSeconds | int | 600 | 10–86400 |
| escalations | lista | [] | Umbral ascendente y acción explícita |
| ignoreBots | boolean | true | Evitar loops |
| evidenceMode | enum metadata,excerpt | metadata | Fragmento solo si retención habilitada |

## Casos de aceptación escritos

### automod FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo automod.

Cuando Crear regla y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; emitir un incidente por efecto.

### automod RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando La misma infracción es detectada por regla nativa y listener propio.

Entonces La autoridad elegida ejecuta el efecto; la otra observa y enlaza el mismo incidente.

### automod RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reintento de borrado no suma infracciones; contador usa ventana definida. Acción no autorizada se reporta como bloqueada y conserva evidencia permitida.

### automod PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Staff ve fragmentos solo si retención permite; miembro recibe aviso mínimo. Una autoridad nativa o propia por regla, sin castigo duplicado.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

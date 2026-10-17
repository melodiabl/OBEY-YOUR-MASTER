# Guía de migración del módulo roles

Tarea `MOD-ROLES`. Estado `audit_before_migration`. Destino propuesto `src/modules/roles`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `commands/Administration/addrole.js`
- `commands/Administration/addroletobots.js`
- `commands/Administration/addroletoeveryone.js`
- `commands/Administration/addroletohumans.js`
- `commands/Administration/addroletorole.js`
- `commands/Administration/removerole.js`
- `commands/Administration/removerolefrombots.js`
- `commands/Administration/removerolefromeveryone.js`
- `commands/Administration/removerolefromhumans.js`
- `commands/Administration/removerolefromrole.js`
- `handlers/reactionrole.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro selecciona roles permitidos; gestor define grupos y requisitos.

1. Seleccionar grupo.
2. mostrar opciones elegibles.
3. validar mínimos/máximos.
4. revisar requisitos y jerarquía.
5. aplicar concesiones.
6. devolver selección real.

## Fuente de verdad y límites

RoleGrant por guild/member/role/origen; registrar si rol ya existía externamente

Miembro ve sus selecciones y opciones públicas; gestor ve reglas y origen de concesiones, sin editar roles administrados por integraciones.

Retirar selección solo revoca concesión de ese grupo. Otro origen válido mantiene el rol. Rol movido sobre el bot produce error sin fingir selección aplicada.

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
| selection | enum single,multiple | multiple | Single revoca concesiones del mismo grupo; respeta otros orígenes |
| minSelected | int | 0 | 0–maxSelected |
| maxSelected | int | 1 | Hasta número de opciones; límites del renderer comprobados |
| requiredRoleIds | snowflake[] | [] | Todos requeridos |
| blockedRoleIds | snowflake[] | [] | Cualquiera bloquea |
| removeOnUnselect | boolean | true | Solo roles del panel |
| autoRoleIds | snowflake[] | [] | No roles con permisos administrativos |

## Casos de aceptación escritos

### roles FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo roles.

Cuando Seleccionar grupo y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; devolver selección real.

### roles RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos paneles conceden el mismo rol y el miembro desmarca uno.

Entonces Se elimina un origen; el otro conserva el rol efectivo.

### roles RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Retirar selección solo revoca concesión de ese grupo. Otro origen válido mantiene el rol. Rol movido sobre el bot produce error sin fingir selección aplicada.

### roles PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Miembro ve sus selecciones y opciones públicas; gestor ve reglas y origen de concesiones, sin editar roles administrados por integraciones.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

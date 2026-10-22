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

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Asignar/retirar roles por panel, selección, recompensa o política existente mediante una API de concesiones. |
| Configuración | Paneles, opciones, exclusión mutua, requisitos y roles administrables; jerarquía real. |
| Datos e invariantes | Rol concedido por varias fuentes conserva provenance o política equivalente; retirar una no elimina concesión vigente ajena. |
| UX/UI | Etiqueta de rol, requisito y selección actual; confirmación privada con resultado completo/parcial. |
| Fallo/concurrencia | Rol eliminado, managed, por encima del bot o selección concurrente: rechazo claro sin ampliar permisos. |
| Criterio específico | No se conceden roles fuera de guild o privilegios no permitidos; acciones persistentes sobreviven reinicio. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.ayuda`, `icon.roles`, `icon.verify`, `icon.info`, `icon.close`, `icon.search`, `icon.success`, `icon.warning`, `icon.lock`, `icon.error`, `motion.cargando`, `motion.exito`, `icon.edit`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

Hay 7 entradas candidatas vinculadas a esta ficha en el mapa de integración. Se eligen por vista real y significado; no se activa una función por existir el dibujo.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `roles`. Familias propuestas de este recorrido: `B13`, `B26`, `B33`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 24 apariciones y 13 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `roles`. Capacidades dirigidas a esta ficha: D04, D16. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.

## Cobertura de cambios 0.13

[Capítulo 25](../sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y [matriz](../cobertura-eventos/LEER.md) definen fuentes, cobertura condicionada y evidencia del logger base. El propietario de negocio conserva efectos; logs observa y registra sin repetir acciones de moderación. No inferir datos anteriores, responsables o estado funcional a partir de un icono o listener candidato.


## Conciliación de investigación 0.14

El alcance de roles se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

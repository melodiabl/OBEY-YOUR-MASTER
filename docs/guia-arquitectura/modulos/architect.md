# Guía de migración del módulo architect

Tarea `MOD-ARCHITECT`. Estado `audit_before_migration`. Destino propuesto `src/modules/architect`. La migración preserva funciones y datos existentes; la ficha original no autorizaba agregar funciones nuevas; la ampliación 0.8 autoriza específicamente el recorrido Build definido en el capítulo 20.


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

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Analizar estructura autorizada, generar propuesta/diff, aplicar acciones revisadas y registrar resultado. |
| Configuración | Alcance, estilos y recursos administrables; conservar roles/canales existentes por defecto. |
| Datos e invariantes | Plan inmutable/revisión, acciones ordenadas, IDs creados y resultado por efecto; no prometer transacción Discord. |
| UX/UI | Preview de antes/después, alcance y confirmación concreta; recibo de completos/parciales. |
| Fallo/concurrencia | Pérdida de permisos, creación incierta o aplicación interrumpida: checkpoint y conciliación antes de continuar. |
| Criterio específico | No destruye recursos por parecido de nombre; cada cambio tiene identidad; recuperación explica acciones irreversibles. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.configuracion`, `icon.blueprint`, `icon.warning`, `icon.undo`, `icon.info`, `icon.search`, `icon.success`, `icon.error`, `motion.cargando`, `motion.exito`, `icon.template`, `icon.edit`, `icon.chart`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

El catálogo de eventos complementa los registros del sistema; no sustituye los recursos propios de este módulo ni exige decorar todos sus mensajes. Conservar sus claves actuales y usar auxiliares solo donde exista un consumidor real.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `architect`. Familias propuestas de este recorrido: `B49`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 11 apariciones y 20 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Build autorizado · edición 0.8

La remodelación solicitada toma Server Maker como referencia funcional. [Capítulo 20](../sistema/20_BUILD_Y_REMODELACION.md) define centro Discord, construcción guiada/IA, edición, creación puntual, plantillas, clonación autorizada, bindings, progreso e historial/compensación. Reutilizar Architect y jobs actuales; no crear un motor paralelo. Ver [evidencia y límites](../build/INVESTIGACION_SERVER_MAKER.md) y [deltas ES/EN](../build/LEER.md).

Estado: alcance autorizado y documentado; implementación pendiente. La base ya contiene parte de los servicios, pero el compilador limita creaciones privadas, las capacidades requieren conciliación y no hay restauración ni IA verificadas. Los materiales A/B existentes cubren la propuesta; B sigue pendiente de aprobación visual.

## Decisión de nombres 0.9

El usuario rechaza Architect como nombre de comando. Implementar **`/servidor`**, panel **Servidor**, y acciones en lenguaje claro conforme a [nombres públicos](../sistema/21_NOMBRES_CLAROS.md). `/build` deja de ser la entrada propuesta; las entradas públicas antiguas se migran al publicar de forma autorizada. Conservar servicios, claves técnicas y datos hasta poder migrarlos con evidencia. No registrar alias técnicos permanentes ni confundir cambio documental con implementación.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `architect`. Capacidades dirigidas a esta ficha: D01, D04, D05, D06, D07. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.


## Conciliación de investigación 0.14

El alcance de architect se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

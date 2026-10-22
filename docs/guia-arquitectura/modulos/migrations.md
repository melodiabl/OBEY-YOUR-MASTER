# Guía de migración del módulo migrations

Tarea `MOD-MIGRATIONS`. Estado `audit_before_migration`. Destino propuesto `src/modules/migrations`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/music/playlist-repository.js`

Se encontró conciliación de playlists específica. No presentarla como importador universal de datos o sistemas de otros bots.

## Recorrido objetivo y permisos

Gestor autorizado revisa formato, mapping y diff.

1. Seleccionar adaptador soportado.
2. importar archivo validado.
3. preflight.
4. mapear roles/canales locales.
5. dry-run.
6. confirmar revisión.
7. aplicar lotes con checkpoint.
8. verificar conciliación.

## Fuente de verdad y límites

MigrationRun, Mapping y Checkpoint; snapshot antes de transformaciones destructivas

Solo export autorizado por el usuario; no leer bases privadas de otros bots ni fingir import universal. Redactar secretos y datos fuera de scope.

Reintento retoma checkpoint. Conflicto keep/replace se muestra por campo. Rollback comprueba escrituras nuevas y no borra cambios posteriores legítimos.

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
| sourceAdapter | enum registrado | obligatorio | Formato/versiones documentados |
| mode | enum preview,apply | preview | Aplicar después del diff |
| mapping | mapa | {} | Roles/canales locales; no IDs de otra guild |
| conflictPolicy | enum keep,replace | keep | Mostrar reemplazos |
| batchSize | int | 100 | Propuesta 1–1000 |

## Casos de aceptación escritos

### migrations FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo migrations.

Cuando Seleccionar adaptador soportado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; verificar conciliación.

### migrations RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El miembro cambia un dato entre dry-run y lote que iba a reemplazarlo.

Entonces La revisión del campo detecta conflicto y respeta la política elegida con evidencia.

### migrations RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reintento retoma checkpoint. Conflicto keep/replace se muestra por campo. Rollback comprueba escrituras nuevas y no borra cambios posteriores legítimos.

### migrations PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Solo export autorizado por el usuario; no leer bases privadas de otros bots ni fingir import universal. Redactar secretos y datos fuera de scope.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Versionar y ejecutar cambios de datos con precondición, checkpoint, verificación y recuperación. |
| Configuración | Operación de mantenimiento autorizada, lote y alcance; no un menú vacío para miembros. |
| Datos e invariantes | Registro de versión y progreso; reejecución idempotente o detenida por precondición. |
| UX/UI | Informe de operador con afectados, fallos y siguiente acción; sin datos personales en logs. |
| Fallo/concurrencia | Lote interrumpido o lector viejo activo: compatibilidad de lectura y retomada por checkpoint. |
| Criterio específico | Restauración no revierte credenciales ni reactiva funciones retiradas; dos ejecutores no migran el mismo lote sin coordinación. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.configuracion`, `icon.export`, `icon.info`, `icon.search`, `icon.edit`, `icon.success`, `icon.warning`, `icon.error`, `motion.cargando`, `motion.exito`, `icon.levels`, `icon.transcript`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

El catálogo de eventos complementa los registros del sistema; no sustituye los recursos propios de este módulo ni exige decorar todos sus mensajes. Conservar sus claves actuales y usar auxiliares solo donde exista un consumidor real.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `migrations`. Familias propuestas de este recorrido: `A12`, `B53`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 0 apariciones y 0 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.


## Conciliación de investigación 0.14

El alcance de migrations se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

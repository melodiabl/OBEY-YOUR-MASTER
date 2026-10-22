# Guía de migración del módulo applications

Tarea `MOD-APPLICATIONS`. Estado `audit_before_migration`. Destino propuesto `src/modules/applications`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/apply.js`
- `handlers/tickets/application-buttons.js`

Se encontraron handlers de solicitudes. Comprobar tipos de formulario, persistencia y revisores; no confundirlos con planes de aplicación de Architect.

## Recorrido objetivo y permisos

Solicitante completa propia solicitud; revisor autorizado decide.

1. Elegir formulario publicado.
2. fijar versión de preguntas.
3. completar pasos.
4. validar.
5. enviar.
6. bloquear edición según política.
7. revisión.
8. decisión.
9. rol autorizado si aplica.

## Fuente de verdad y límites

ApplicationForm revisionado, Submission, Review y RoleGrant separado

Respuestas y notas no son públicas. Revisor solo accede si mantiene rol/capacidad; solicitante ve estado y mensaje de decisión permitido.

Expiración conserva estado coherente sin enviar una solicitud incompleta. Aceptar y asignar rol tienen recibos separados; rol fallido no anuncia concesión exitosa.

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
| questions | lista versionada | [] | Propuesta 1–20; dividir en pasos compatibles |
| reviewerRoleIds | lista | [] | Obligatoria para activar |
| completionMinutes | int | 60 | Propuesta 5–1440 |
| roleActions | mapa | {} | Permisos y jerarquía al aplicar |
| retentionDays | int | 90 | Propuesta 7–365 |

## Casos de aceptación escritos

### applications FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo applications.

Cuando Elegir formulario publicado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; rol autorizado si aplica.

### applications RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos revisores toman decisiones opuestas sobre la misma revisión.

Entonces Una decisión gana; el otro recibe estado actual y no aplica una segunda acción de rol.

### applications RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Expiración conserva estado coherente sin enviar una solicitud incompleta. Aceptar y asignar rol tienen recibos separados; rol fallido no anuncia concesión exitosa.

### applications PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Respuestas y notas no son públicas. Revisor solo accede si mantiene rol/capacidad; solicitante ve estado y mensaje de decisión permitido.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Publicar formulario, recibir solicitud, asignar revisión y aprobar/rechazar con motivo. |
| Configuración | Preguntas, roles revisores, destino privado, estados y retención; resultado de rol vía módulo roles. |
| Datos e invariantes | Solicitud y respuestas con permisos por recurso; decisión y efectos separados si hay concesión externa. |
| UX/UI | Formulario breve, recibo privado, ficha para revisión y estado consultable por solicitante. |
| Fallo/concurrencia | Dos revisores deciden, DM bloqueado o rol no concedible: conflicto/resultado parcial y recibo. |
| Criterio específico | Solicitante no lee respuestas ajenas; una decisión no asigna dos veces un rol ni publica datos privados. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.ayuda`, `icon.case`, `icon.info`, `icon.send`, `icon.edit`, `icon.search`, `icon.success`, `icon.warning`, `icon.error`, `motion.cargando`, `motion.exito`, `icon.lock`, `icon.idea`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

El catálogo de eventos complementa los registros del sistema; no sustituye los recursos propios de este módulo ni exige decorar todos sus mensajes. Conservar sus claves actuales y usar auxiliares solo donde exista un consumidor real.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `applications`. Familias propuestas de este recorrido: `B48`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 0 apariciones y 0 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `applications`. Capacidades dirigidas a esta ficha: D06, D15. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.


## Conciliación de investigación 0.14

El alcance de applications se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

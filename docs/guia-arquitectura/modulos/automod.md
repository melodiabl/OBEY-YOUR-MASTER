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

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Evaluar reglas de contenido existentes, aplicar excepción, registrar coincidencia y ejecutar sanción autorizada. |
| Configuración | Reglas, canales/roles exentos, umbrales y acciones; separar Discord AutoMod nativo de detector propio. |
| Datos e invariantes | Match con versión de regla y evidencia minimizada; moderación ejecuta las sanciones que le pertenecen. |
| UX/UI | Editor con prueba de ejemplo, resumen de excepción y resultado; las reglas no son JavaScript arbitrario. |
| Fallo/concurrencia | Mensaje editado, evento repetido o dos detectores: política de deduplicación y prioridad evita castigo duplicado. |
| Criterio específico | No sanciona a exentos; las expresiones peligrosas tienen límites; una regla inválida no detiene las demás. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.moderacion`, `icon.shield`, `icon.automation`, `icon.warning`, `icon.info`, `icon.edit`, `icon.search`, `icon.success`, `icon.error`, `motion.cargando`, `motion.exito`, `icon.chart`, `icon.lock`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

Hay 4 entradas candidatas vinculadas a esta ficha en el mapa de integración. Se eligen por vista real y significado; no se activa una función por existir el dibujo.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `automod`. Familias propuestas de este recorrido: `A07`, `B24`, `B45`, `B09`, `B23`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 0 apariciones y 0 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `automod`. Capacidades dirigidas a esta ficha: D14. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.

## Cobertura de cambios 0.13

[Capítulo 25](../sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y [matriz](../cobertura-eventos/LEER.md) definen fuentes, cobertura condicionada y evidencia del logger base. El propietario de negocio conserva efectos; logs observa y registra sin repetir acciones de moderación. No inferir datos anteriores, responsables o estado funcional a partir de un icono o listener candidato.


## Conciliación de investigación 0.14

El alcance de automod se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

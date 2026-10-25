# Guía de migración del módulo moderation

Tarea `MOD-MODERATION`. Estado `partial_migration_in_isolation`. El primer corte de advertencias ya reside en `src/modules/moderation`; el resto y su aceptación real siguen pendientes. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.

El [corte de advertencias del 25/10](../../platform/P0-WARNING-MODULE-2026-10-25.md) conecta nueve entradas Discord y ocho protecciones automáticas a casos persistidos y distingue adaptadores, reglas y almacenamiento. Aún no está desplegado. La captura privada del proceso vivo confirmó cero acciones antiguas y cero perfiles con referencias de avisos cargadas; el inspector de diagnóstico se cerró. Estas casillas describen **todo moderation**, por lo que siguen abiertas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/ModerationSchema.js`
- `handlers/moderation/action.js`
- `handlers/moderation/cases.js`
- `slashCommands/Moderation/ban.js`
- `slashCommands/Moderation/cases.js`
- `slashCommands/Moderation/kick.js`
- `slashCommands/Moderation/purge.js`
- `slashCommands/Moderation/slowmode.js`
- `slashCommands/Moderation/timeout.js`
- `slashCommands/Moderation/unban.js`
- `slashCommands/Moderation/unwarn.js`
- `slashCommands/Moderation/vdeafen.js`
- `slashCommands/Moderation/vkick.js`
- `slashCommands/Moderation/vmute.js`
- `slashCommands/Moderation/warn.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Staff con capacidad y jerarquía efectivas; sujeto puede ver aviso permitido.

1. Elegir acción y sujeto.
2. verificar rol y límite de acción.
3. pedir motivo.
4. mostrar efecto.
5. aplicar sanción.
6. registrar recibo y caso.
7. intentar notificación.

## Fuente de verdad y límites

ModerationCase y secuencia atómica; acción, persistencia y DM tienen resultados distintos

Historial staff según capacidad; sujeto solo su notificación/expediente permitido; evidencia restringida, sin publicación automática.

Sanción aplicada y DM fallido devuelven resultado parcial, no sanción fallida. Si Discord responde con resultado incierto, conciliar antes de repetir.

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
| reasonRequired | boolean | true | 3–500 caracteres |
| notifyMember | boolean | true | Fallo DM se registra; no revierte sanción aplicada |
| reasonAliases | lista | [] | Clave única, texto, acción sugerida; no ejecutar por escribir alias |
| evidenceRetentionDays | int | 90 | 7–365 |
| defaultTimeoutSeconds | int | 600 | Validar máximo oficial al implementar |
| appealChannelId | snowflake nullable | null | Enlace informativo; no canal público de evidencia |
| automaticActions | conjunto | aviso,borrado,timeout | Kick/ban requieren revisión salvo regla avanzada explícita |

## Casos de aceptación escritos

### moderation FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo moderation.

Cuando Elegir acción y sujeto y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; intentar notificación.

### moderation RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El staff confirma dos veces una sanción mientras el primer envío está pendiente.

Entonces Un recibo evita una segunda sanción; el caso conserva una sola actuación.

### moderation RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Sanción aplicada y DM fallido devuelven resultado parcial, no sanción fallida. Si Discord responde con resultado incierto, conciliar antes de repetir.

### moderation PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Historial staff según capacidad; sujeto solo su notificación/expediente permitido; evidencia restringida, sin publicación automática.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Advertir, silenciar/timeout, expulsar, banear/desbanear y consultar casos según comandos vigentes. |
| Configuración | Roles autorizados, motivos, duraciones, destino de logs y notificación privada opcional. |
| Datos e invariantes | Caso auditable y efecto Discord identificado; jerarquía y permisos efectivos antes de actuar. |
| UX/UI | Acción con objetivo/motivo/duración y confirmación para impacto definido; recibo con número de caso. |
| Fallo/concurrencia | Efecto aplicado con respuesta perdida, miembro que sale o jerarquía cambiada: consultar y registrar parcial/desconocido. |
| Criterio específico | Doble solicitud no repite sanción ni crea dos casos efectivos; usuario sin permiso no accede al historial privado. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.moderacion`, `icon.case`, `icon.shield`, `icon.warning`, `icon.transcript`, `icon.close`, `icon.info`, `icon.edit`, `icon.search`, `icon.previous`, `motion.cargando`, `icon.success`, `icon.lock`, `motion.exito`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

Hay 5 entradas candidatas vinculadas a esta ficha en el mapa de integración. Se eligen por vista real y significado; no se activa una función por existir el dibujo.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `moderation`. Familias propuestas de este recorrido: `A07`, `B19`, `B24`, `B26`, `B34`, `B09`, `B23`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 85 apariciones y 28 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Cobertura de cambios 0.13

[Capítulo 25](../sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y [matriz](../cobertura-eventos/LEER.md) definen fuentes, cobertura condicionada y evidencia del logger base. El propietario de negocio conserva efectos; logs observa y registra sin repetir acciones de moderación. No inferir datos anteriores, responsables o estado funcional a partir de un icono o listener candidato.


## Conciliación de investigación 0.14

El alcance de moderation se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

# Guía de migración del módulo levels

Tarea `MOD-LEVELS`. Estado `audit_before_migration`. Destino propuesto `src/modules/levels`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/RankingSchema.js`
- `handlers/cards/rankcard.js`
- `handlers/ranking.js`
- `slashCommands/Rank/leaderboard.js`
- `slashCommands/Rank/rank.js`
- `slashCommands/Rank/setlevel.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro consulta progreso; gestor configura fuentes y recompensas.

1. Elegir fuentes XP.
2. definir elegibilidad/cooldowns.
3. registrar evento elegible.
4. calcular progreso.
5. conceder recompensa por versión.
6. anunciar según destino.

## Fuente de verdad y límites

XPAccount por guild/member; XPGrant idempotente; SeasonScore separado del saldo histórico

Ranking respeta visibilidad; historial y temporada son distintos. No exponer contenido de mensajes para justificar el XP.

Reprocesar evento no entrega XP ni premio dos veces. Rol no asignable deja premio pendiente; no revertir progreso ganado por fallo de notificación.

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
| xpSources | conjunto message,voice | [message] | Reacciones quedan extensión desactivada |
| messageXp | int | 20 | Default solo servidor nuevo; migrar valor existente |
| messageCooldownSeconds | int | 60 | 10–3600 por miembro |
| voiceXpPerMinute | int | 2 | No solo/AFK; elegibilidad documentada |
| rewardMode | enum stack,highest | stack | Highest solo roles de este módulo |
| seasonMode | enum none,monthly | none | No reinicia nivel histórico |
| announceDestination | enum none,current,dm,channel | none | Canal obligatorio en channel |
| rankingMode | enum lifetime,season | lifetime | Conservar ambos; congelar temporada cerrada |

## Casos de aceptación escritos

### levels FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo levels.

Cuando Elegir fuentes XP y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; anunciar según destino.

### levels RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos mensajes del mismo miembro llegan dentro del mismo cooldown.

Entonces Solo el evento elegible otorga XP; no se duplica la recompensa al cruzar nivel.

### levels RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reprocesar evento no entrega XP ni premio dos veces. Rol no asignable deja premio pendiente; no revertir progreso ganado por fallo de notificación.

### levels PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Ranking respeta visibilidad; historial y temporada son distintos. No exponer contenido de mensajes para justificar el XP.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Registrar actividad elegible, acumular XP, calcular nivel, ranking y recompensas. |
| Configuración | Cooldowns, fuentes de XP, canales/roles excluidos, curva y recompensas; cambios de curva requieren política de migración. |
| Datos e invariantes | Progreso por guild/usuario y actividad deduplicada; recompensa solicitada a roles por fuente identificada. |
| UX/UI | Tarjeta legible, posición y periodo; explicar cómo progresar sin prometer premios inexistentes. |
| Fallo/concurrencia | Eventos repetidos, spam, acumulación en ráfaga y carrera de subida: cálculo/actualización atómicos. |
| Criterio específico | No entrega dos recompensas por el mismo cruce; ranking y perfil usan el mismo progreso y respetan exclusiones. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.exito`, `icon.levels`, `icon.star`, `icon.info`, `icon.previous`, `icon.skip`, `icon.search`, `icon.success`, `motion.cargando`, `motion.exito`, `fondos.nivel`, `plantillas.nivel`, `scene.celebracion`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

El catálogo de eventos complementa los registros del sistema; no sustituye los recursos propios de este módulo ni exige decorar todos sus mensajes. Conservar sus claves actuales y usar auxiliares solo donde exista un consumidor real.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `levels`. Familias propuestas de este recorrido: `B36`, `B09`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 11 apariciones y 3 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.


## Conciliación de investigación 0.14

El alcance de levels se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

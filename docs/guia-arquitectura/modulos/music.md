# Guía de migración del módulo music

Tarea `MOD-MUSIC`. Estado `audit_before_migration`. Destino propuesto `src/modules/music`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `dashboard/music-realtime.js`
- `dashboard/music-visibility.js`
- `dashboard/nodes-routes.js`
- `handlers/discordmusiccatalog.js`
- `handlers/music/action-queue.js`
- `handlers/music/apiRoutes.js`
- `handlers/music/autoplay.js`
- `handlers/music/command-settings.js`
- `handlers/music/config.js`
- `handlers/music/controls.js`
- `handlers/music/database.js`
- `handlers/music/embeds.js`
- `handlers/music/filters.js`
- `handlers/music/index.js`
- `handlers/music/liked-playlist.js`
- `handlers/music/likes.js`
- `handlers/music/liveupdate.js`
- `handlers/music/lyrics-http.js`
- `handlers/music/lyrics-pagination.js`
- `handlers/music/lyrics.js`
- `handlers/music/lyricsLive.js`
- `handlers/music/manifest.js`
- `handlers/music/node-benchmark.js`
- `handlers/music/node-player.js`
- `handlers/music/node-search.js`
- `handlers/music/node-session.js`
- `handlers/music/nodes-command.js`
- `handlers/music/nodes-config.js`
- `handlers/music/nodes-runtime.js`
- `handlers/music/nodes.js`
- `handlers/music/permissions.js`
- `handlers/music/platforms.js`
- `handlers/music/playback-clock.js`
- `handlers/music/playback-health.js`
- `handlers/music/player-events.js`
- `handlers/music/playlist-name.js`
- `handlers/music/playlist-repository.js`
- `handlers/music/playui.js`
- `handlers/music/prefix-compat.js`
- `handlers/music/request-timing.js`
- `handlers/music/resolve-timeout.js`
- `handlers/music/responses.js`
- `handlers/music/saved-queues.js`
- `handlers/music/searchui.js`
- `handlers/music/sessions.js`
- `handlers/music/setup.js`
- `handlers/music/state.js`
- `handlers/music/ui.js`
- `handlers/music/utils.js`
- `handlers/music/web-lyrics.js`
- `handlers/musichandler.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro en voz; DJ para acciones restringidas; gestor para configuración.

1. Buscar con proveedor habilitado.
2. elegir resultado.
3. validar voz y permisos.
4. encolar.
5. confirmar posición.
6. fin de pista consume cola manual.
7. solo después evaluar autoplay.

## Fuente de verdad y límites

Sesión por guild, cola e historial; preferencia de autoplay sin anunciar personalización aún

Miembro: cola permitida de su sesión; gestor: configuración y errores redactados; gustos privados nunca se muestran a otros.

Stop invalida búsquedas tardías y autoplay; fin natural, error y skip producen una sola transición. No crear otra MusicSession ni otro reproductor.

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
| embedAccent | color hex | #FFD36F para el nuevo tema | Conservar colores semánticos de error/éxito |
| assetTheme | clave de registro | obey-v1 | Fallback por clave; nunca ocultar un control sin emoji nuevo |
| messageOverrides | mapa de claves | vacío | Solo mensajes permitidos por catálogo; variables verificadas |

## Casos de aceptación escritos

### music FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo music.

Cuando Buscar con proveedor habilitado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; solo después evaluar autoplay.

### music RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Terminan simultáneamente un evento de fin y una pulsación de skip.

Entonces Una sola transición cambia la pista; la cola conserva orden y no salta dos entradas.

### music RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Stop invalida búsquedas tardías y autoplay; fin natural, error y skip producen una sola transición. No crear otra MusicSession ni otro reproductor.

### music PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Miembro: cola permitida de su sesión; gestor: configuración y errores redactados; gustos privados nunca se muestran a otros.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Rendimiento y latencia

Leer [MUSICA_RENDIMIENTO_Y_LATENCIA.md](../MUSICA_RENDIMIENTO_Y_LATENCIA.md) antes de modificar buffers, timers o transporte. Distingue investigación de Red/JMusicBot/Muse/NodeLink, límites de Discord, hallazgos estáticos de OBEY, perfiles condicionales y medición A/B. Sus objetivos y tareas siguen pendientes; no acreditan ausencia de cortes o latencia.

## Contrato de producto ampliado · plan 0.4

Objetivo de implementación; no verificación runtime. Estas precisiones amplían la ficha y prevalecen sobre recomendaciones de destino anteriores incompatibles con el plan vigente.

| Dimensión | Definición |
| --- | --- |
| Operaciones | Buscar, resolver, encolar, controlar, guardar favoritos, consultar letras y recuperar sesiones con lavalink-client. |
| Configuración | Destinos, DJ, permanencia, fuentes, límites y autoplay; conservar alcance legacy y doce IDs. |
| Datos e invariantes | Una cola operativa y propietario por guild; generación/playbackId descartan respuestas viejas. |
| UX/UI | Soundy conserva distribución; búsqueda/cola/letras/gustos personales tienen sesión y audiencia propias. |
| Fallo/concurrencia | Fin y skip simultáneos, búsqueda tardía, 429 o pérdida del nodo: transición única y recuperación confirmada. |
| Criterio específico | Fin avanza sin acción manual, stop invalida autoplay, repeat/shuffle conservan semántica y restart no duplica pista; ver contrato musical completo. |

### Conexión con el sistema común

Las entradas presentes en esta ficha deben vincularse al mismo servicio, política y catálogo de errores. Identificar cuáles están efectivamente cargadas; las rutas candidatas anteriores no son un grafo exhaustivo. Aplicar [contratos](../sistema/02_CONTRATOS.md), [configuración](../sistema/04_CONFIGURACION.md) e [idiomas](../sistema/05_I18N.md).

El mensaje público usa el idioma de la guild; las respuestas personales siguen la política privada. No traducir contenido del usuario automáticamente. Versionar configuración y revalidar audiencia/recurso en cada interacción.

### Recursos vinculados

Claves declaradas existentes: `emoji.musica`, `icon.play`, `icon.pause`, `icon.previous`, `icon.skip`, `icon.shuffle`, `icon.stop`, `icon.loop`, `icon.queue`, `icon.lyrics`, `icon.volume-down`, `icon.volume-up`, `icon.like`, `icon.autoplay`, `icon.info`, `motion.cargando`, `icon.success`, `icon.error`, `motion.favorito`, `motion.reproduciendo`, `icon.music`, `icon.album`, `icon.link`, `icon.profile`, `icon.send`, `icon.close`, `icon.mute`, `icon.clock`, `icon.repeat-one`, `icon.page-previous`, `icon.page-next`, `icon.delete`.

La lista no acredita aprobación, archivo disponible o publicación. Conciliar cada vista/estado con clave, export, binding real y fallback conforme a [recursos](../sistema/06_RECURSOS.md). Emoji ausente nunca elimina la etiqueta de una acción necesaria.

### Cierre de esta ficha

Demostrar el criterio específico anterior con estado feliz y fallo relevante, dos guilds aisladas y ES/EN del alcance. Anotar commit/entorno y separar inspección, simulación y servicio real. Preservar lectura de datos y controles legacy hasta completar consumidores. Apagar el módulo tiene semántica documentada; no borra datos silenciosamente.

## Materiales vigentes integrados · edición 0.6

Conservar los doce controles y recursos propios de Soundy. Los símbolos de voz/registros no reemplazan controles musicales o marcas de plataformas. Escenas/GIF solo si reflejan estado real y sin retrasar acciones.

La selección vigente está en `assets/obey/catalog-eventos/` desde la raíz del proyecto; consultar [capítulo 15](../sistema/15_CATALOGO_EVENTOS.md). integration-map.json propone claves semánticas, variantes y consumidores; no es un registro runtime instalado. Los labels de revisión se traducen mediante el resolvedor único, y el fallback conserva texto sin markup roto.

Los tres PNG de personaje y seis GIF de expansion-20261020 se mantienen. Los 24 iconos previos de registros de esa expansión se retiraron. Al integrar: permiso/audiencia, export elegido, alias canónico, ID real de Discord si aplica y comprobación en móvil/escritorio. No hay publicación o binding acreditados por esta edición.


## Materiales y consumidores · edición 0.7

Ficha visual: `assets/obey/ui-state-catalog/capability-materials.json`, entrada `music`. Familias propuestas de este recorrido: `A02`, `A03`, `A04`, `A05`, `A06`, `B01`, `B02`, `B03`, `B04`, `B05`, `B06`, `B07`, `B08`, `B09`, `B10`, `B11`, `B12`, `B30`, `B23`, `B24`, `B25`, `B27`, `B28`, `B29`, `B51`, `B52`, `B53`, `B54`, `B57`, `B59`, `B60`, `B61`, `B62`, `B65`, `A11`, `A12`. A01–A12 tienen aprobación visual; B/C requieren revisión. La base previa conserva bindings y datos.

La auditoría por ruta registra 547 apariciones y 160 referencias literales de assets para esta asignación; un cero no demuestra ausencia de función porque existen constructores compartidos y claves calculadas. Consultar el mapa completo y el contrato del módulo.

Aplicar [estados y animaciones](../sistema/16_ESTADOS_Y_ANIMACIONES.md), [mapa de reemplazos](../sistema/17_MAPA_REEMPLAZOS.md) y [recetas](../sistema/19_RECETAS_POR_RECORRIDO.md). El servicio confirma el efecto; el presentador elige PNG/GIF y texto. No modificar contenido del usuario ni símbolos internos de juegos. Esta sección no marca tareas runtime como terminadas.

## Aplicación al servidor de soporte · edición 0.10

El [capítulo 22](../sistema/22_COMUNIDAD_Y_GITHUB.md) y [mapa de canales](../comunidad/MAPA_DE_CANALES.md) proponen destinos del servidor mostrado por el usuario. Conservar este módulo como propietario de sus datos y publicación; validar IDs, permisos y audiencia antes de habilitar. El perfil de soporte no se hereda en guilds cliente. No acreditar funciones por un nombre de canal. GitHub usa inicialmente webhook nativo para avisos técnicos; receptor propio de feeds queda condicional.

## Capacidades Discord aplicables · edición 0.12

[Capítulo 24](../sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) y [matriz](../discord-nativo/capacidades.json), entrada `music`. Capacidades dirigidas a esta ficha: D02, D09, D11. D01/D08/D10/D18 se aplican cuando el módulo esté ofrecido, según entrada, recursos, audiencia e idiomas. Conservar servicio y datos; no activar un dominio diferido por esta referencia. La compatibilidad se revisa contra lockfile y el recorrido real; esta edición no añade implementación.


## Conciliación de investigación 0.14

El alcance de music se relaciona con referencias, recorrido, material y aceptación en [plan de ejecución](../investigacion-20261022/08_PLAN_DE_EJECUCION.md) y modulos.json. No se marca implementado ni se cambia su contrato operativo por añadir esta referencia. Las ampliaciones solicitadas se ejecutan por etapas, conservando datos y restricciones vigentes.

## Ejecución vigente · 23/10/2026 · P1 parcial

Implementación `6d5b666`, desplegada: conexión de voz válida reutilizada al reconstruir player/cambiar nodo, presupuesto de cinco intentos, cancelación por generación y descarte de eventos de player retirado. El panel no gobierna la recuperación del audio. [Informe y límites](../CONTINUIDAD_Y_RECUPERACION.md), [evidencia local](../../platform/evidence/music-continuity-local-20261023.json), [runtime](../../platform/evidence/music-continuity-deployment-20261023.json). Diez casos simulados y 25 originales pasan; en dos minutos de actividad existente se observó restauración en Serenetia sin salidas de voz. No acredita escucha ni aceptación completa de esta ficha.

Shoukaku 4.3.0 sigue activo. La siguiente unidad inventaría `client.shoukaku`, Player/Rest, enrutado de eventos/voz, apagado, cola/snapshot/cancelación y consumidores Discord/web; después migra a lavalink-client conservando una sola autoridad de cola. Fijar versión publicada compatible con CommonJS/Node y capacidades reales del nodo. Comprobar la matriz del capítulo 07 antes de retirar el puente. Mantener Soundy, doce controles, favoritos, reloj de letras, cuatro fuentes y privados apagados. Casillas MOD-MUSIC/ARCH siguen pendientes hasta su aceptación.

### Auditoría de búsquedas y selector · 23/10/2026

Commits `3290978` y `4311148`: cuatro fuentes combinadas, respaldo acotado, ampliación de identidad Spotify, agrupación de canciones y selector paginado compartido entre prefix/slash. Web consume el mismo catálogo. Resolución antes de voz y selección delegada al playCollection existente con generación/permisos frescos. [Hallazgos, evidencia y límites](../RELEVANCIA_Y_RECOMENDACIONES.md). Veinticinco casos temporales y 25 originales pasan; no se cierra MOD-MUSIC ni la migración del cliente.

Corrección de disponibilidad `ce546e8`, desplegada: errores de consulta no modifican el cooldown del audio. [Evidencia final](../../platform/evidence/music-search-audit-deployment-20261023.json); 51 hashes y caché estable por HTTP, con cantidades variables por proveedor.

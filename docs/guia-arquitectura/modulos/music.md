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

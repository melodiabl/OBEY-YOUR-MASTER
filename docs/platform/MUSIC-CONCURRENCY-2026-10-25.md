# Música: controles, autoplay y restauración · 25/10/2026

La corrección está desplegada en `6479683`, imagen `c04c4bee8046`. Autoplay busca fuera de la cola que aplica controles; las solicitudes manuales tienen prioridad antes de confirmar una recomendación. Los eventos antiguos y una restauración que ya estaba esperando no pueden avanzar o sustituir una reproducción nueva que funciona. [Evidencia](evidence/music-concurrency-20261025.json), [auditoría de origen](MUSIC-AUDIT-2026-10-24.md).

## Cambios y motivo

- `handlers/music/autoplay-session.js` se encarga del trabajo pendiente de autoplay, su cancelación y la reserva de intención manual. Texto, colecciones y encolado usan esa misma reserva y la liberan al terminar o fallar. Una consulta inválida se rechaza antes de cancelar autoplay.
- El resultado de la búsqueda vuelve a entrar en la cola de acciones antes de cambiar la sesión. Debe conservar pista, instancia de reproducción, player y generación de stop; una petición manual pendiente gana. La pausa aplicada mientras busca se conserva al cargar la recomendación.
- `action-queue.enqueue` siempre espera su turno. Es necesario porque el trabajo asíncrono puede heredar el contexto de la acción que lo inició: reutilizar la vía reentrante permitiría saltarse un control en curso.
- `_playNext` y `_recoverFailedTrack` comprueban de nuevo su pista/instancia/player al ejecutar la acción. Un fin de pista antiguo que esperaba durante una resolución deja de avanzar la siguiente canción.
- La restauración revalida el player dentro de la sección de mutación. Si un control o una reproducción manual aceptados entretanto dejaron una sesión conectada en playing/paused/loading, conserva ese estado y descarta el snapshot preparado anteriormente.
- El cierre suspende las búsquedas y espera sus resultados descartados antes de guardar las sesiones. Fin/skip pueden publicar loading mientras se busca; el resultado posterior se confirma con el estado del nodo. No se inventa una confirmación de audio al terminar la petición de control.

La primera explicación de una migración automática por simple preferencia de nodo quedó descartada por las pruebas: `getNode(guildId)` ya conserva el player activo. El fallo demostrado estaba en no repetir la comprobación después de esperar la cola. Se preservaron los casos de playing, paused y loading como regresiones, junto a recuperación de player ausente o marcado para reconectar.

## Nodos efectivos

Serenetia queda como principal y MilloHost como respaldo. Ambos aceptaron WebSocket y búsquedas Spotify/YouTube en la nueva muestra. GDjkhp está desactivado por HTTP/WebSocket 401. Trinium 02 se apartó temporalmente tras volver a aparecer `remote_player_missing` durante la observación del primer incremento; que responda a búsqueda y stats no prueba continuidad de sus sesiones. La causa concreta de esa pérdida y su adaptación siguen pendientes. Se conservaron sus entradas para investigación posterior.

El nodo privado sigue apagado/excluido y no se usa WARP. La política de fuentes y contenido permanece en el mismo código: no se reactivaron fuentes ni comandos retirados. Configuración de dueño, credenciales, recursos y límites del contenedor se conservaron; el único cambio de entorno es `LAVALINK_DEFAULT_NODE=serenetia`.

## Verificación

Pasan **48 casos en la imagen final**, sin red: los 25 originales y 23 temporales de concurrencia/recuperación. Se reprodujeron antes de corregir el bloqueo de pausa, prioridad manual, avance por evento viejo, restauración sobre un control/reproducción nuevos y cancelación por consulta inválida. También se comprobaron stop, autoplay desactivado, duplicados, ausencia de candidatos, cola manual existente y player sustituido.

Build Next/TypeScript y comprobaciones de tipos/fronteras aprobados. Gate del inventario: 675 comandos, 779 aliases y 95 rutas. Los 991 hashes de fuentes/contratos y salida compilada coinciden con el contenedor; siete comprobaciones HTTP locales/públicas y doce assets públicos pasan. El primer sondeo público con el User-Agent predeterminado de urllib fue rechazado con 403; la repetición con el mismo identificador de verificación utilizado en el despliegue anterior pasó.

En la ventana de 14 muestras entre 22:32:11 y 22:34:23 UTC del 24/10 —00:32–00:34 del 25/10 en Berlín— todas fueron saludables y hubo cero reinicios automáticos. Gateway listo, veinte comandos slash y los dos nodos públicos conectados. Los registros hasta 22:35 UTC mostraron una sesión existente restaurada, cero fallos de recuperación y seis muestras positivas de ping de voz de Serenetia de 130–131 ms. No hubo operaciones musicales registradas por encima de un segundo en esa ventana. Son muestras acotadas, no percentiles de uso general.

No se abrió una sesión de voz de prueba ni se pulsaron botones de usuarios. El arranque recuperó sesiones existentes mediante el flujo normal. La posición/conexión registradas no sustituyen una escucha real ni aceptan todas las letras, controles y proveedores.

## Entrega, conservación y siguiente unidad

Tres commits de código: `db635cd` (autoplay/acciones/eventos), `526853c` (restauración encolada) y `6479683` (validación anterior a cancelación). Hubo un despliegue intermedio `455c0567` y el definitivo `c04c4bee`; la observación del primero motivó la segunda corrección y el cambio de principal. El candidato `327f685f` nunca se desplegó.

El respaldo Mongo previo al definitivo tiene 59.270.687 bytes y CRC gzip comprobado. Se conservan imágenes, entorno, registro anterior de nodos y recetas privadas de reversión en `.runtime/music-stability-20261025/`; la reversión inmediata es a `455c0567`, y la entrega anterior `41c57b9` conserva su propia receta en `.runtime/music-concurrency-20261024/`. No se restauró ni migró la base de datos. Solo se recreó el bot; se actualizaron latest y las dos recetas privadas de recuperación.

La construcción usó un checkout aislado de los commits musicales. Los cambios previos pendientes de Config/setups se conservaron y quedaron fuera de estas imágenes. Se retiraron el checkout, el verificador temporal y el candidato sin uso; quedan los tres archivos originales de tests. Sin push ni CI remoto.

La migración a lavalink-client, la retirada de accesos directos al SDK, las capacidades/letras nativas de NodeLink, los errores de almacenamiento y la aceptación musical completa continúan abiertas. La incidencia no cierra P0/P1 ni cambia el orden global. Después de esta contención, la unidad P0 de resumen Config y categoría MUSIC conserva su lugar, con los cambios locales pendientes de revisar.

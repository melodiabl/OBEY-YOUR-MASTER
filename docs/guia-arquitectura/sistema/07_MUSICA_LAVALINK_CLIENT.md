# Música con lavalink-client

## Decisión y frontera

Destino confirmado por el usuario: `lavalink-client`. Shoukaku es el cliente actual a retirar por etapas. No añadir Kazagumo como segundo gestor. El paquete publicado concreto se fija antes de programar; `main` puede contener APIs aún no liberadas. Guardar versión de Node, discord.js, cliente, nodo, plugins y fuentes probadas.

Crear una fachada OBEY para buscar, conectar, encolar, pausar/reanudar, skip, previous, seek, volumen, loop, shuffle, filtros, stop, snapshot y recuperación. Las entradas no reciben Player/Queue de la biblioteca. Favoritos, permisos, gustos, historial y mensajes pertenecen a OBEY.

## Una sola autoridad de cola

Decisión objetivo: la cola administrada por lavalink-client será la única cola operativa por guild después del corte. El store se integra con la persistencia de OBEY mediante una única proyección versionada; el estado legacy queda como lectura compatible hasta migrar. Mongo guarda snapshots durables de sesión; memoria mantiene el runtime propietario. Redis no añade una segunda cola musical por usar BullMQ.

Delegar a la biblioteca el avance de su cola, loop y skip según las APIs verificadas. OBEY prepara candidatos de autoplay, reglas y persistencia; no llama otro `_playNext` en paralelo. Inventariar listeners legacy antes de activar los nuevos. Si una API exige avance manual, documentar la variante, desactivar avance automático y comprobar toda la matriz antes del corte. No combinar ambas autoridades.

## Estado objetivo

Snapshot lógico: guild, sessionGeneration, revision, playbackId, propietario, nodo y sessionId del nodo, canales, mensaje, pista actual, cola próxima, historial, loop, autoplay, volumen, filtros y reloj. `sessionId` de Lavalink, sesión de voz Discord y `playbackId` de OBEY son identificadores diferentes.

Estados de producto: idle, connecting, loading, playing, paused, recovering y stopping. Estado persistido y confirmación del nodo se concilian. El panel no anuncia playing antes de confirmación válida; un error de render no detiene audio.

## Continuidad, repetir y mezclar

| Disparador | Comportamiento objetivo |
| --- | --- |
| Fin natural + repeat-one | Repetir pista una vez por transición; conservar identidad de cada reproducción |
| Fin natural + cola manual | Avanzar a la próxima; repeat-queue devuelve finalizada al final según semántica verificada |
| Fin natural + cola vacía | Pedir candidato autoplay si está habilitado; si no, estado idle según política de permanencia |
| Skip + repeat-one | Saltar la pista actual; no volver a atraparla en loop-one |
| Stop | Invalidar búsquedas/candidatos pendientes, limpiar lo definido por acción y no relanzar autoplay |
| Pista no reproducible | Registrar fallo, intento acotado de resolución/alternativa y continuar sin bucle infinito |
| Shuffle | Reordenar solo próximas pistas; no reiniciar la actual ni corromper historial |
| Previous | Reproducir historial elegible con política explícita; no quitar dos canciones de la cola |
| Seek/pausa/filtro de velocidad | Reanclar reloj desde estado confirmado y descartar updates viejos |

Operación serial por sesión cuando cambie reproducción. Los eventos llevan playbackId/generación y se descartan si pertenecen a un player retirado. Fin natural y pulsación skip simultáneos consumen como máximo una transición efectiva para ese playbackId. La política repeat-queue no debe hacer crecer indefinidamente snapshots con duplicados.

## Autoplay basado en gustos

Entrada manual siempre tiene prioridad. Autoplay solo rellena cuando corresponde y la sesión sigue vigente. Separar candidatos preparados de la cola confirmada: un resultado tardío se descarta si llegó música manual, cambió la generación o hubo stop.

Propuesta inicial de producto:

1. Recoger contexto de la sesión: pistas recientes, artistas, fuentes disponibles y feedback autorizado.
2. Pedir candidatos a proveedores habilitados; resolver metadata y reproducibilidad antes de comprometerlos.
3. Excluir pista actual, bloqueos, repetidas recientes y candidatos fallidos. Identificar por proveedor/ID y equivalencias verificables; no solo título exacto.
4. Ordenar por afinidad de sesión, gustos compartidos voluntariamente y diversidad. No inventar una API de recomendaciones o una licencia de uso inexistente.
5. Preparar un lote pequeño; agregar solo el candidato elegido cuando la cola siga vacía. Cancelar candidatos obsoletos.
6. Al agotar candidatos o fallar proveedores: informar estado y permitir búsqueda manual; no repetir consultas sin límite.

Modos de diseño: sesión por defecto; servidor con preferencias administradas; personal solo con usuario identificado y consentimiento para usar sus gustos en esa sesión. Un Like guarda favorito; no equivale por sí mismo a aceptar perfilado público. Dislike/ocultar/bloquear se distinguen: gusto personal, exclusión de sesión y bloqueo de servidor son acciones diferentes con permisos diferentes.

Mostrar por qué se eligió una pista mediante una razón limitada y no sensible: relacionada con la sesión o artista solicitado. Nunca exponer a otros los favoritos de un usuario. Pesos y ventanas de repetición se ajustan con métricas y revisión; esta guía no afirma que haya un recomendador entrenado ya operativo.

## Búsqueda y paridad

Buscar por texto/enlace → resultados con título, artista, duración y plataforma → seleccionar → validar voz/política → encolar → recibo con posición. Sesión de búsqueda pertenece al actor; paginar no repite el enqueue. Playlist muestra cargadas, omitidas y fallidas; no confirma todo si una parte falló.

Slash, prefijo y los controles usan las mismas operaciones, permisos DJ, límites y valores. Conservar tabla exacta:

| ID existente | Operación/panel |
| --- | --- |
| mp_shuffle | Mezclar próximas pistas |
| mp_prev | Anterior según historial |
| mp_toggle | Pausa/reanudación según estado confirmado |
| mp_skip | Siguiente |
| mp_loop | Cambiar modo con estado explícito |
| mp_lyrics | Letras privadas/paginadas según contrato |
| mp_voldown | Reducir volumen dentro del rango vigente |
| mp_stop | Detener con alcance definido |
| mp_volup | Aumentar volumen dentro del rango vigente |
| mp_queue | Cola autorizada y paginada |
| mp_like | Favorito personal idempotente |
| mp_autoplay | Activar/desactivar según política de sesión |

No fijar un nuevo rango de volumen sin conciliar comandos existentes. No usar likes públicos o DM automáticos como efecto sorpresa del panel.

## Publicación y rendimiento

Conservar Soundy. Un publicador por mensaje, una edición en vuelo y el último estado pendiente. Prioridad a resultado de control sobre progreso periódico; agrupar updates obsoletos. ACK temprano dentro del plazo de Discord; abrir modal usa la respuesta inicial correspondiente, no defer automático universal.

Reloj: posición del nodo + instante monotónico local + pausa + velocidad confirmadas. No usar timestamp de publicación o edad del GIF como reloj musical. Tick de cálculo interno y edición Discord son frecuencias independientes. El cliente documenta extrapolación local; eso no habilita editar Discord cada 50 ms.

Ante 429, respetar retry_after y coordinar backoff con publicaciones del mismo ámbito; no agregar bucles paralelos. La edición por interacción debe medirse bajo los mismos escenarios antes de afirmar mejora. Panel eliminado permite reposición controlada; timeout o 429 no justifican crear otro mensaje.

## Nodos y recuperación

Comprobar salud, fuentes y plugins antes de elegir nodo. Preferir región/capacidad compatibles; un ping bajo no prueba audio estable. Mantener circuit breaker y reintentos acotados. No prometer continuidad permanente mediante nodos públicos ni audio sin pérdida desde fuentes con compresión.

Recuperación distingue: reconexión WebSocket; resuming en el mismo nodo aún vivo; reinicio del bot con checkpoint; pérdida del nodo y reconstrucción en otro. Resuming no implica que un segundo nodo tenga la sesión. Restaurar cola, posición segura, filtros y pausa; confirmar antes de emitir efectos. Derivar shard real de la guild para enviar paquetes de voz; no hardcodear shard 0.

## Migración ejecutable por etapas

Inventariar accesos y eventos → fijar versión publicada → implementar adaptador con raw voice/init y ciclo de vida → mapear pista/cola/snapshot → probar una guild de ensayo → cambiar propietario de esa guild → comprobar funciones y recuperación → ampliar → retirar referencias directas y dependencia Shoukaku cuando no tenga consumidores.

Volver atrás exige parar el player destino, revocar su generación y reconstruir desde snapshot compatible; no activar dos clientes simultáneos. Evitar pruebas shadow que conecten dos reproductores a la misma guild.

Aceptación específica: fin de pista avanza sin pulsación manual; autoplay arranca cuando corresponde; skip/fin no saltan dos pistas; stop bloquea respuestas tardías; restart no duplica pista/cola; panel refleja pausa/seek; favoritos siguen privados; doce controles válidos; cortes y latencia se miden por separado.

Fuentes: [cliente y configuración](https://tomato6966.github.io/lavalink-client/home/configuration/), [resuming](https://tomato6966.github.io/lavalink-client/extra/resuming/), [REST](https://lavalink.dev/api/rest), [WebSocket](https://lavalink.dev/api/websocket). Ejemplos oficiales son referencia de API; no copiar sus defaults sin conciliar con OBEY.

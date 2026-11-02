# 02 · Música — migración PLANIFICADA de Shoukaku a `lavalink-client`

## Decisión

**Motor objetivo: paquete NPM `lavalink-client` de Tomato6966, para Lavalink v4.** No confundirlo con la biblioteca Java `lavalink-client` del proyecto oficial. No instalar o activar dos gestores a la vez. Versión a fijar en lockfile después de auditoría de compatibilidad y pruebas (NPM se consultó el 01/11/2026).

Fuentes de API:
- https://www.npmjs.com/package/lavalink-client
- https://github.com/Tomato6966/lavalink-client
- https://tomato6966.github.io/lavalink-client/extra/manager-events/
- https://tomato6966.github.io/lavalink-client/extra/node-events/

## Modelo de dominio único

`GuildPlayer`: `{guildId, textChannelId, voiceChannelId, nodeId, sessionId, revision, state, volume, repeatMode, autoplayMode, activeMessageId}`. `Queue`: `{current, upcoming, previous, version}`. Persistencia y caché son adaptadores, **no dos colas divergentes**. Estado persistido ≠ estado de la conexión; revalidar frente al nodo.

## Ciclo de eventos

- `trackStart`: registrar posición/estado, actualizar una sola vista compartida.
- `trackEnd`: avanzar una vez (guardar idempotencia por pista/sesión), evitar doble salto por skip+end.
- `trackError` / `trackStuck`: informar fallo y decidir continuar sin bucle infinito.
- `queueEnd`: si autoplay está activo, proponer o resolver siguiente pista *según configuración*; si no, cerrar o mantener conexión con temporizador seguro.
- `playerDisconnect`, `playerDestroy`: conciliar estado de voz, limpiar botones antiguos.
- `node disconnect/resumed`: distinguir restablecimiento real de nuevo reproductor; no prometer recuperación si no existen datos guardados.

## Controles y vista

Conservar IDs visibles del flujo Soundy donde sean consumidores reales; botones de shuffle/prev/play/skip/loop/lyrics/volume/stop/queue/favorito/autoplay pasan al servicio único. A03 animado indica **reproducción activa**, no carga. A04/A05/A06 representan transición o confirmación de configuración; A11 significa confirmación. B no sustituye A sin revisión.

## Pruebas obligatorias (gate de música)

1. Reproducir y pausar dos servidores en paralelo; aislamiento.
2. Saltar al final de cola; no doble `trackEnd`.
3. Autoplay con recomendación disponible, sin candidato, timeout y fuente no disponible.
4. Mezcla, repetición off/pista/cola y saltos simultáneos.
5. Mensajes viejos: rechazo de controles por revisión incorrecta.
6. Nodo cae durante playback; recuperación válida o estado parcial explícito.
7. Reinicio de proceso, cola persistida y sesión reanudada con fuente de verdad confirmada.
8. Volumen y reproducción sin WebSocket duplicado, leak o mensajes redundantes.
9. Latencias observables y criterios reales definidos antes de aceptación.
10. Web y bot reportan mismo estado, sin suponer que frontend puede controlar otra guild.

## Fases

A. Inventario real de Shoukaku y estados/callbacks.  
B. Contratos neutrales + pruebas actuales.  
C. Adaptador `lavalink-client` en pruebas, versión fijada.  
D. Migración de cola/autoplay/sesiones, eventos, web.  
E. Piloto por servidor, reconciliación de métricas, reemplazo de motor y retirada de Shoukaku.  

Ninguna de estas fases fue ejecutada en este paquete.

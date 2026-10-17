# Selección medida de nodos públicos · 17/10/2026

Actualización posterior: los cortes audibles persistieron en Serenetia pese a su menor RTT de control. El principal vigente pasó a GDjkhp; Serenetia/MilloHost quedan de respaldo. Misma imagen de la corrección de infobot. [Investigación y comprobaciones de reproducción](AUDIO-CUTS.md). Las cifras y la selección siguientes documentan la evaluación inicial.

Petición: usar el paquete actualizado y conseguir nodos de buen rendimiento y baja latencia. Se aplica su criterio de conservar el motor existente, medir proveedores reales y distinguir evidencia de aceptación. El pool, sesiones, permisos, recuperación, favoritos y letras conservan su implementación actual; la selección utiliza el registro privado existente, sin otro reproductor ni descubrimiento automático de endpoints.

## Resultado de las mediciones

Se comprobaron 13 candidatos TLS publicados. Cinco variantes respondieron a `/v4/info`; Trinium antiguo/nuevo son variantes del mismo proveedor y se profundizó solo la nueva. La evaluación funcional midió handshake autorizado, cinco ping/pong WebSocket, estadísticas y tres búsquedas musicales con encodings válidos. No es una prueba de carga ni una medición de voz hacia Discord. Las sesiones de diagnóstico usan un identificador sintético distinto del bot, sin token Discord, reproducción ni datos de usuarios.

| Orden | Proveedor | RTT mediana inicial | RTT mediana de confirmación | Búsquedas correctas | Tiempo mediano de búsqueda en confirmación |
| --- | --- | ---: | ---: | ---: | ---: |
| Principal | Serenetia | 110 ms | 113,6 ms | 3/3 | 813 ms |
| Respaldo 1 | GDjkhp | 193 ms | 193,3 ms | 3/3 | 598 ms |
| Respaldo 2 | MilloHost | 204 ms | 228,4 ms | 3/3 | 1136 ms |

Serenetia fue el proveedor funcional de menor RTT entre los comprobados. No se encontró un público funcional de menos de 30 ms en esta muestra. Las cifras no prueban capacidad máxima, disponibilidad futura ni latencia audible. MilloHost mostró más variación en la segunda ronda; conserva su puesto como tercer proveedor. La CPU publicada es informativa: algunos nodos devuelven cero o no incluyen ese valor, por lo que no se interpreta como capacidad garantizada.

Nazha devolvió 502 y sus variantes 530/DNS fallido; queda desactivado. Trinium nuevo tuvo RTT de 278 ms, variación de 174,9 ms y dos búsquedas agotadas de tres; permanece desactivado. Las direcciones Europe/USA de HeavenCloud publicadas en un repositorio no resolvieron; su web oficial ofrece actualmente un público sin TLS, incompatible con la política de públicos del proyecto. Los candidatos descartados no se incorporan a la selección activa. GDjkhp se identifica como NodeLink 3.10 dev: su compatibilidad comprobada es el protocolo v4, WebSocket y búsquedas; no se presenta como Lavalink Java 4 ni como voz audible validada.

## Comprobación de respaldos

La prueba utiliza `createNodePool` y `searchNodes` del bot con búsquedas reales: principal Serenetia; fallo local simulado de Serenetia → GDjkhp; fallo local simulado de ambos primeros → MilloHost. Cada escenario devolvió diez pistas. Los fallos se simulan en los adaptadores del verificador; no se derriban proveedores ni se modifica la reproducción de usuarios. La conservación de sesión/cola/posición y los reintentos siguen cubiertos por las pruebas existentes del motor, con proveedores controlados. No se afirma migración de voz real en esta entrega.

## Operación

El registro de operador sigue en `.runtime/nodes/nodes.json`, modo 0640 y grupo 1000, montado como solo lectura. Principal global `LAVALINK_DEFAULT_NODE=serenetia`; privados excluidos con `LAVALINK_PRIVATE_ENABLED=false`. Las cinco preferencias guardadas estaban en auto: no requieren migración ni escritura en Mongo. El cambio se aplica cuando la base confirma que ya no hay pista activa, para preservar la canción que estaba sonando.

Nueva CLI explícita: `node scripts/benchmark-music-nodes.js`. Dentro del contenedor: `podman exec obey_bot node scripts/benchmark-music-nodes.js /app/runtime-nodes/nodes.json`. Solo mide públicos habilitados del registro revisado; no inicia el bot al importar, no descubre servidores externos, no imprime direcciones/contraseñas/sessionId y no modifica la selección. Devuelve RTT/jitter, búsquedas válidas y tiempos; ordena proveedores que pasan todas las comprobaciones por RTT mediana. Un error no se presenta como latencia cero. Se realizan lotes pequeños y esperas acotadas, sin pruebas de saturación.

Regresión observada antes de crear la herramienta; cuatro pruebas nuevas comprueban resúmenes, descarte de resultados inválidos, prioridad de proveedores funcionales y redacción de errores/credenciales. 26 pruebas focalizadas del pool/sesiones/medición y 528/528 de la suite completa pasan, sin canceladas ni omitidas. La imagen verifica 19 hashes, UID 1000, ausencia de .env/NSFW, 295 emojis seleccionados, 19 raíces slash y Fun 22; ejecuta también las 26 pruebas aisladas sin red. Código `7b3031b`, imagen `96f81a6833ae845df7d57f0895498af8a0042798450e4cadeec2aefd3c9fddec`.

## Despliegue comprobado

Aplicado después de que el repositorio de sesiones confirmó cero pistas activas, sin cortar la canción observada. Se recreó exclusivamente el bot; imágenes y Redis conservaron imagen y fecha de inicio. Bot healthy, cero reinicios, Mongo/música listos y tres conexiones públicas registradas. El nodo privado sigue creado sin iniciar, restart=no, excluido y sin listener 2333. Las 16 entradas locales previas se conservaron y quedaron fuera de la imagen.

La herramienta ejecutada dentro del contenedor activo volvió a validar los tres proveedores: Serenetia 108,9 ms, GDjkhp 162,9 ms y MilloHost 199,3 ms de RTT mediana, cinco muestras por proveedor y tres búsquedas válidas por nodo. La mediana de búsqueda fue 1012/630/1100 ms, respectivamente. Estos tiempos varían según red y proveedor; son mediciones puntuales desde el bot, sin sesión de voz de prueba. El respaldo de voz real sigue sujeto a su comprobación específica, separada de los fallos locales simulados de búsqueda.

Recuperación vigente `.runtime/bot-recovery-public-only.yml`, etiqueta `release-node-performance-20261017`. La imagen previa `release-discord-liked-20261016` se conserva para revertir código; mantener el registro público medido y el privado excluido durante esa reversión, sin restaurar Mongo ni reactivar Nazha/Trinium por una configuración histórica. [Mediciones y pruebas](evidence/node-performance.json), [ejecución](evidence/node-performance-runtime.json).

Fuentes para protocolo y estadísticas: [WebSocket Lavalink](https://lavalink.dev/api/websocket), [REST Lavalink](https://lavalink.dev/api/rest). Candidatos publicados en el [directorio TLS](https://lavalink.darrennathanael.com/SSL/Lavalink-SSL/), [TriniumHost](https://lavalink.triniumhost.com/) y [HeavenCloud](https://heavencloud.in/service/public-lavalink-servers); la selección depende de mediciones propias, no de sus afirmaciones comerciales.

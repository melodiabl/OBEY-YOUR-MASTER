# Auditoría de música y arquitectura · 24/10/2026

La música está degradada aunque el proceso responda `healthy`. Hay fallos actuales de proveedores y problemas internos reproducidos de coordinación. La arquitectura musical conserva un núcleo heredado parcialmente modernizado; la migración a lavalink-client del plan todavía no está implementada. Cambiar nombres, frontend o lenguaje no resuelve estos recorridos.

Revisión solicitada expresamente por el usuario durante P0. Es una excepción de diagnóstico al orden del plan, sin cerrar P0 ni iniciar una sustitución del motor. Código desplegado `8e7b9ea`, imagen `41c57b9`; revisión de fuentes en `91d60f2`. [Evidencia redactada](evidence/music-architecture-audit-20261024.json).

## 1. Alta · tres respaldos no operativos en la muestra

Comprobaciones desde el mismo contenedor entre 01:22 y 01:24 UTC, usando su configuración efectiva:

| Nodo público | WebSocket | HTTP | Resultado |
| --- | --- | --- | --- |
| Trinium 02, principal | ready | stats 200, búsqueda 200/10 resultados | Disponible en esta muestra; no demuestra continuidad del audio |
| Serenetia | 502 | stats/búsqueda 502, HTML | Proveedor no disponible |
| GDjkhp | 401 | stats/búsqueda 401 | Credenciales configuradas rechazadas; no se determina si cambiaron o fueron revocadas |
| MilloHost | 500 | stats/búsqueda 500, HTML | Proveedor no disponible; `/info` sí respondió 200 |

La existencia de cuatro entradas no equivale a tener cuatro alternativas utilizables. No se sustituyeron credenciales ni nodos. Una sesión WebSocket diagnóstica independiente de Trinium mantuvo cinco lecturas de su propia lista de players con HTTP 200 y socket abierto; no creó players ni entró en Discord. Esto descarta un fallo universal inmediato de sus sesiones en esa muestra, pero no explica por qué se perdió el player real.

## 2. Alta · recuperación agotada y estado persistido detenido

Los registros del proceso actual contienen doce fallos estructurados de restauración entre 00:56:21 y 01:13:17 UTC, cuatro clasificados como player/session remoto ausente. También hay tres restauraciones completadas, por lo que no todos los intentos fallaron. El último presupuesto llegó a cinco intentos y quedó agotado. A las 01:22:47 UTC, el snapshot musical seguía fechado a las 01:13:17, posición 122.799 ms, autoplay activo y cero pistas esperando.

Ese snapshot es persistencia, no una lectura de la memoria del bot ni prueba de que siga sonando. La política conserva `recovering` al agotar cinco intentos y exige reintento manual; una reconexión de nodo no reinicia por sí misma ese presupuesto. Es una decisión ya documentada, no un bucle infinito nuevo.

Fuentes: `handlers/music/recovery-policy.js`, `handlers/music/index.js:906–1051`, `handlers/music/node-session.js`. La restauración solo enfría el nodo al reconocer texto de player/session ausente; otros errores de REST se agrupan sin clasificación suficiente. Los logs actuales no permiten atribuir la pérdida original a voz Discord, reinicio del proveedor, sesión del nodo o incompatibilidad concreta. Debe conservarse el status HTTP, fase y nodo con datos redactados.

## 3. Alta · autoplay bloquea controles y la prioridad manual es incompleta

Reproducción aislada sobre el código desplegado, con proveedor y Discord simulados:

1. Retener una recomendación de autoplay impide que una pausa posterior llegue al player. Al liberar la recomendación se ejecuta la pausa. No había latencia del player simulado: la espera procede de la cola interna.
2. Durante esa búsqueda, `music.play()` puede resolver una solicitud manual y quedar esperando la cola de acciones sin marcar intención manual pendiente. Autoplay inicia una recomendación nueva y la canción solicitada queda detrás.

`_playNext` mantiene `actions.run` mientras espera recomendaciones/búsquedas externas. Cada lookup puede esperar diez o doce segundos. `playCollection` y `enqueue` tienen una señal parcial de intención pendiente, pero `play` entra por otro recorrido y no la registra antes de esperar. Registrar la intención tampoco aborta por sí mismo el lookup ya iniciado.

Fuentes: `handlers/music/index.js:203–237`, `:350–378`, `:856–876`; `handlers/music/autoplay.js`; `handlers/music/action-queue.js`. La cola evita muchas carreras; el problema es mantener trabajo externo lento dentro de su sección serializada y tratar de forma distinta entradas equivalentes. Los dos fallos se reprodujeron sin modificar código de producción ni usar la red de Discord.

## 4. Media · selección estática y capacidades incompletas

`handlers/music/nodes.js` ordena por preferencia, visibilidad y prioridad antes de penalizaciones. En el caso sintético, el preferido con 1.000 penalizaciones vence al respaldo con cero. No mide latencia REST histórica ni usa errores de controles como una señal común de circuito. Por eso «auto» no significa seleccionar continuamente el nodo más rápido. No conviene cambiar de nodo por cada variación de ping: hacen falta histéresis, presupuesto y evidencia de recuperación.

El mismo archivo acepta `/info` únicamente si `version.major === 4`. Trinium declara software NodeLink 3.8.0 y MilloHost una versión SNAPSHOT con major 0, aunque ambos respondieron a `/v4/info`. Se descarta su información; comprobar la versión del programa como si fuera la del protocolo deja incompleta la detección de capacidades. Tampoco una lista vacía de plugins de NodeLink demuestra ausencia de funciones nativas. Las letras nativas de NodeLink siguen pendientes de adaptación, como ya indicaba la investigación anterior.

La API y sus identificadores deben verificarse por contrato: [REST de Lavalink](https://lavalink.dev/api/rest), [NodeLink](https://github.com/PerformanC/NodeLink), [investigación Trinium existente](TRINIUM-2026-10-22.md). No se ha comprobado una incompatibilidad general de Shoukaku con todos estos proveedores.

## 5. Media · salud y métricas no reflejan la sesión

`dashboard/index.js:122` declara música lista cuando el resolver devuelve un nodo conectado. A las 01:27:21 UTC devolvió HTTP 200/music=true, con cero reinicios, aunque el último presupuesto registrado estaba agotado. Ese endpoint mide disponibilidad básica, no integridad de cola, player o audio. Debe distinguirse de un diagnóstico autorizado por sesión; convertir todo fallo musical en reinicio del contenedor puede empeorar la recuperación.

Tres PATCH al nodo tardaron 2.686/4.100/5.497 ms; tres ediciones del panel, 1.060/1.132/1.076 ms. Son operaciones seleccionadas por superar un segundo: no permiten calcular percentiles generales ni atribuir toda la demora al panel. Los paquetes observados dieron ping de voz de 56–72 ms en Trinium y 321–348 ms en MilloHost; son otra medida, distinta del tiempo REST y de la respuesta de botones. La muestra del contenedor fue 2,63 % CPU y 189,5 MB de 1.258 GB; no aporta indicios de saturación local en ese instante.

## 6. Media · núcleo acoplado y fachada sin terminar

`handlers/music/index.js` tiene 1.054 líneas y reúne comandos del servicio, transición de pistas, integración con el SDK, restauración, controles Discord, publicación y persistencia. La cola de canciones pertenece a `state.js`; Mongo conserva snapshots, y Shoukaku mantiene conexión/player remoto. Esos papeles distintos no constituyen por sí solos dos colas de canciones, pero necesitan un único propietario claro de las transiciones.

`join`, `moveme` y `reconnect` todavía abandonan voz directamente mediante Shoukaku fuera del servicio; `playmusicmix` también consulta el SDK. La fachada no cubre aún todos sus consumidores. Instalar lavalink-client sin retirar esos accesos y transferir la autoridad de cola introduciría otra capa sobre el problema.

Hay partes modernas ya desplegadas: runtime Node 22.23.4, frontend parcial Next/React/TypeScript, reloj compartido, identificadores por reproducción y protección de publicaciones. CommonJS o JavaScript no explican por sí mismos estos fallos. Tampoco todos los problemas son del creador original: la serialización y recuperación actuales incluyen cambios posteriores que esta revisión acaba de poner a prueba.

## Corrección propuesta, vinculada al plan existente

1. **Contención de la incidencia:** verificar de nuevo los respaldos, clasificar errores de sesión/voz/HTTP y conciliar el estado real antes de reintentar una sesión agotada. No prometer respaldo funcional solo por aceptar WebSocket.
2. **P1, concurrencia:** sacar búsquedas largas de la sección de mutación, reservar intención manual antes de esperar y cancelar autoplay por stop o nueva petición manual. Validar de nuevo generación/playbackId al confirmar; no cambiar la autoridad de cola a mitad de una sesión.
3. **P0/P1, frontera musical:** terminar las entradas que aún acceden al SDK; un servicio para texto/slash/botones/web, con transporte aislado y una proyección confirmada para panel/letras. Mantener doce controles, favoritos y snapshots compatibles.
4. **P1, migración prevista:** transferir la cola una sola vez a lavalink-client; comprobar fin natural, doble skip, stop durante búsqueda, repeat/shuffle, manual frente a autoplay, fallos, cambio de nodo y reinicio antes de retirar Shoukaku. La instalación aislada previa del paquete no acepta esta migración.

Esta lista prioriza los hallazgos; no constituye una implementación ni altera silenciosamente el orden global P0 → P1 → P2. El resumen Config/categoría MUSIC pendiente de P0 conserva su lugar después de atender la incidencia según las instrucciones del usuario.

## Verificación y límites

Pasan los 25 tests originales en un contenedor efímero de la imagen desplegada, sin red, montando los tres archivos originales como solo lectura. El primer intento omitió esos mounts y falló porque la imagen no incluye tests; se corrigió la invocación. Las tres reproducciones adicionales confirman dos defectos de concurrencia y el orden de selección estático; son diagnósticos, no correcciones verificadas.

Sin cambios de código operativo, reinicio, instalación, escritura de datos, push, mensajes Discord o nuevas conexiones de voz. Los únicos WebSockets añadidos fueron sesiones diagnósticas de nodo con usuario sintético y cero players, terminadas al acabar. Helpers enviados por stdin, sin nuevos scripts ni tests permanentes. Logs completos, inspecciones y pruebas permanecen privados en `.runtime/music-audit-20261024/`; el JSON público elimina credenciales, IDs de servidores, canciones y cuerpos de proveedores. No se escuchó audio ni se probó el panel autenticado: no se declara resuelto el corte o el desfase.

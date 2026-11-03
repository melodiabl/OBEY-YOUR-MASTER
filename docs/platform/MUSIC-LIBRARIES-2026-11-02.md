# Dependencias musicales comparadas · 02/11/2026

## Pregunta y resultado

El usuario pide una dependencia que ya incluya la mayor parte del sistema musical, para evitar seguir ampliando el motor artesanal alrededor de Shoukaku. Se compararon seis clientes Lavalink y se comprobó el código publicado, además de la documentación. Discord Player y DisTube se contrastaron como alternativas de otra arquitectura; no se consideran reemplazos equivalentes del pool Lavalink público.

**Mayor automatización incluida: Moonlink.js 5.2.0. Recomendación técnica para OBEY: lavalink-client 2.11.0**, usando su cola y ciclo nativos en lugar de construir otra implementación encima. La recomendación distingue cantidad de automatismos y garantías necesarias para los incidentes concretos de OBEY. No existe evidencia de reproducción real ni de menor latencia en esta investigación; no se ha sustituido el motor activo.

## Comparación de versiones publicadas

| Dependencia | Publicación comprobada | Funciones integradas y diferencia relevante |
|---|---|---|
| Moonlink.js 5.2.0 | 28/02/2026 | Cola, historial, repetición, shuffle, autoplay por fuente, filtros, salud/recuperación, cambio de nodo y persistencia local/memoria. Es la más cercana a la petición de máxima automatización; los dos casos de abajo impiden tratarla como sustitución sin adaptación. |
| lavalink-client 2.11.0 | 21/08/2026 | Cola nativa, historial, repeat/skip, filtros, nodos y autoMove, reconexión, letras por plugins y QueueStore configurable. Autoplay requiere conectar `onEmptyQueue.autoPlayFunction`; la política de afinidad sigue siendo del bot/proveedor. |
| Kazagumo 3.4.3 | 05/03/2026 | Cola, reproductor y plugins de mayor nivel, pero depende directamente de Shoukaku ^4.3.0. No satisface la intención de sustituir esa base. |
| Poru 5.3.0 | 28/02/2026 | Cola, filtros, autoplay, letras y traslado de nodos. El autoplay publicado se basa en YouTube Mix; el manejo de algunos finales incluye esperas programadas de tres segundos. No es la primera elección para el requisito de quitar retrasos innecesarios. |
| Riffy 1.0.12 | 01/03/2026 | Cola, autoplay, letras y migración de nodos. Parte del autoplay de proveedores usa peticiones y parsing de HTML; introduce dependencia de páginas externas. La documentación avisa de menor disponibilidad de los mantenedores. |
| LavaShark 2.3.3 | 09/08/2026 | Reproductor, cola, controles y traslado/recuperación de nodos. No se localizaron equivalentes integrados de autoplay y letras en la superficie publicada revisada; no se afirma que no puedan añadirse. |

Las seis versiones declaran MIT salvo Moonlink.js, cuyo paquete y repositorio indican OSL-3.0. El requisito Node de Moonlink.js es 22 o superior; el paquete se importó con Node 22.23.4. Las versiones proceden del registro npm en la fecha de consulta, no de una cabecera README posiblemente atrasada. [Metadatos y comprobación aislada](evidence/music-library-research-20261102.json).

## Comprobaciones concretas de Moonlink.js

Se importó el paquete npm real 5.2.0 dentro de un contenedor Node 22.23.4, sin red, sin iniciar el Manager y sin credenciales. Se comprobaron las APIs de Player/Queue/Node. Se ejecutaron métodos reales con los límites externos sustituidos:

1. `Player.setVolume(80)` modifica el volumen local y devuelve el reproductor mientras el envío al nodo sigue pendiente. Por tanto, `await player.setVolume(...)` no representa confirmación remota en esa versión. El adaptador de OBEY tendría que usar una operación confirmable antes de anunciar éxito.
2. `Node.handleAutoPlay(...)`: con búsqueda retenida, cambiar `autoPlay=false` y marcar `destroyed=true`, luego resolver la búsqueda, todavía añade un candidato y llama a `play()`. Esta prueba demuestra ausencia de revalidación en ese límite, no reproducción audible ni éxito de una conexión destruida. Hace falta cancelación/identidad en la integración.

El paquete 5.2.0 ofrece almacenamiento local o memoria en su DatabaseManager; no se trasladó a esa versión la promesa de Mongoose de unas notas antiguas v4. `Player.subscribeLyrics()` comprueba capacidad NodeLink en el código publicado; no se presenta como compatibilidad universal de letras con cualquier nodo Lavalink.

## Qué usar de la dependencia y qué sigue siendo OBEY

La migración debe delegar cola, historial y avance de pistas al cliente elegido. No basta con instalarlo y conservar otra cola independiente. Los permisos DJ/solicitante, corazones, playlists privadas, recomendaciones por gustos, restricciones de contenido, mensajes Discord y frontend consumen ese estado; siguen siendo integración del producto.

Una dependencia no habilita los plugins ausentes de un nodo público. YouTube/Spotify/Apple Music, recomendaciones y letras necesitan capacidades/proveedores disponibles. El cambio de cliente tampoco acredita menor ping: se mide con el mismo nodo, guild y operaciones, distinguiendo tiempo de control, publicación Discord y audio.

La siguiente unidad sigue siendo la migración directa del motor y sus consumidores. No continuar ampliando Shoukaku como alternativa a ejecutar esa migración. La comparación no activa Moonlink ni modifica la elección del ZIP como si hubiera sido implementada. La instalación local preliminar de lavalink-client se retiró al pedir el usuario esta investigación; el manifiesto y lock se conservaron sin esa selección anticipada. Producción, landing y materiales no se tocaron.

## Fuentes primarias

### Revisión posterior: ¿ya están corregidos los dos casos?

Por petición del usuario se contrastaron npm, la rama estable `v5.2` y el HEAD de `dev`, además de los commits posteriores a la publicación. npm sigue ofreciendo 5.2.0 (`f87a0cc`); `dev` declara 5.3.0-dev.2 (`f6631bb`). Se ejecutaron los métodos TypeScript reales de ambas ramas, extraídos y transpilados sin editar su lógica, con I/O diferido en Node22.23.4 sin red.

- En ambas ramas, resolver la búsqueda retenida después de desactivar autoplay, ejecutar Stop o marcar destrucción sigue añadiendo un candidato e invocando `play()`. Son seis comprobaciones de dispatch; no demuestran reproducción audible ni conexión real.
- En ambas ramas, `setVolume()` sigue siendo síncrono y devuelve `this` antes de la confirmación remota. Esto es una limitación del contrato para una UI que necesita ACK, no prueba por sí sola un fallo de volumen/audio.
- Sí existe un cambio posterior para incluir el volumen en el payload de `play()` (01/03/2026), cambios de recomendaciones y un evento `playerStop` (22/08/2026). No corrigen los dos casos anteriores: el evento comunica Stop y no cancela automáticamente una búsqueda pendiente.

[Evidencia comparativa](evidence/moonlink-fix-status-20261102.json). No se cambió el runtime ni se instalaron ramas de desarrollo en OBEY.

### Referencias

- [Moonlink Player](https://moonlink.js.org/api/player), [Node/autoplay](https://moonlink.js.org/api/node), [NodeManager](https://moonlink.js.org/api/node-manager), [Queue](https://moonlink.js.org/api/queue).
- [Código Moonlink Player](https://github.com/Ecliptia/moonlink.js/blob/v5.2/src/entities/Player.ts), [paquete publicado 5.2.0](https://registry.npmjs.org/moonlink.js/-/moonlink.js-5.2.0.tgz).
- [lavalink-client: funciones](https://tomato6966.github.io/lavalink-client/home/features/), [opciones/autoplay](https://tomato6966.github.io/lavalink-client/api/types/manager/interfaces/managerplayeroptions/), [Player/letras](https://tomato6966.github.io/lavalink-client/api/player/classes/player/).
- [Kazagumo y dependencia Shoukaku](https://github.com/Takiyo0/Kazagumo).
- [Poru](https://github.com/parasop/poru), [código Player](https://github.com/parasop/poru/blob/v5/src/Player/Player.ts).
- [Riffy](https://riffy.js.org/), [autoplay publicado](https://github.com/riffy-team/riffy/blob/main/build/functions/autoPlay.js).
- [LavaShark](https://github.com/hmes98318/LavaShark).
- Metadatos npm: `https://registry.npmjs.org/{paquete}`; integridades registradas en la evidencia.

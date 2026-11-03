# Nodos públicos y catálogo de artistas · 03/11/2026

Solicitud: sustituir nodos que dejaron de responder bien y permitir buscar artistas, abrirlos y consultar sus canciones populares. Se incorpora al buscador existente de Discord y al reproductor web; no crea otro motor de reproducción.

## Contrato

- El resultado Artista tiene identidad de Spotify/Apple Music comprobada por URL, nombre, plataforma y fotografía cuando existe. Se conserva la separación de artistas homónimos por ID; no se deducen IDs a partir de un nombre.
- Abrir un artista muestra sus tops en el orden entregado por el proveedor y los álbumes identificados en esas canciones. La etiqueta explica ese alcance; no presenta ese subconjunto como discografía completa ni inventa seguidores/popularidad.
- Navegar y volver no añade música. Elegir una canción utiliza la autorización y cola NyxLink existentes. El vencimiento del menú o una respuesta antigua del navegador no reabre una vista cerrada.
- Se admiten metadatos LavaSrc y las colecciones Top Tracks nativas de NodeLink. El catálogo puede consultar otro nodo que tenga los plugins necesarios aunque el audio se reproduzca en el principal.
- El privado permanece apagado/excluido. No se activan fuentes adultas ni JioSaavn. La configuración inicial elige auto en lugar de depender del nombre de un proveedor.

## Selección y comprobaciones

Se probaron alternativas anunciadas por sus proveedores; varias no respondían, devolvían errores de Spotify o no resolvían DNS. Se eligieron Trinium NodeLink1/2 como principal/respaldo y Nazha v4 como tercer respaldo. Los tres completaron Ready con el SDK real: NodeLink3.8.0 y Lavalink4.2.2 respectivamente. Serenetia queda deshabilitado; Millo se conserva como último recurso y apoyo del catálogo.

Los dos NodeLink entregaron PCM con señal distinta de cero para una canción oficial de YouTube en pruebas cortas: 2.438/4.106 ms observados hasta la muestra válida. Son muestras desde este servidor, no una garantía de latencia, audición Discord ni disponibilidad futura. Nazha respondió a YouTube Music, pero falló Spotify; no se declara que todos sus plugins funcionen.

Fuentes de implementación: [LavaSrc: metadatos y tops de artistas](https://github.com/topi314/LavaSrc), [LavaSearch: búsqueda de artistas](https://github.com/topi314/LavaSearch), [NodeLink: LoadStream](https://nodelink.js.org/docs/api/rest#loadstream). Las disponibilidades y tiempos se verificaron mediante solicitudes reales, sin iniciar una nueva conexión de voz Discord.

## Verificación de interfaz

Las pruebas cubren identidades, homónimos, orden de tops, rechazo de URLs arbitrarias, ausencia de enqueue al navegar, menú de Discord y formato nativo NodeLink. El DOM del reproductor se ejecuta con el JavaScript real y proveedores de prueba; se comprueban artista, tops, álbumes y vuelta sin añadir canciones. La evaluación DOM necesita adaptar la entrada inline del buscador a un listener por la limitación de ámbito del entorno de prueba.

Chrome DevTools no pudo arrancar: primero ejecución como root y después falta de sandbox utilizable también bajo un usuario sin privilegios. No se desactivó el sandbox. La prueba DOM y el render EJS no acreditan una revisión visual en Chrome.

La comprobación real final con Adele devolvió dos identidades (Spotify/Apple Music). El perfil Spotify cargó diez tops y resolvió los nombres de cuatro publicaciones cuando el proveedor omitía albumName: 21, 30, Skyfall y 25. El conjunto tardó 2.953 ms en la muestra; se conserva el orden del top y cada publicación mantiene su identidad de catálogo.

## Despliegue

Código e79d7633, imagen release-artists-20261103-e79d7633, Node22.23.4. Pasan 37/37 pruebas dentro de la imagen, tipos Welcome y fronteras de dependencias. Los cargadores reales verifican 661 comandos, 776 aliases y 95 rutas sin login ni red; no se registró un comando raíz nuevo.

Se recreó únicamente obey_bot y se instaló el registro público junto con su nuevo principal de forma coordinada, después del cierre anterior. Salud HTTP200, Mongo/música disponibles, contenedor healthy, cero reinicios y sin errores fatales/fallos de restauración en la muestra. Los cuatro nodos habilitados emitieron Ready; el privado está excluido. Las seis preferencias guardadas eran auto y no requirieron editar Mongo.

Se conservan imagen anterior, configuración previa y registro anterior bajo .runtime/nodes-artists-20261103. Los arneses DOM y el navegador temporal se retiran después de guardar resultados. La aceptación de audición Discord, failover real entre proveedores y revisión visual Chrome sigue pendiente. [Evidencia](evidence/nodes-artists-20261103.json), [pruebas del proyecto](evidence/nodes-artists-20261103.tap).

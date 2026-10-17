# Búsqueda ampliada de Lavalink/NodeLink · 17/10/2026

La petición exige bajo ping, buen rendimiento, audio y todos los plugins musicales funcionando. Ninguno de los públicos comprobados cumplió esas cuatro condiciones. Se conserva GDjkhp; esta investigación no cambia configuración, imagen, sesiones ni nodos de producción.

## Método

Se consultaron el directorio/API oficial de Darren/Serenetia, la lista pública de NYX, los sitios de los operadores Trinium/GDjkhp/HeavenCloud y documentación oficial de NodeLink, LavaLyrics y LavaSearch. 21 direcciones publicadas, 19 TLS y dos sin TLS consultadas únicamente para diagnóstico con contraseñas públicas. No se probaron credenciales privadas, no se inició el nodo propio, no se utilizó token Discord para las sondas y no se hicieron pruebas de saturación. Solo se admitieron destinos con DNS público; plazos acotados y lotes pequeños. Los fallos DNS se describen desde este servidor, no como caída mundial demostrada.

Ocho endpoints respondieron a `/v4/info`; dos son alias de Trinium y no se cuentan como proveedores adicionales. Se profundizó en seis backends: API v4, handshake autorizado con ID sintético, cinco ping/pong, tres búsquedas base y cinco consultas por plataforma. Los tiempos siguientes son de control desde el host del bot, no de voz a Discord ni garantías de disponibilidad/capacidad.

| Nodo | Motor observado | RTT mediana | Variación max–min | Búsquedas base | Resultado adicional |
| --- | --- | ---: | ---: | ---: | --- |
| GDjkhp | NodeLink 3.10.0-dev, API v4 | 192,7 ms | 2,4 ms | 3/3 | Audio PCM y mute comprobados; cinco plataformas con resultados; letras sin datos en tres canciones |
| Serenetia | Lavalink snapshot, API v4 | 109,8 ms | 13,2 ms | 3/3 | LavaSrc/LavaSearch/LavaLyrics/SponsorBlock anunciados; búsqueda avanzada 200, letras 500; antecedente de cortes |
| MilloHost | Lavalink snapshot, API v4 | 187,3 ms | 4,5 ms | 3/3 | Info anuncia solo filtro volumen y dos plugins; letras 404, Deezer vacío |
| Trinium NodeLink 02 | NodeLink 3.8.0, API v4 | 215,4 ms | 1043,9 ms | 3/3 | Audio directo y letras devolvieron 502 |
| Trinium Java | Lavalink 4.2.2 | 145,9 ms | 682,7 ms | 1/3 | Nueve plugins anunciados, dos búsquedas base agotadas, letras 500 y búsqueda avanzada agotada |
| Trinium NodeLink 01 | NodeLink 3.8.0, API v4 | 498,7 ms | 494,6 ms | 0/3 | Otra consulta Spotify sí devolvió una pista; audio/letras 502 y otras fuentes sin resultados |

Una consulta con encoding válido acredita resolución/búsqueda, no reproducción de cada plataforma. No se selecciona un nodo solo por su RTT mínimo o por anunciar muchos plugins. Los snapshots se identifican por API y versión completa: major=0 no los convierte en protocolo v0; NodeLink 3.x tampoco significa Lavalink API v3.

## Audio y letras

GDjkhp entregó 194304 bytes de PCM desde `/v4/loadstream` para una pista resuelta, MIME `audio/l16;rate=48000;channels=2`, con 190165 bytes no nulos. La misma prueba con `volume=0` devolvió 194554 bytes, todos cero. Las lecturas se cancelaron tras aproximadamente un segundo de PCM; ningún audio se guardó en disco. Esto acredita datos de audio y aplicación del mute en ese endpoint. No demuestra que el audio proceda directamente de Spotify, que todos los filtros estén aplicados o que no haya cortes en la ruta de voz Discord. La observación de la sesión de producción en GDjkhp siguió mostrando conexión, avance de 30 s en 30 s y frames agregados sin déficit; ping de voz 344 ms.

Las búsquedas de Spotify, YouTube, SoundCloud, Apple Music y Deezer devolvieron resultados en GDjkhp. `/v4/loadlyrics` no devolvió letras para One More Time, Yellow y Never Gonna Give You Up: respuestas HTTP 200 con `loadType:error`. Un 200 no se contó como éxito funcional. Son tres pruebas concretas; no se afirma que ninguna canción pueda tener letras. En Serenetia/Trinium Java, `/v4/lyrics` devolvió 500 para la pista probada; MilloHost 404. No se publicaron letras ni encodings de pistas en la evidencia.

NodeLink incluye funciones nativas, no los mismos contratos que los plugins Java. Su API de letras es `/v4/loadlyrics`, y sus filtros echo/highpass/otros tienen su propia forma. Un listado de plugins vacío en NodeLink no prueba ausencia de esas funciones; un plugin presente en Lavalink tampoco prueba que su proveedor externo esté funcionando. No se probaron SponsorBlock, todos los filtros ni migración de voz en una sesión real durante esta investigación.

## Candidatos descartados y publicidad

NYX Frankfurt y las dos variantes TLS de Singapur no resolvieron desde el host del bot. Las direcciones regionales publicadas en el repositorio HeavenCloud no aportaron un nodo funcional: USA/Singapur/Europa sin DNS y el endpoint general TLS agotado. El sitio actual publica un único endpoint público sin TLS; esa consulta también agotó el plazo. Las regiones alemanas anunciadas no proporcionaron credenciales de un público TLS operativo que se pudiera validar. Jirayu devolvió 500; Nazha 502 y dos subdominios 530, otro sin DNS. Las variantes de dominio indevs.in de Trinium respondieron pero son los mismos backends comprobados. El demo NodeWave consultado usa búsquedas/previews de iTunes y publica credenciales de ejemplo; no se trata como una prueba de un nodo Lavalink alemán accesible.

No se encontró un público funcional con menos de 50 ms en esta muestra. No se atribuye una capacidad de carga o SLA a los nodos por la publicidad de sus operadores. No se contrataron servicios ni se pidió o envió acceso a operadores.

## Compatibilidad pendiente en OBEY

Se encontraron límites del cliente que tampoco se arreglan eligiendo otro host:

- `nodes.js` solo conserva `/info` con `version.major === 4`; descarta los snapshots major=0 y NodeLink major=3 observados, aunque aceptan API v4. Eso impide reconocer ciertos plugins anunciados por esos nodos.
- `getLyricsOptions` usa detección LavaLyrics y `/v4/lyrics`; todavía no adapta `/v4/loadlyrics` de NodeLink. La alternativa LRClib del bot permanece disponible y esta investigación no cambia su reloj.
- Serenetia devolvió 25 resultados Deezer con origen `deezerm`, sin marcas explícitas en esa muestra; el validador musical actual no reconoce ese alias y los descarta. No se presenta ese descarte del cliente como una búsqueda vacía del proveedor.
- Los presets extendidos LavaDSPX (`pluginFilters`) requieren adaptación explícita para filtros nativos NodeLink. El plugin Java LavaDSPX no figura en el NodeLink actual.

Estos puntos quedan registrados como trabajo de integración; no se modificó código ni se promete «todos los plugins funcionales». El principal y respaldos actuales se conservan, con el privado apagado. Para elegir una alternativa haría falta validar el mismo recorrido de audio/filtros/letras y la voz de Discord, además de los pings. El [directorio de Serenetia](https://freelavalink.serenetia.com/list) advierte que no gestiona esos servidores ni garantiza su calidad o disponibilidad.

[Evidencia completa redactada](evidence/public-node-research.json). Fuentes: [API del directorio](https://lavalink.darrennathanael.com/rest-api-badges/), [lista TLS](https://lavalink.darrennathanael.com/SSL/Lavalink-SSL/), [lista NYX](https://github.com/Nonsen-Production/Free-Nodelink-List/blob/main/nodelink.json), [operador Trinium](https://lavalink.triniumhost.com/), [HeavenCloud actual](https://heavencloud.in/service/public-lavalink-servers), [API NodeLink](https://nodelink.js.org/docs/api/rest), [LavaLyrics](https://github.com/topi314/LavaLyrics), [LavaSearch](https://github.com/topi314/LavaSearch).

# Relevancia musical · 23/10/2026

El proveedor devolvía nombres parecidos y hasta canales de YouTube como pistas. El orden anterior mantenía resultados sin coincidencia. Se normaliza texto Unicode, se exige coincidencia de título/artista y, cuando dos grabaciones distintas identifican el artista exacto, se conservan sus créditos y colaboraciones. No se filtra por idioma o país. Se deduplican URI/grabación y se excluyen canales y Shorts.

El usuario eligió Spotify, YouTube, YouTube Music y Apple Music. Se retiran los demás proveedores de búsqueda y la recuperación JioSaavn pasa a Apple Music, conservando comprobación de grabación. HTTP de radio y adaptador YouTube ytdlp permanecen transportes. Las etiquetas de fuentes históricas no borran favoritos/datos.

La búsqueda por defecto consulta Spotify → YouTube Music → YouTube → Apple Music cuando falte una lista pertinente. Enlaces y colecciones conservan su orden. Los controles, letras y cola no cambian por este filtro.

Verificación local: 11 casos temporales pasan (ocho fallos reproducidos antes de corregir), más los 25 casos de los tres archivos originales. Los fixtures de búsqueda ahora contienen la consulta y el caso de recuperación comprueba Apple Music; no se eliminan ni saltan casos. Fixtures y verificadores temporales se retiran al terminar.

Consultas reales guardadas durante el diagnóstico: ADÉLA y Adele revelaron homónimos en YouTube Music; YouTube devolvió un canal como primera pista. El mix RD de Someone Like You devuelve 50 pistas con Adele, P!nk y Beyoncé. Los prefijos nativos ytrec/sprec agotaron 8–9 segundos; no se consideran funcionales en este nodo. Contrato de referencia: [NodeLink API](https://nodelink.js.org/docs/api), [youtube-source](https://github.com/lavalink-devs/youtube-source).

## Recomendaciones conectadas

La búsqueda mantiene coincidencia con la consulta. Las recomendaciones usan el mix RD de YouTube de una grabación confirmada: si la semilla es Spotify/Apple, primero se comprueba la misma grabación en YouTube Music. No se infiere género por nacionalidad, idioma o nombre; la afinidad estilística procede de esa mezcla, sin garantizar un clasificador de géneros. Fuentes no permitidas, canales, Shorts, versiones no pedidas, semilla y duplicados quedan fuera. No se usan ytrec/sprec en este nodo porque agotaron el tiempo del diagnóstico.

Autoplay y /music playmusicmix consumen este servicio. Autoplay conserva historial, comprobaciones de cancelación y prioridad de la cola manual; si no existe mezcla, busca entre los artistas recientes. Las recomendaciones no crean una segunda cola ni cambian el cliente musical.

GET /api/music/recommendations/:guildId requiere sesión OAuth, permisos recientes y acceso al servidor; responde {success:true,data:{basis,tracks}} con máximo diez pistas. basis es likes, guild_history o none. El userId se deriva de la sesión; no se acepta desde body/query. Se eligen hasta dos artistas entre veinte Me gusta; sin favoritos disponibles, se utiliza canción actual/historial de esa guild. Sin datos no se inventan gustos. El endpoint es de lectura, usa respuesta private/no-store y consultas acotadas. Panel: «Afines a lo que escuchas», con indicación de favoritos/historial; retira búsquedas genéricas presentadas como personalizadas. Radar global sigue identificado como descubrimiento general.

Verificación de esta parte: nueve casos temporales, incluyendo rechazo de acceso, identidad de sesión, fallback sin favoritos, exclusión de semilla/versiones/fuentes, otras autorías relacionadas y cancelación. Cinco fallos de recomendaciones y tres del endpoint reproducidos antes de implementar. Los 25 casos originales pasan. Consulta real con código candidato en proceso aislado: ADÉLA tres pistas correctas, Adele ocho y veinte relacionadas de otros artistas, sin Gateway, mensajes o voz. Esos números son observaciones del proveedor en esa muestra, no cantidades garantizadas.

Navegador Chromium 151 por CDP en preview aislada con fixtures: sección, tarjeta relacionada y texto de Me gusta renderizados; cero excepciones/runtime o fallos de red. Chrome DevTools MCP no pudo iniciar como root; la comprobación se realizó con un perfil local separado. No sustituye un recorrido con sesión real.

[Evidencia local](../platform/evidence/music-relevance-local-20261023.json). Estado: desplegado `c5033b7`, imagen `c296f83`, saludable, cero reinicios automáticos. Cuarenta hashes y 25 tests pasan en la imagen; consultas reales en contenedor: seis pistas de Adele, todas de la artista, y veinte relacionadas; salud local/pública HTTP 200, endpoint privado sin sesión 401. La muestra varía entre consultas. [Evidencia de despliegue](../platform/evidence/music-relevance-deployment-20261023.json). Respaldo de 59.239.821 bytes y argumentos de reversión conservados. La primera recreación usó el nombre candidato histórico: se corrigió a obey_bot y se comprobaron Gateway/Mongo/heartbeat antes del cierre. No acredita escucha real en Discord ni migración a lavalink-client.

## Auditoría y corrección integral de búsquedas · 23/10/2026

Alcance: búsquedas activas prefix/slash de play/search, selector Soundy, GET /api/music/search y POST /api/player/:guildId/search, resolución y selección de colecciones. Se conserva el servicio de reproducción, doce controles, privacidad, datos y filtros de fuentes/Shorts. El helper legacy musiccatalog conserva sus contratos originales; no es el propietario del nuevo recorrido activo.

| Hallazgo | Corrección verificada |
| --- | --- |
| Retorno anticipado con 2–3 pistas | Combinar las cuatro fuentes elegidas antes de ordenar |
| Esperas en serie y lista escasa del principal | Dos nodos consultados en paralelo; espera por fuente 3,5 s y presupuesto de catálogo 6,5 s |
| Diez opciones visibles y resultados restantes inaccesibles | Páginas de diez, hasta cincuenta pistas, índice global y contador real |
| Búsqueda de nombre sin catálogo del artista | LavaSearch identifica una única URL Spotify del artista y consulta sus principales y un álbum pertinente |
| Homónimos y versiones ajenas en consulta artista+título | Ancla por créditos y título, identidad Spotify y canciones observadas; no ampliar una identidad ambigua |
| Ediciones/videoclips repetidos | Agrupar para descubrimiento sin debilitar ISRC/duración al resolver audio |
| Peticiones repetidas | Caché pública de 20 s, coalescencia, máximo cien entradas y cuatro trabajos simultáneos |
| Selector viejo, doble clic o permiso retirado | Consumo único y pertenencia/voz/DJ revalidados antes del efecto |
| Entrada a voz antes de resolver un álbum; stop durante carga | Resolver primero, comprobar generación y delegar a playCollection existente |
| Catálogo web divergente | Mismo servicio; consultas inválidas rechazadas y saturación identificada como reintentable |
| Un fallo de búsqueda enfriaba el nodo y cambiaba el catálogo siguiente | La disponibilidad de audio pertenece solo al transporte/recuperador; la búsqueda no llama nodePool.fail |
| Plugin opcional o HTTP legado fallidos | Respaldo de metadata y límites de tiempo/tamaño; conservar resultados válidos |

La búsqueda no cambia el nodo del audio solo por abrir resultados. La caché no contiene actor, favoritos o historial; cada respuesta adjunta su solicitante fuera de ella. La coincidencia de playback sigue comprobando ISRC/duración; la agrupación de presentación no autoriza una grabación distinta. Los enlaces/colecciones directos conservan orden y resolución. No se hace un reemplazo global de recursos ni una migración de cliente como parte de este arreglo.

Spotify: la consulta spsearch del upstream consultado usa diez resultados; los nodos públicos observados entregan muestras limitadas y su configuración no se administra desde OBEY. No se promete paginación remota cambiando un número local. La ampliación usa APIs del nodo y URLs Spotify validadas, no IDs inventadas o una cuenta Spotify ajena. Los principales del artista y un álbum son una ampliación acotada, no discografía exhaustiva. [LavaSrc](https://github.com/topi314/LavaSrc/blob/master/main/src/main/java/com/github/topi314/lavasrc/spotify/SpotifySourceManager.java), [LavaSearch](https://github.com/topi314/LavaSearch), [componentes Discord](https://docs.discord.com/developers/components/reference).

Evidencia: 25 casos temporales (catorce regresiones reproducidas antes de corregir) y 25 originales, sin omisiones. Tipos y fronteras de dependencias pasan. El candidato consultado en un proceso separado devuelve quince pistas para adela, diez de Spotify, todas acreditadas a ADÉLA; PRIMA contiene once pistas y la consulta repetida responde en menos de un milisegundo medido. Los conteos varían con el proveedor. Sin mensajes/eventos/voz artificiales o escucha acreditada. [Evidencia local](../platform/evidence/music-search-audit-local-20261023.json). Desplegado en `ce546e8`, imagen `a6fc1d6`; la entrega c5033b7 anterior conserva su evidencia histórica. [Evidencia del despliegue](../platform/evidence/music-search-audit-deployment-20261023.json).

La primera comprobación desplegada detectó un fallo adicional: errores de consulta marcaban el pool completo y la repetición pasó de catorce a cuatro pistas. `ce546e8` retira esa mutación; transporte/recuperación conservan su autoridad. Verificación final HTTP: nueve pistas, cuatro de Spotify y todas ADÉLA; Nicole Kidman devuelve una. Repetición: las mismas nueve en 7 ms. La muestra candidata de quince/diez corresponde a otra consulta/disponibilidad, no a una cantidad garantizada. Salud local/pública 200, privados sin sesión 401, cero reinicios automáticos y 51 hashes coincidentes. Respaldo Mongo 59.251.954 bytes con exit 0/CRC gzip válido; reversión 6d5b666 conservada.

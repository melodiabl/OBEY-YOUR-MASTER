# Relevancia musical · 23/10/2026

El proveedor devolvía nombres parecidos y hasta canales de YouTube como pistas. El orden anterior mantenía resultados sin coincidencia. Se normaliza texto Unicode, se exige coincidencia de título/artista y, cuando dos grabaciones distintas identifican el artista exacto, se conservan sus créditos y colaboraciones. No se filtra por idioma o país. Se deduplican URI/grabación y se excluyen canales y Shorts.

El usuario eligió Spotify, YouTube, YouTube Music y Apple Music. Se retiran los demás proveedores de búsqueda y la recuperación JioSaavn pasa a Apple Music, conservando comprobación de grabación. HTTP de radio y adaptador YouTube ytdlp permanecen transportes. Las etiquetas de fuentes históricas no borran favoritos/datos.

La búsqueda por defecto consulta Spotify → YouTube Music → YouTube → Apple Music cuando falte una lista pertinente. Enlaces y colecciones conservan su orden. Los controles, letras y cola no cambian por este filtro.

Verificación local: 11 casos temporales pasan (ocho fallos reproducidos antes de corregir), más los 25 casos de los tres archivos originales. Los fixtures de búsqueda ahora contienen la consulta y el caso de recuperación comprueba Apple Music; no se eliminan ni saltan casos. Fixtures y verificadores temporales se retiran al terminar.

Consultas reales guardadas durante el diagnóstico: ADÉLA y Adele revelaron homónimos en YouTube Music; YouTube devolvió un canal como primera pista. El mix RD de Someone Like You devuelve 50 pistas con Adele, P!nk y Beyoncé. Los prefijos nativos ytrec/sprec agotaron 8–9 segundos; no se consideran funcionales en este nodo. Contrato de referencia: [NodeLink API](https://nodelink.js.org/docs/api), [youtube-source](https://github.com/lavalink-devs/youtube-source).

Estado: corrección de búsqueda verificada localmente; recomendaciones por gustos y despliegue pendientes en esta unidad. No acredita escucha real en Discord ni migración a lavalink-client.

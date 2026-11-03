# Relevancia de canciones, artistas y álbumes · 03/11/2026

Problema: una consulta general se convertía implícitamente en búsqueda de artista si aparecían dos canciones acreditadas a ese nombre. El filtro eliminaba canciones y álbumes homónimos de otros artistas. Además se abrían tops sin selección explícita y las versiones que incluían el nombre del artista en el título podían superar a la grabación buscada.

Corrección:

- Cada canción y álbum se evalúa por su título y créditos; no se eliminan candidatos por deducir una identidad de artista.
- Una consulta con título y artista acreditado prioriza esa combinación. Un título exacto supera coincidencias parciales y coincidencias únicamente en el autor. Se conservan normalización de acentos, palabras parciales desde tres caracteres, deduplicación y exclusión de Shorts/versiones marcadas no solicitadas.
- Un prefijo de artista de YouTube solo se interpreta como crédito si aparece en el catálogo consultado; no se convierte el nombre del uploader en identidad oficial.
- Las categorías permanecen disponibles. Discord abre la categoría con la mejor coincidencia y el panel destaca esa categoría en Todo. Los títulos exactos de canciones tienen prioridad en casos ambiguos; se pueden elegir Artistas o Álbumes explícitamente. También se reconoce una combinación de nombre de álbum y autor.
- Los tops se consultan al abrir un artista; buscar no reproduce ni encola. Los álbumes también pueden proceder de los metadatos reales de las pistas cuando no existe LavaSearch, sin inventar títulos ni cantidades.

Verificación: 49 pruebas aprobadas, incluidos casos que fallaban antes de la corrección: Hello frente al artista Hello, Hello Adele frente a versiones, álbumes homónimos, acentos, palabras parciales, categorías y navegación sin reproducción. Tipos del backend/panel, límites de dependencias, sintaxis EJS/JavaScript e inventario mantienen sus controles existentes. No se modifican las condiciones originales de aceptación del plan.

Consultas reales y estado del despliegue se registran en [la evidencia](evidence/search-relevance-20261103.json). La disponibilidad de canciones depende de lo entregado por cada proveedor. La validación del panel cubre su lógica de selección y el renderizado de la plantilla; no se atribuye una comprobación visual a Chrome, cuyo sandbox no está disponible en este entorno. Estas comprobaciones no acreditan audición en Discord ni una prueba real de conmutación durante reproducción.

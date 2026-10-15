# Identidad de plataformas — 15 de octubre de 2026

Correcciones recibidas en el ZIP SHA-256 `857a2ceb27ca32710fe5ed6cb456088c34fd89161cdbc650b1f663b3b201bab6`: 4274 entradas, extracción vigente `/home/OBEY_Documentacion_correcciones_2026-10-15/OBEY_Documentacion`; comprimido eliminado después de verificar la extracción.

Se integró únicamente la diferencia respecto al paquete anterior: 15 marcas, asignaciones de seis IDs históricos, siete clases web y campos específicos del bot. Los recursos anteriores conservan su contenido; los controles generales y piezas de juegos mantienen los iconos OBEY. Continúan excluidos el icono adulto y los comandos NSFW. El total instalado es 316 materiales y 295 emojis (285 PNG y diez GIF), porque esta instalación excluye el recurso adulto que el catálogo de entrega aún cuenta.

`handlers/music/platforms.js` determina nombre, color y logo por hostname completo o metadatos conocidos. Distingue YouTube Music de YouTube, rechaza coincidencias dentro de dominios ajenos y muestra Audio para orígenes desconocidos. La normalización pública tampoco inventa YouTube cuando falta el origen. Sin un ID verificado, el formatter conserva el nombre de plataforma y omite su emoji. El logo describe el enlace/metadatos; no certifica que el audio se sirva nativamente desde ese servicio.

Se conservan variantes SVG oscuras, claras y atenuadas con sus hashes, así como la procedencia y licencia suministradas. Discord usa una única variante PNG por marca, no las tres variantes. Los 295 emojis se sincronizaron sin fallos y se conserva el mapa v2; no se eliminan emojis previos de la aplicación. La fuente de procedencia está en `assets/obey/platforms/sources.json`.

Verificación: 501 pruebas de Node pasan. Las regresiones reproducen la identificación falsa de Spotify por substring y la de YouTube para audios desconocidos. Chromium carga los 15 SVG, comprueba siete asignaciones de marca y los iconos funcionales de música/auriculares, escritorio 1280 y móvil 390 sin desbordamiento ni errores; además renderiza el EJS real del panel. No se reproduce audio para un cambio visual.

Los cambios anteriores de letras, reloj, autoplay, protección del nodo privado y selección pública se mantienen. Los 16 archivos locales previos se preservan byte por byte y quedan fuera de la imagen del bot. El estado del despliegue y la limpieza se añaden a la evidencia de esta entrega.

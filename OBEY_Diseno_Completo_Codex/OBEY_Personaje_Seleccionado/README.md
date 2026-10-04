# OBEY · Paquete completo con personaje

Abrí **VER_TODO.html** después de descomprimir. Esta entrega reemplaza las versiones anteriores del ZIP: todas las variantes de emoji, banners y pantallas nuevas incluyen al personaje.

## Archivos entregados

- 6 ilustraciones originales del personaje: `assets/character/png/`.
- 89 variantes de emoji: PNG transparentes de 128 × 128 y SVG compuestos con personaje más símbolo: `assets/emojis/`. Las variantes reutilizan las seis ilustraciones; no son 89 dibujos distintos. El SVG tiene una capa raster del personaje y formas vectoriales del símbolo.
- 13 banners: SVG y PNG de 1200 × 360: `assets/banners/`.
- 3 bases dinámicas sin nombres ni tiempos incrustados: bienvenida, despedida y música, SVG/PNG de 1772 × 633: `assets/templates/`.
- 59 pantallas de propuesta, SVG y PNG: `design/screens/`.
- 4 ejemplos generados realmente mediante Canvas: bienvenida, despedida, música y nombre largo, dentro de `design/screens/png/`.
- 3 maquetas ilustrativas originales aprobadas como dirección visual: `preview/anime/`.
- Registro de assets y doce controles, patrones y correspondencia con el código: `contracts/` y `docs/`.
- Dos adaptadores de código para Codex: `integration/render-card.js` y `integration/build-controls.js`, más `emoji-map.json`.
- Fuentes y licencia: `assets/fonts/`.

## Figma

Importá SVG para editar texto, formas y disposición; la ilustración embebida sigue siendo raster. Importá PNG si solo querés colocar el resultado. Los SVG no crean automáticamente componentes, variantes ni autolayout. No contiene `.fig`. Las fuentes de los SVG son DejaVu Sans; están incluidas.

## Discord y código

Los 89 PNG se verificaron con transparencia, dimensiones 128 × 128 y peso menor a 256 KiB. Esto no sustituye probar la carga y su legibilidad en Discord. Los registros tienen `applicationEmojiId: null` hasta subirlos. Revisar los símbolos a tamaño pequeño y conservar etiquetas en botones.

`render-card.js` fue ejecutado con Canvas para los cuatro ejemplos incluidos. Requiere `@napi-rs/canvas`, ya presente en el paquete del bot. `build-controls.js` pasó revisión de sintaxis; no fue ejecutado con discord.js en este entorno. Conecta los IDs existentes y conserva límites, estados y acciones.

No se modificó GitHub ni el bot desplegado. Estos adaptadores deben integrarse con el envío, permisos, configuración y estado del repositorio, siguiendo `PARA_CODEX.md`. Las pantallas de otros módulos son propuestas de diseño; su comportamiento no se auditó ni implementó. Las actualizaciones de progreso y letras permanecen en mensajes nativos, fuera de las imágenes dinámicas.

Los banners decorativos llevan títulos editables. Las bases dinámicas separadas dejan los datos variables para Canvas. El avatar con letra A, la portada geométrica y los textos de muestra son datos de ejemplo.

La aprobación del usuario cubre incorporar el personaje y la dirección visual. La integración, carga de emojis y verificación real en Discord siguen pendientes.

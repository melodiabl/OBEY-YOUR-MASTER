# OBEY: diseño basado en el código real

Repositorio: https://github.com/melodiabl/OBEY-YOUR-MASTER

Rama: `feat/motor-soundy`. Cabeza observada: `b8bee2d657d5194b3febcbf96de06764e532b17b`. Revisión estática de archivos obtenidos con GitHub; no se ejecutó el bot ni se comprobó el servidor desplegado. Los archivos se leyeron desde la rama; comprobar sus SHA antes de implementar si hubo cambios concurrentes.

## Objetivo y estado

Rediseñar la presentación del bot conservando música, controles, progreso y letras existentes. La dirección provisional aprobada usa azul marino, acentos dorados y Obey Your Master. El miembro y la portada musical deben conservar protagonismo. El bot debe admitir personalización independiente por servidor.

Este documento distingue comportamiento confirmado, diferencias respecto de las maquetas y cambios propuestos. No contiene una implementación ni implica que los nuevos diseños estén desplegados. Las imágenes generadas son referencias visuales; los textos, avatares, metadatos y progreso deben componerse desde datos reales.

## Mapa de integración confirmado

| Área | Archivo | Función actual | Cambio de diseño propuesto |
| --- | --- | --- | --- |
| Bienvenida real | `handlers/welcome.js` | `_generateCard`, envío al entrar, opciones `welcome.*` | Sustituir composición gráfica sin alterar roles, captcha, invitaciones ni entrega |
| Despedida real | `handlers/leave.js` | Canvas y opciones independientes `leave.*` | Diseño de salida propio; avatar y texto configurables |
| Fondos y utilidades | `handlers/canvasUtils.js` | Utilidades compartidas de dibujo | Reutilizar como base del renderizador común |
| Prueba de bienvenida | `slashCommands/Welcome/test.js` | Renderizador independiente de 1772 × 633 | Hacer que use el mismo renderizador que el evento real |
| Tarjeta de bienvenida | `slashCommands/Welcome/tarjeta.js` | Otra composición independiente de Canvas | Unificar prueba, tarjeta y producción |
| Reproductor activo | `handlers/music/embeds.js` | `buildNPEmbed`, `buildControls`, cola | Reordenar información y renovar emojis conservando IDs y estados |
| Actualización del reproductor | `handlers/music/liveupdate.js` | Edición cada 5000 ms; cola de escrituras y generaciones | Conservar coordinación y cadencia durante el cambio visual |
| Interacciones | `handlers/music/index.js` | Router `mp_*`, compatibilidad `m2_*`, fallback de letras | Conservar permisos, acciones y correspondencia de IDs |
| Karaoke | `handlers/music/lyricsLive.js` | Mensaje independiente, ventana de 7 líneas, edición cada 2500 ms | Destacar línea actual con texto nativo; mantener sesión y cambio de canción |
| Datos de letras | `handlers/music/lyrics.js` | Plugin de Lavalink, fallback LRCLIB, caché y parseo LRC | Mantener proveedores; no reemplazar búsqueda por imágenes |
| Letras por comando | `slashCommands/Music/lyrics.js` | Búsqueda separada y primera página de texto | Unificar presentación y resolver navegación si se aprueba el cambio funcional |
| Emojis y colores | `handlers/music/config.js` | Registro de emojis personalizados y colores globales | Mantener claves; sustituir imágenes/IDs mediante registro validado |
| Dashboard | `dashboard/index.js` | Opciones de canal y mensaje; copia hacia settings | Corregir correspondencia de campos y añadir personalización solo como extensión explícita |

## Reproductor: conservar los doce controles

El flujo activo importa `embeds.js` desde `index.js` y `liveupdate.js`. Existe `ui.js` con otro constructor y controles `m2_*`; no debe tomarse como objetivo único por su nombre. El router mantiene compatibilidad con parte de esos IDs.

| Fila actual | ID | Acción | Estado que debe conservarse |
| --- | --- | --- | --- |
| 1 | `mp_shuffle` | Mezclar | Indicación activa |
| 1 | `mp_prev` | Anterior | Deshabilitado sin historial |
| 1 | `mp_toggle` | Pausar / Reanudar | Emoji y estilo cambian según pausa |
| 1 | `mp_skip` | Saltar | Acción actual |
| 1 | `mp_loop` | Repetir | Ninguno, canción o cola |
| 2 | `mp_lyrics` | Letras | Activa/desactiva karaoke o devuelve fallback |
| 2 | `mp_voldown` | Volumen − | Deshabilitado al llegar a 0 |
| 2 | `mp_stop` | Detener | Botón de peligro |
| 2 | `mp_volup` | Volumen + | Deshabilitado al llegar a 200 |
| 2 | `mp_queue` | Cola | Vista de cola actual |
| 3 | `mp_like` | Me gusta | Acción actual |
| 3 | `mp_autoplay` | Autoplay | Indicación activa |

Propuesta: mantener las filas 5 / 5 / 2 para minimizar cambios de comportamiento. Los controles de transporte usarán símbolos reconocibles; letras, cola y autoplay tendrán texto visible. El personaje aporta identidad en la tarjeta y emojis expresivos, sin sustituir todos los símbolos por caras que no expliquen la acción. Los botones siguen siendo componentes nativos de Discord.

El embed actual incluye título enlazado, artista, duración, solicitante, volumen, loop, tiempo de finalización y siguiente pista/longitud de cola. También muestra filtros, autoplay, shuffle y radio si están activos. Estos datos se conservarán; la primera maqueta de cuatro botones no cubría toda la interfaz.

Propuesta de composición: portada real, título y artista primero; progreso y tiempo como texto nativo; solicitante y estados en campos compactos; siguiente canción al final. Imagen de marca opcional y de tamaño secundario. La barra actual proviene de `progressBar`, no de una animación dentro de una imagen. No regenerar un PNG completo cada cinco segundos únicamente para avanzar la barra.

## Letras: comportamiento comprobado y correcciones de alcance

Karaoke: `lyricsLive.js` muestra una ventana de siete líneas por defecto, destaca la actual con negrita y flecha, conserva el mismo mensaje al cambiar de canción y vuelve a buscar las letras. Su temporizador es de 2500 ms. Se conserva este comportamiento, incluida la protección contra escrituras concurrentes y cambios de pista durante la búsqueda.

Fallback del botón: `index.js`, caso `mp_lyrics`, envía una respuesta efímera con `r.plain.slice(0, 1800)` cuando el resultado es `no_sync`. Por tanto, la rama revisada contiene letras sin sincronización, pero ese camino no entrega todo el texto si excede 1800 caracteres.

Comando `/lyrics`: divide el texto en páginas y solo envía `pages[0]`. No contiene botones de página ni argumento para elegir otra. El pie pide repetir el comando, pero este mismo código vuelve a elegir la primera página.

Corrección propuesta, separada del rediseño: navegación real de páginas con acceso al texto completo, conservar el carácter efímero del fallback del botón, mostrar estados sin sincronización / no encontrada / cargando y no presentar líneas no sincronizadas como karaoke. En la maqueta anterior los botones de paginación eran una propuesta, no controles ya implementados.

## Bienvenida y despedida por servidor

Las opciones leídas actualmente incluyen canal, mensaje, imagen automática o personalizada, fondo, color, avatar, nombre del servidor, contador y opciones separadas para DM. En bienvenida, el generador contempla modo con overlays de 1772 × 633 y otro programático de 1772 × 720. Despedida también usa Canvas y parámetros propios.

Propuesta: avatar del miembro a la izquierda, saludo y nombre con espacio seguro en el centro, personaje opcional a la derecha. Deben existir plantillas OBEY, neutra y fondo propio; estas opciones de plantilla/personaje son extensiones propuestas. El texto fuera de la imagen sigue siendo editable y accesible. No hornear en los fondos nombres, avatares, contador ni nombre de servidor.

Los botones de reglas/roles de las maquetas son una extensión propuesta: no se verificaron como controles del envío de bienvenida en los handlers revisados. Añadirlos requiere destinos y permisos configurados, además de su diseño.

Problemas concretos a resolver:

- Preview divergente: el evento, `test.js` y `tarjeta.js` dibujan por caminos diferentes. Una aprobación del preview no garantiza el mismo resultado en el evento real. Crear un renderizador común y probar ambos caminos con los mismos datos.
- Clave de mensaje divergente: el dashboard escribe `welcome.message`, pero el evento y el comando `mensaje.js` usan `welcome.msg`. Alinear y migrar preservando la preferencia existente; definir precedencia cuando ambas claves tengan contenido.
- Contador de salida: el renderizador usa `guild.memberCount` para decir «Fuiste el miembro #…». Ese número no acredita el orden histórico de llegada. Usar «Miembros actuales» o retirar esa frase.
- Legibilidad: ajustar nombres largos mediante medición; comprobar avatar ausente, fondo claro/oscuro, caracteres Unicode y servidor con nombre largo. No depender de un único emoji para explicar una acción compleja.

## Instrucciones concretas para Codex

1. Trabajar desde la versión actual de `feat/motor-soundy` y contrastar el snapshot revisado; leer instrucciones locales del repositorio. Preparar cambios revisables en una rama de trabajo.
2. Extraer un renderizador de tarjetas compartido por eventos y previews sin alterar los efectos de bienvenida. Mantener compatibilidad con settings existentes y valores de DM.
3. Componer assets del personaje como capas independientes; fondos sin datos variables. Registrar fuentes y zonas de avatar/texto/personaje. Mantener identidad web existente.
4. Renovar `embeds.js` y el registro de emojis de `config.js`; conservar los doce IDs, permisos y estados. Verificar panel de setup vacío y panel activo.
5. Mantener timers, sesión musical, posición, historial, cola y sincronización actuales. No sustituir el motor ni cambiar fuentes de audio para cumplir un objetivo visual.
6. Tratar paginación completa y correspondencia de settings como correcciones explícitas con pruebas independientes; no confundirlas con cambio de colores.
7. Validar render de bienvenida real contra preview; regresión de los doce controles; pausa/reanudación/seek/cambio de canción en karaoke; letras largas; guardar y volver a cargar personalización de dos servidores distintos.
8. Mostrar evidencia visual antes/después y resultados de pruebas. No afirmar despliegue ni sincronización real desde una maqueta estática.

## Estado de la entrega actual

El ZIP se amplió tras la aprobación del personaje: seis masters, 89 variantes compuestas de emoji exportadas a 128 × 128, 13 banners, tres bases dinámicas y 59 pantallas. Incluye registros, mapa de claves y dos adaptadores de integración. Se ejecutó el adaptador Canvas para cuatro ejemplos; no se ejecutaron interacciones Discord ni se modificó GitHub. Ver `README.md` y `docs/VALIDATION.json` para resultados y límites. Las variantes reutilizan los seis dibujos; no son 89 ilustraciones distintas. Las funciones de otros módulos siguen siendo propuestas no auditadas.

## Evidencia

Los archivos citados se encuentran bajo https://github.com/melodiabl/OBEY-YOUR-MASTER/tree/feat/motor-soundy . Los hallazgos son de lectura estática, no una auditoría de todas las funcionalidades ni una certificación del despliegue. Confirmar comportamiento con la instancia antes de atribuir diferencias a producción.

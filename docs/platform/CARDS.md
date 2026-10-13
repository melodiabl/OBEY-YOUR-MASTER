# Tarjetas de bienvenida y despedida · incremento local

Continúa T18 y los defectos CARD-04, CARD-05, CARD-06 y CARD-07 del paquete `/home/OBEY_Documentacion`. No se declara terminado T18 ni el contrato general de todas las tarjetas.

## Comportamiento

`handlers/cards.js` expone bienvenida/despedida a través del supervisor de procesos. El dibujo nativo vive en `handlers/card-renderer.js`, cargado por `card-worker.js`. Los renderizadores públicos reciben `data` (username, discriminator, guildName, memberCount), `avatarBuffer` y `backgroundBuffer`; no reciben cliente, token, URL o ruta de medios. Los marcos y fuentes son recursos locales conocidos. Los adaptadores `renderConfiguredWelcomeCard(settings, member, { dm })` y `renderConfiguredLeaveCard` proyectan los datos y reservan el cupo antes de descargar medios. Evento público/DM y ambos slash usan esos adaptadores. Una misma configuración y bytes de medios generan la misma imagen; no se promete igualdad cuando el avatar remoto cambia entre consultas.

Se conservan los campos legacy `pb`, `frame`, `framecolor`, `discriminator`, `membercount`, `servername`, `background` y sus equivalentes con sufijo `dm`. Desactivar `frame` o `pb` se refleja también en el evento; no se reescribe configuración ni se toca canal, mensaje, roles, captcha o invitaciones. Los marcos existentes siguen disponibles. La vista previa deja de añadir un banner/presencia/estilo propio que el evento no generaba.

La textura se compone con opacidad mediante un tile determinista de 128×128; `putImageData` solo escribe ese tile, nunca la tarjeta. Intensidad cero omite la textura. Se mantiene el clip de esquinas y la opacidad del contenido. El fallo anterior de despedida dejaba el centro del avatar con alpha 6; la regresión exige 255, mantiene su color y comprueba los píxeles claros del nombre.

El avatar se recorta desde el centro, conserva proporciones y alpha, y se limita a un círculo tanto con marco como sin él. El contador dice **Miembros actuales**, pues `memberCount` no es un ordinal de ingreso. Los nombres se miden, reducen y truncan con elipsis sin dividir grafemas. La base de ranking queda fuera del fondo automático de bienvenida/despedida: se usan los acentos existentes sobre una base neutra opaca. Una imagen opcional inválida permite continuar con esa base.

Fuentes locales existentes cubren nombres multilingües; se añade el fallback monocromo [Noto Emoji de Google Fonts](https://github.com/google/fonts/tree/main/ofl/notoemoji), con licencia OFL y hashes en `assets/fonts/NotoEmoji-source.json`. No se descargan fuentes al renderizar. No se promete cobertura de cualquier carácter Unicode futuro.

## Verificación

Las pruebas reprodujeron la pérdida de alpha, el fondo inválido sin fallback y un emoji indistinguible del glifo ausente antes de corregirlos. `test/cards.test.js` verifica PNG decodificado, regiones reales de texto/avatar, transparencia, proporciones, flags, igualdad de bytes entre los dos slash y el servicio de evento, ajuste de grafemas y cobertura del emoji usado como regresión. Los transportes externos están sustituidos; no se envía nada a Discord.

```sh
node --test test/cards.test.js
node scripts/verify-cards.js
npm test
node scripts/audit-commands.js
node scripts/validate-commands.js
```

Evidencia en `evidence/cards/renders.json` y ocho PNG generados por los renderizadores usados en producción: avatar opaco/rectangular, avatar transparente, avatar oculto, nombre largo/CJK/emoji, ausencia de marco, despedida con/sin textura e imágenes inválidas. Se inspeccionaron los renders directamente. Los avatares son fixtures gráficos locales, sin datos personales.

Resultado final de la continuación: 363 pruebas pasan, cero fallos y cero skip. El catálogo real sigue validando 812 invocaciones y sus builders. Schemas: 19 raíces, 166 subcomandos/grupos y un standalone; `published=false`. Node 22.23.2 y dependencias locales; las pruebas HTTP/Socket.IO requieren permiso de puerto local. Los ocho renders conservan sus hashes después de separar los datos/medios del SDK y trasladar el dibujo a procesos hijos. La fuente del avatar sintético del verificador se registra explícitamente, sin depender del orden de carga del servicio.

## Ingestión y entrega

`handlers/card-media.js` admite buffers internos o HTTPS de `cdn.discordapp.com` y `media.discordapp.net`, sin credenciales ni otro puerto. No sigue redirecciones. Cada descarga tiene plazo total de cinco segundos y límite de 4 MiB, con control tanto de Content-Length como de bytes recibidos. Las URLs de otros proveedores y las rutas locales libres producen el fondo/avatar de reserva; su configuración guardada se conserva. Esto es una política limitada de compatibilidad con los adjuntos de Discord, no un importador universal de URLs.

Antes de decodificar se inspeccionan firma, dimensiones y límites de contenedor: PNG/JPEG/WebP estáticos, hasta 4096 por lado y 8 Mi píxeles. SVG, GIF, APNG, WebP animado, contenedores truncados y metadatos PNG comprimidos se rechazan; ICCP de WebP se limita a 64 KiB. La inspección no sustituye a un decoder aislado. Fuentes de formato: [PNG de W3C](https://www.w3.org/TR/png-3/#11IHDR) y [contenedor WebP](https://developers.google.com/speed/webp/docs/riff_container).

`handlers/card-delivery.js` conserva texto, campos y footer cuando falla el renderer o falta AttachFiles; si falta EmbedLinks convierte los datos importantes a texto. Comprueba que el canal pertenezca a la guild del evento antes de renderizar o enviar. Refresca el miembro del bot y comprueba ViewChannel/SendMessages antes de renderizar y antes de cada intento de envío. Elimina referencias `attachment://` sin archivo, controla menciones y no modifica el embed original. Bienvenida pública/DM, despedida pública/DM y ambos slash comparten la política de recuperación.

Un rechazo HTTP explícito 400/413/415 del envío con imagen permite un único intento sin archivo. No se reintenta automáticamente tras 403/429/5xx o respuesta de red incierta. Los POST usan el mismo nonce dentro de la operación y enforce_nonce; su deduplicación es temporal, no un historial persistido de eventos. Parámetros contrastados con [Create Message de Discord](https://docs.discord.com/developers/resources/message#create-message). Los logs de recuperación indican dominio y motivo sin URL, token ni contenido; errores de slash son mensajes genéricos.

La prueba del handler registrado de despedida detectó que los títulos españoles fallaban por variables traducidas inexistentes. `handlers/membership-title.js` interpola campos conocidos sin eval y escapa nombres; los cuatro títulos de tarjeta de es.json están corregidos. Las otras rutas legacy con eval no se declaran migradas.

Pruebas adicionales: `test/card-media.test.js` valida transporte acotado, rechazo antes de red, formatos reales de Canvas, timeout y stream truncado. `test/card-delivery.test.js` verifica fallo de render, rechazo de adjunto, falta/revocación de permisos, ausencia de reintento incierto, nonce y handler real registrado con REST ficticio. `test/cards.test.js` ejecuta ambos slash con fallo nativo y exige que conserve el mensaje. `test/membership-title.test.js` comprueba es/en y expresiones desconocidas sin ejecución.

## Procesos y presupuestos

`handlers/card-pool.js` admite un trabajo activo y cuatro esperando. El plazo de cola es dos segundos; preparar los medios tiene 5,5 segundos. Cada tarjeta usa un proceso de una sola operación. Los DTO se verifican en padre/hijo y se rechazan campos privados, funciones, getters, URLs, rutas y buffers mayores de 4 MiB antes de enviarlos. El hijo hereda únicamente LANG y los límites de threads, además de los datos internos del IPC; no hereda credenciales, NODE_OPTIONS o preload de Node.

Linux `/usr/bin/prlimit` impone ocho segundos de CPU, 384 MiB de DATA y cero core dumps. V8 limita su old space a 96 MiB. El supervisor aplica ocho segundos de tiempo transcurrido y vigila RSS hasta 256 MiB; el RSS puede exceder ese valor entre muestras, y DATA no equivale a memoria residente total. Requisitos y distinciones en [ADR 003](adr/003-card-process.md). Docker incluye util-linux; el despliegue posterior del 13 de octubre verificó un render aislado en la imagen nueva y en el contenedor activo.

El cupo se libera después de confirmar la salida del hijo. Timeout, crash, RSS, respuesta inválida o cola llena producen la entrega de texto existente, con un diagnóstico de una lista fija y sin mensajes privados del proceso. No se reintenta el render. Si el kernel no confirma exit tras un segundo de SIGKILL, falla la petición conservando el cupo; no se acumulan más procesos. No se usa un decoder en el bot como fallback de plataforma.

`cards-runtime` inicializa la misma instancia una vez; `stopCards` se espera en el apagado. La preparación tardía no abre procesos después del cierre. Los envíos y las vistas previas no publican fallbacks ni errores tardíos cuando comienza el apagado. El hijo sale también al desconectarse su IPC; CPU/DATA son límites de sistema que permanecen si el padre desaparece.

`test/card-pool.test.js` usa hijos reales para bloqueo, crash, memoria, límites del kernel, entorno, validación, FIFO, expiración, preparación y cierre. `test/card-runtime.test.js` comprueba que una API Canvas rota en el padre no impida el render, que la admisión preceda a la descarga y que un hijo bloqueado entregue texto una sola vez. El script `node scripts/verify-card-isolation.js` genera `evidence/cards/isolation.json`: PNG real, tics observados en el padre, recuperaciones y salida confirmada de los procesos propios. Ninguna llamada real a Discord, OAuth o DB.

## Fondos privados y vista previa web

El acceso **Tarjetas** del servidor abre `/cards/:guildId`. Permite subir PNG/JPEG/WebP estático, gestionar hasta tres fondos privados, probar un nombre y elegir bienvenida/despedida pública o DM. Subir y previsualizar no activan la imagen; **Usar este fondo** guarda la selección de ese destino con revisión. Borrar requiere una confirmación visible y rechaza fondos utilizados. Las opciones **Fondo predeterminado** y **Fondo anterior del bot** permiten quitar la referencia privada o recuperar la configuración legacy.

CardAssetsSchema guarda los PNG normalizados fuera de Guild/SyncMap, con ownership por guild y hasta 4 MiB por archivo. No hay carpeta pública de uploads. Las lecturas tienen sesión, OAuth y ManageGuild frescos; las mutaciones/preview necesitan CSRF. Upload usa cuerpo application/octet-stream con límite de 4 MiB, diez segundos para lectura y dos operaciones HTTP simultáneas. La conexión abortada no libera ese cupo mientras continúa el trabajo. La autorización se revisa otra vez antes del commit de upload y después de renderizar un preview. Nombre de archivo y nombre de prueba se muestran como texto, sin HTML ejecutable.

Los fondos no usados caducan a los siete días; los activos se mantienen mediante una concesión de treinta días renovada con el bot conectado y DB lista. Limpieza horaria, TTL y purga GuildDelete completan la retirada, con las limitaciones temporales descritas en [ADR 004](adr/004-private-card-backgrounds.md). El selector y los assets comparten una escritura atómica y revisión con generación. Mongo real confirmó buffers, conflictos entre instancias, renovación sin conflicto de revisión y eliminación protegida.

Discord, ambos slash y la web comparten el adaptador. La prueba HTTP activa un upload y exige bytes idénticos entre preview y render del bot. Los fondos se ajustan con recorte centrado y mantienen proporciones. Canal, mensaje, DM, avatar y marcos siguen leyendo los valores existentes; activar un fondo no configura esos campos.

API: GET `/api/cards/:guildId`, GET `/api/cards/:guildId/assets/:assetId`, POST `/api/cards/:guildId/assets?name=...&revision=...` con binario; PUT `/api/cards/:guildId/selection` con slot/assetId/revision; DELETE asset con revision; POST preview con slot/assetId/name. Slots: welcome, welcomeDm, leave, leaveDm. Las respuestas de listado solo incluyen metadatos; los bytes y previews usan Cache-Control private,no-store. Conflictos/quota/uso devuelven 409, formato 422, tamaño 413, permisos 403 y fallo de almacenamiento/servicio 503, sin detalles privados.

Pruebas: `test/card-assets.test.js` y `test/cards-api.test.js` cubren scopes, cuota, revisiones, recreación, expiración, permisos, CSRF, preview sin escrituras, igualdad de render y cliente desconectado. `scripts/verify-card-assets.js` requiere una URL loopback a `obey_cards_test`, limpia solo su guild única y verifica Mongo real. `scripts/serve-cards-fixture.js` y `verify-cards-browser.js` verifican en Chromium subida inválida/válida, XSS tratado como texto, preview, activación, borrado, revocación, foco y 320/768/1024/1440; cero errores de página. Evidencia: `evidence/cards-web`. El MCP de Chrome no arranca como root; se usó Playwright ya instalado. Se corrigió la carga del script propio antes del feedback genérico del formulario para poder reintentar una imagen rechazada.

Estas imágenes se guardan para las tarjetas por servidor. Son fondos privados distintos de los emojis del portal. La carga independiente de las 82 entradas de aplicación se completó el 13 de octubre, según [ASSETS.md](ASSETS.md).

## Continuación

Verificación de recorridos de usuario en Discord y OAuth reales, medición en producción para ajustar presupuestos y política periódica de copias de seguridad del entorno. Despliegue/reinicio y copia de esta entrega completados. No se afirma un sandbox de red/sistema de archivos: los hijos comparten UID y acceso a recursos locales con el bot. Los previews legacy internos de los comandos `setup-welcome`/`setup-leave` no se declaran migrados. Tampoco se añaden editor libre, templates declarativos, tarjetas de perfil/nivel/evento ni corrección CARD-08 de adjuntos de ranking. Esos criterios siguen pendientes.

El bot se desplegó posteriormente el 13 de octubre desde el snapshot d840e4f. El contenedor activo tiene CardAssets con índices únicos/TTL y produjo un PNG mediante el worker; las rutas privadas deniegan acceso sin sesión y los recursos JS/CSS públicos responden. Estos checks no equivalen a un upload mediante OAuth real ni a un evento de bienvenida real. Evidencia, respaldo y reversión operativa en [RELEASE-2026-10-13.md](RELEASE-2026-10-13.md).

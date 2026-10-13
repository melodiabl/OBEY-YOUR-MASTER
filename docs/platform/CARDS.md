# Tarjetas de bienvenida y despedida · incremento local

Continúa T18 y los defectos CARD-04, CARD-05, CARD-06 y CARD-07 del paquete `/home/OBEY_Documentacion`. No se declara terminado T18 ni el contrato general de todas las tarjetas.

## Comportamiento

`handlers/cards.js` concentra el render de bienvenida y despedida, el recorte de avatar, el ajuste de nombres y la textura. Sus renderizadores reciben `data` (username, discriminator, guildName, memberCount), `avatarBuffer` y `backgroundBuffer`; no reciben cliente, token, URL o ruta de medios. Los marcos y fuentes son recursos locales conocidos. Los adaptadores `renderConfiguredWelcomeCard(settings, member, { dm })` y `renderConfiguredLeaveCard` proyectan los datos y cargan los medios antes de invocar el renderer. Evento público/DM y ambos slash usan esos adaptadores. Una misma configuración y bytes de medios generan la misma imagen; no se promete igualdad cuando el avatar remoto cambia entre consultas.

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

Resultado final de la continuación: 335 pruebas pasan, cero fallos y cero skip. El catálogo real sigue validando 812 invocaciones y sus builders. Schemas: 19 raíces, 166 subcomandos/grupos y un standalone; `published=false`. Node 22.23.2 y dependencias locales; la prueba Socket.IO requiere permiso de puerto local. Los ocho renders conservan sus hashes después de separar los datos y medios del SDK.

## Ingestión y entrega

`handlers/card-media.js` admite buffers internos o HTTPS de `cdn.discordapp.com` y `media.discordapp.net`, sin credenciales ni otro puerto. No sigue redirecciones. Cada descarga tiene plazo total de cinco segundos y límite de 4 MiB, con control tanto de Content-Length como de bytes recibidos. Las URLs de otros proveedores y las rutas locales libres producen el fondo/avatar de reserva; su configuración guardada se conserva. Esto es una política limitada de compatibilidad con los adjuntos de Discord, no un importador universal de URLs.

Antes de decodificar se inspeccionan firma, dimensiones y límites de contenedor: PNG/JPEG/WebP estáticos, hasta 4096 por lado y 8 Mi píxeles. SVG, GIF, APNG, WebP animado, contenedores truncados y metadatos PNG comprimidos se rechazan; ICCP de WebP se limita a 64 KiB. La inspección no sustituye a un decoder aislado. Fuentes de formato: [PNG de W3C](https://www.w3.org/TR/png-3/#11IHDR) y [contenedor WebP](https://developers.google.com/speed/webp/docs/riff_container).

`handlers/card-delivery.js` conserva texto, campos y footer cuando falla el renderer o falta AttachFiles; si falta EmbedLinks convierte los datos importantes a texto. Comprueba que el canal pertenezca a la guild del evento antes de renderizar o enviar. Refresca el miembro del bot y comprueba ViewChannel/SendMessages antes de renderizar y antes de cada intento de envío. Elimina referencias `attachment://` sin archivo, controla menciones y no modifica el embed original. Bienvenida pública/DM, despedida pública/DM y ambos slash comparten la política de recuperación.

Un rechazo HTTP explícito 400/413/415 del envío con imagen permite un único intento sin archivo. No se reintenta automáticamente tras 403/429/5xx o respuesta de red incierta. Los POST usan el mismo nonce dentro de la operación y enforce_nonce; su deduplicación es temporal, no un historial persistido de eventos. Parámetros contrastados con [Create Message de Discord](https://docs.discord.com/developers/resources/message#create-message). Los logs de recuperación indican dominio y motivo sin URL, token ni contenido; errores de slash son mensajes genéricos.

La prueba del handler registrado de despedida detectó que los títulos españoles fallaban por variables traducidas inexistentes. `handlers/membership-title.js` interpola campos conocidos sin eval y escapa nombres; los cuatro títulos de tarjeta de es.json están corregidos. Las otras rutas legacy con eval no se declaran migradas.

Pruebas adicionales: `test/card-media.test.js` valida transporte acotado, rechazo antes de red, formatos reales de Canvas, timeout y stream truncado. `test/card-delivery.test.js` verifica fallo de render, rechazo de adjunto, falta/revocación de permisos, ausencia de reintento incierto, nonce y handler real registrado con REST ficticio. `test/cards.test.js` ejecuta ambos slash con fallo nativo y exige que conserve el mensaje. `test/membership-title.test.js` comprueba es/en y expresiones desconocidas sin ejecución.

## Continuación

Verificación en Discord real y OAuth real; almacenamiento/retención y referencias de uploads con propietario por guild; worker/proceso de render con presupuesto de CPU/memoria y concurrencia, capaz de terminar un decode bloqueado. El plazo de descarga no es un plazo del decoder nativo. Los previews legacy internos de los comandos `setup-welcome`/`setup-leave` no se declaran migrados. Tampoco se añaden editor libre, templates declarativos, nuevo preview web, tarjetas de perfil/nivel/evento ni corrección CARD-08 de adjuntos de ranking. Esos criterios siguen pendientes.

No se inició, reinició o desplegó el bot. Reversión: revertir el commit de este incremento junto con sus consumidores, conservando los cambios locales anteriores de Architect.

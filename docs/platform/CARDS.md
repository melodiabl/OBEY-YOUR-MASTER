# Tarjetas de bienvenida y despedida · incremento local

Continúa T18 y los defectos CARD-04, CARD-05, CARD-06 y CARD-07 del paquete `/home/OBEY_Documentacion`. No se declara terminado T18 ni el contrato general de todas las tarjetas.

## Comportamiento

`handlers/cards.js` concentra el render de bienvenida y despedida, el recorte de avatar, el ajuste de nombres y la textura. El evento público, el DM y `/welcome tarjeta` y `/welcome test` usan `renderConfiguredWelcomeCard(settings, member, { dm })`. Las vistas previas generan los mismos bytes que la bienvenida para una misma configuración. La composición específica del transporte (embed/mensaje/destino) permanece en cada consumidor.

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

Resultado final: 316 pruebas pasan, cero fallos y cero skip. Auditoría: 811 comandos cargados sin errores/conflictos. Schemas: 19 raíces, 166 subcomandos/grupos y un standalone; `published=false`. Node 22.23.2 y dependencias locales; la prueba Socket.IO requiere permiso de puerto local.

## Continuación

Verificación en Discord real, fallback de entrega si falla el renderer completo o el adjunto, acceso/retención de uploads por guild, DTO de medios validado con límites antes de decodificar y worker sin descarga de URLs. Este incremento conserva la carga legacy de avatar/fondo por Canvas; no certifica su aislamiento ni su límite de memoria/red. Tampoco añade editor libre, templates declarativos, nuevo preview web, tarjetas de perfil/nivel/evento ni corrección CARD-08 de adjuntos de ranking. Esos criterios siguen pendientes.

No se inició, reinició o desplegó el bot. Reversión: revertir el commit de este incremento junto con sus consumidores, conservando los cambios locales anteriores de Architect.

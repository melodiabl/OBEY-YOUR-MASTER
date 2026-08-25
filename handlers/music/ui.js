// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Motor de música v2: UI del Now Playing (port de Soundy SetupEmbed.ts).
// Fusión: layout de Soundy (imagen grande, ## título, "termina en", botones
// solo-emoji animados) + ventajas de OBEY (barra de progreso, color por plataforma).
// customIds con prefijo `m2_` para no chocar con el motor actual (`mp_`).
// ─────────────────────────────────────────────────────────────────────────────
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { fmtMs, progressBar, platform } = require('../music/utils')
const { config } = require('./config')

const E = config.emoji

// Iconos de plataforma (emojis subidos) por sourceName
function sourceIcon(sourceName = '') {
  const s = String(sourceName).toLowerCase()
  if (s.includes('spotify'))     return E.music   // (no subimos icono spotify en este set)
  if (s.includes('youtube'))     return E.music
  if (s.includes('apple'))       return E.music
  if (s.includes('soundcloud'))  return E.music
  if (s.includes('deezer'))      return E.music
  return E.music
}

// Construye { embeds, components } del Now Playing.
// `state` usa la forma de OBEY (currentTrack{info}, paused, loop, volume, queue, shuffle, autoplay).
function buildNowPlaying(client, state, positionMs = null) {
  const track = state?.currentTrack
  if (!track) {
    return {
      embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(`${E.music} Sin música reproduciéndose.`)],
      components: [],
    }
  }

  const info   = track.info || track
  const title  = info.title  || 'Sin título'
  const author = info.author || 'Desconocido'
  const uri    = /^https?:\/\//i.test(info.uri || '') ? info.uri : null
  const art    = info.artworkUrl || info.thumbnail || null
  const dur    = info.length || 0
  const isStream = !!info.isStream
  const req    = info.requester || 'Desconocido'
  const plat   = platform(info.catalogUri || info.uri || '', info.catalogSourceName || info.sourceName || '')

  const pos = positionMs !== null ? positionMs
            : state.startedAt && !state.paused ? Math.min(dur, Date.now() - state.startedAt)
            : (state.lastPosition || 0)

  const durationText = isStream ? '🔴 LIVE' : `\`${fmtMs(dur)}\``
  const finishText   = isStream ? '—' : `<t:${Math.floor((Date.now() + (dur - pos)) / 1000)}:R>`

  const embed = new EmbedBuilder()
    .setColor(state.paused ? 0x4f545c : plat.color)
    .setAuthor({ name: state.paused ? 'Pausado' : 'Reproduciendo ahora', iconURL: 'https://cdn.darrennathanael.com/icons/spinning_disk.gif' })
    .setDescription(`## ${uri ? `[${title}](${uri})` : title}\n${progressBar(pos, dur)}  \`${fmtMs(pos)} / ${isStream ? 'LIVE' : fmtMs(dur)}\``)
    .addFields(
      { name: `${E.artist} Artista`,  value: `\`${author}\``, inline: true },
      { name: `${E.clock} Duración`,  value: durationText,    inline: true },
      { name: `${E.user} Pedido por`, value: `${req}`,        inline: true },
      { name: `${E.list} Volumen`,    value: `\`${state.volume ?? 100}%\``, inline: true },
      { name: `${E.loop} Loop`,       value: `\`${state.loop === 'none' ? 'off' : state.loop}\``, inline: true },
      { name: `${E.clock} Termina`,   value: finishText,      inline: true },
    )
    .setTimestamp()
  if (art) embed.setImage(art)

  const b = (id, emo, style = ButtonStyle.Secondary, disabled = false) =>
    new ButtonBuilder().setCustomId(id).setEmoji(emo).setStyle(style).setDisabled(disabled)

  const row1 = new ActionRowBuilder().addComponents(
    b('m2_shuffle',  E.shuffle, state.shuffle ? ButtonStyle.Success : ButtonStyle.Secondary),
    b('m2_previous', E.previous, ButtonStyle.Secondary, !state.history?.length),
    b('m2_pause',    state.paused ? E.play : E.pause, state.paused ? ButtonStyle.Success : ButtonStyle.Secondary),
    b('m2_skip',     E.skip),
    b('m2_loop',     E.loop, state.loop !== 'none' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  )
  const row2 = new ActionRowBuilder().addComponents(
    b('m2_lyrics',  E.list),
    b('m2_voldown', E.volDown, ButtonStyle.Secondary, (state.volume ?? 100) <= 0),
    b('m2_stop',    E.stop, ButtonStyle.Danger),
    b('m2_volup',   E.volUp, ButtonStyle.Secondary, (state.volume ?? 100) >= 200),
    b('m2_queue',   E.folder),
  )
  const row3 = new ActionRowBuilder().addComponents(
    b('m2_like',     E.heart),
    b('m2_autoplay', E.music, state.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
  )

  return { embeds: [embed], components: [row1, row2, row3] }
}

module.exports = { buildNowPlaying, sourceIcon }

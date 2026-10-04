const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { trackArtwork, fmtMs, progressBar, platform, loopEmoji, volEmoji, filterLabel, MUSIC_ICON } = require('./utils')
const { config } = require('../music/config')
const E = config.emoji

const { buildControls } = require('./controls')

function buildNPEmbed(client, guildId, state, positionMs = null) {
  const track = state.currentTrack
  if (!track) return new EmbedBuilder().setColor(0x2b2d31).setDescription('⏹️ Sin música reproduciendo.')

  const info = track.info || track
  const plug = track.pluginInfo || {}

  const title       = info.title       || 'Sin título'
  const artist      = info.author      || plug.author || plug.artist || 'Artista desconocido'
  const albumName   = info.albumName   || plug.albumName  || plug.album  || null
  const releaseDate = info.releaseDate || plug.releaseDate || null
  const releaseYear = releaseDate ? String(releaseDate).slice(0, 4) : null

  const linkUri = /^https?:\/\//i.test(info.catalogUri || '') ? info.catalogUri
                : /^https?:\/\//i.test(info.uri || '')        ? info.uri : null
  const art = trackArtwork(track)
  const req = info.requester  || 'Desconocido'
  const dur = info.length     || 0

  const plat = platform(info.catalogUri || info.uri || '', info.catalogSourceName || info.sourceName || '')

  const pos = positionMs !== null
    ? positionMs
    : state.startedAt && !state.paused
      ? Math.min(dur, Date.now() - state.startedAt)
      : (state.lastPosition || 0)

  const bar    = progressBar(pos, dur)
  const active = filterLabel(state.filter)
  const isStream = !!info.isStream

  const indicators = []
  if (active)          indicators.push(`🎛️ ${active}`)
  if (state.autoplay)  indicators.push(`${E.music} Autoplay`)
  if (state.shuffle)   indicators.push(`${E.shuffle} Mezclar`)
  if (state.radioMode) indicators.push('📻 Radio')

  const titleLine  = linkUri ? `[${title}](${linkUri})` : title
  const finishText = isStream ? '🔴 LIVE' : `<t:${Math.floor((Date.now() + (dur - pos)) / 1000)}:R>`

  const embed = new EmbedBuilder()
    .setColor(state.paused ? 0x4f545c : plat.color)
    .setAuthor({ name: state.paused ? 'Pausado' : 'Reproduciendo ahora', iconURL: MUSIC_ICON })
    .setDescription(`## ${titleLine}\n${bar}  \`${fmtMs(pos)} / ${isStream ? 'LIVE' : fmtMs(dur)}\`${indicators.length ? `\n\n${indicators.join('  ·  ')}` : ''}`)
    .addFields(
      { name: `${E.artist} Artista`,  value: `\`${artist.slice(0, 45)}\``,                inline: true },
      { name: `${E.clock} Duración`,  value: isStream ? '🔴 LIVE' : `\`${fmtMs(dur)}\``,  inline: true },
      { name: `${E.user} Pedido por`, value: `${req}`.slice(0, 40),                       inline: true },
      { name: `${E.list} Volumen`,    value: `\`${state.volume ?? 100}%\``,               inline: true },
      { name: `${E.loop} Loop`,       value: `\`${state.loop === 'none' ? 'off' : state.loop === 'track' ? 'canción' : 'cola'}\``, inline: true },
      { name: `${E.clock} Termina`,   value: finishText,                                 inline: true },
    )
  if (art) embed.setImage(art)

  const next = state.queue[0]?.info || state.queue[0]
  if (next?.title) {
    embed.addFields({ name: `${E.folder} En cola (${state.queue.length})  ·  Siguiente`,
      value: /^https?:\/\//i.test(next.uri || '') ? `[${next.title.slice(0, 55)}](${next.uri})` : next.title.slice(0, 55), inline: false })
  } else {
    embed.addFields({ name: `${E.folder} En cola`, value: `\`${state.queue.length}\` pistas`, inline: false })
  }
  return embed
}

// Keep the row helpers for existing callers; every view uses the same control contract.
const buildRow1 = state => buildControls(state)[0]
const buildRow2 = state => buildControls(state)[1]
const buildRow3 = state => buildControls(state)[2]

function buildQueueEmbed(state, page = 1) {
  const PER_PAGE = 10
  const q      = state.queue
  const total  = q.length
  const pages  = Math.max(1, Math.ceil(total / PER_PAGE))
  const p      = Math.max(1, Math.min(page, pages))
  const start  = (p - 1) * PER_PAGE
  const slice  = q.slice(start, start + PER_PAGE)
  const totalMs = q.reduce((a, t) => a + (t.info?.length || 0), 0)

  const cur     = state.currentTrack
  const curInfo = cur?.info || cur
  const curArt  = curInfo?.artworkUrl || curInfo?.thumbnail || null
  const curUri  = /^https?:\/\//i.test(curInfo?.catalogUri || '') ? curInfo.catalogUri
                : /^https?:\/\//i.test(curInfo?.uri || '')        ? curInfo.uri : ''
  const curPlat = platform(curInfo?.catalogUri || curInfo?.uri || '', curInfo?.catalogSourceName || curInfo?.sourceName || '')

  const lines = []
  if (curInfo) {
    lines.push(`**${E.play} Reproduciendo ahora**`)
    lines.push(curUri
      ? `[${(curInfo.title || '?').substring(0, 60)}](${curUri}) — \`${fmtMs(curInfo.length)}\``
      : `${(curInfo.title || '?').substring(0, 60)} — \`${fmtMs(curInfo.length)}\``)
    lines.push(`${E.artist} ${(curInfo.author || '—').substring(0, 45)}${curInfo.albumName ? `  ·  ${E.music} ${curInfo.albumName.substring(0, 40)}` : ''}`)
    lines.push('')
  }
  if (total === 0) {
    lines.push('_La cola está vacía_')
  } else {
    lines.push(`**Cola — ${total} pista${total !== 1 ? 's' : ''}  ·  ⏱ \`${fmtMs(totalMs)}\`**`)
    lines.push('')
    for (const [i, t] of slice.entries()) {
      const info = t.info || t
      const tUri = /^https?:\/\//i.test(info.catalogUri || '') ? info.catalogUri
                 : /^https?:\/\//i.test(info.uri || '')        ? info.uri : ''
      const tName = (info.title || '?').length > 48 ? (info.title || '?').slice(0, 45) + '…' : (info.title || '?')
      lines.push(tUri
        ? `\`${start + i + 1}.\` [${tName}](${tUri}) — \`${fmtMs(info.length)}\``
        : `\`${start + i + 1}.\` ${tName} — \`${fmtMs(info.length)}\``)
    }
  }

  const embed = new EmbedBuilder()
    .setColor(curPlat.color)
    .setAuthor({ name: 'Cola de reproducción', iconURL: MUSIC_ICON })
    .setTitle(`${E.folder} Cola  ·  página ${p}/${pages}`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Página ${p}/${pages}` })
  if (curArt) embed.setThumbnail(curArt)
  return embed
}

function buildQueueRows(page, totalPages) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`mq_prev:${page}`).setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId('mq_close').setLabel('Cerrar').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`mq_next:${page}`).setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages),
  )]
}

module.exports = { buildNPEmbed, buildRow1, buildRow2, buildRow3, buildControls, buildQueueEmbed, buildQueueRows }

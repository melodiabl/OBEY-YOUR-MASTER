const Emojis = require('../utils/emojis')
const Format = require('../utils/formatter')
const { formatDuration } = require('../utils/timeFormat')
const { getGuildUiConfig, embed, okEmbed, warnEmbed, headerLine } = require('../core/ui/uiKit')

function loopLabel (mode) {
  if (mode === 'track') return 'Canción'
  if (mode === 'queue') return 'Cola'
  return 'Desactivado'
}

function loopEmoji (mode) {
  if (mode === 'track') return '🔂'
  if (mode === 'queue') return '🔁'
  return Emojis.arrow
}

function safeRequestedBy (track) {
  const id = track?.requestedBy?.id
  if (id) return `<@${id}>`
  return track?.requestedBy?.tag ? Format.inlineCode(track.requestedBy.tag) : Format.inlineCode('n/a')
}

function sumDurations (tracks) {
  return (Array.isArray(tracks) ? tracks : []).reduce((acc, t) => acc + (Number(t?.duration) || 0), 0)
}

function buildStoppedEmbed ({ ui, reason } = {}) {
  return warnEmbed({
    ui,
    system: 'music',
    title: 'Sesión detenida',
    lines: [
      reason ? `${Emojis.dot} ${reason}` : null,
      `${Emojis.dot} Usa ${Format.inlineCode('/play')} para volver a reproducir.`,
      `${Emojis.dot} Tip: ${Format.inlineCode('/queue')} para ver el estado.`
    ].filter(Boolean),
    signature: 'Música'
  })
}

async function buildNowPlayingEmbed ({ client, guildId, state, positionMs = 0 } = {}) {
  const ui = await getGuildUiConfig(client, guildId)

  const current = state?.currentTrack || null
  if (!current) return buildStoppedEmbed({ ui, reason: 'No hay música reproduciéndose.' })

  const pos = Math.max(0, Number(positionMs) || 0)
  const dur = Math.max(0, Number(current.duration) || 0)

  const statusEmoji = state.isPaused ? Emojis.idle : Emojis.online
  const statusText = state.isPaused ? 'Pausado' : 'Reproduciendo'

  const upcoming = Array.isArray(state.queue) ? state.queue : []
  const next = upcoming[0] || null
  const remaining = Math.max(0, dur - pos)
  const totalRemaining = remaining + sumDurations(upcoming)

  const voice = state.voiceChannelId ? `<#${state.voiceChannelId}>` : Format.inlineCode('n/a')

  return embed({
    ui,
    system: 'music',
    kind: state.isPaused ? 'info' : 'success',
    title: `${statusEmoji} ${statusText}`,
    description: [
      headerLine(Emojis.music, 'Now Playing'),
      Format.h3(`[${current.title}](${current.uri})`),
      `${Emojis.dot} *${current.author}*`,
      Format.softDivider(20),
      `${Emojis.dot} ${Emojis.voice} **Voz:** ${voice}`,
      `${Emojis.dot} ${Emojis.loading} **Duración:** ${Format.inlineCode(formatDuration(dur))}`,
      `${Emojis.dot} ${Emojis.member} **Requester:** ${safeRequestedBy(current)}`,
      `${Emojis.dot} ${loopEmoji(state.loop)} **Loop:** ${Format.inlineCode(loopLabel(state.loop))}`,
      `${Emojis.dot} ${Emojis.volume} **Volumen:** ${Format.inlineCode(`${state.volume}%`)}`,
      Format.softDivider(20),
      `${Emojis.dot} ${Emojis.stats} **Progreso:** ${Format.progressBar(pos, dur || 1, 15)}`,
      `${Emojis.dot} ${Emojis.loading} ${Format.inlineCode(`${formatDuration(pos)} / ${formatDuration(dur)}`)}`,
      Format.softDivider(20),
      next ? `${Emojis.dot} **Siguiente:** ${Format.inlineCode(next.title)} (${Format.inlineCode(formatDuration(next.duration))})` : `${Emojis.dot} *No hay siguiente track.*`,
      `${Emojis.dot} **Restante total:** ${Format.inlineCode(formatDuration(totalRemaining))}`
    ].join('\n'),
    thumbnail: current.thumbnail || null,
    signature: 'Controles abajo'
  })
}

async function buildPlayResultEmbed ({ client, guildId, res, voiceChannelId } = {}) {
  const ui = await getGuildUiConfig(client, guildId)

  if (res?.isPlaylist) {
    const label = res.collectionType === 'playlist' ? 'Playlist' : 'Colección'
    return okEmbed({
      ui,
      system: 'music',
      title: `${Emojis.music} ${label} agregada`,
      lines: [
        `${Emojis.dot} **Nombre:** ${Format.inlineCode(res.playlistName || 'Desconocida')}`,
        `${Emojis.dot} **Tracks:** ${Format.inlineCode(res.trackCount)}`,
        voiceChannelId ? `${Emojis.dot} **Voz:** <#${voiceChannelId}>` : null,
        `${Emojis.dot} Estado: ${res.started ? Format.bold('Reproduciendo') : Format.bold('En cola')}`
      ].filter(Boolean),
      signature: 'Listo'
    })
  }

  const track = res?.track
  if (!track) {
    return warnEmbed({
      ui,
      system: 'music',
      title: 'Sin resultados',
      lines: ['No se encontró ninguna pista para reproducir.']
    })
  }

  const statusTitle = res.started ? `${Emojis.success} Reproduciendo ahora` : `${Emojis.music} Agregado a la cola`
  const position = res.started ? 0 : Number(res.position || 0)
  const voice = voiceChannelId ? `<#${voiceChannelId}>` : (res?.state?.voiceChannelId ? `<#${res.state.voiceChannelId}>` : Format.inlineCode('n/a'))

  return embed({
    ui,
    system: 'music',
    kind: res.started ? 'success' : 'info',
    title: statusTitle,
    description: [
      headerLine(Emojis.music, res.started ? 'Reproducción' : 'Encolado'),
      Format.h3(`[${track.title}](${track.uri})`),
      `${Emojis.dot} *${track.author}*`,
      Format.softDivider(20),
      `${Emojis.dot} ${Emojis.voice} **Voz:** ${voice}`,
      `${Emojis.dot} ${Emojis.loading} **Duración:** ${Format.inlineCode(formatDuration(track.duration))}`,
      `${Emojis.dot} ${Emojis.member} **Requester:** ${safeRequestedBy(track)}`,
      `${Emojis.dot} 📍 **Posición:** ${Format.inlineCode(position)}`,
      Format.softDivider(20),
      `${Emojis.dot} ${loopEmoji(res?.state?.loop)} **Loop:** ${Format.inlineCode(loopLabel(res?.state?.loop))}`,
      `${Emojis.dot} ${Emojis.volume} **Volumen:** ${Format.inlineCode(`${res?.state?.volume ?? 100}%`)}`
    ].join('\n'),
    thumbnail: track.thumbnail || null,
    signature: 'Acciones disponibles'
  })
}

async function buildQueueEmbed ({ client, guildId, state, positionMs = 0, page = 1, pageSize = 8 } = {}) {
  const ui = await getGuildUiConfig(client, guildId)
  const current = state?.currentTrack || null
  const upcoming = Array.isArray(state?.queue) ? state.queue : []
  const total = (current ? 1 : 0) + upcoming.length

  if (!current && !upcoming.length) {
    return warnEmbed({
      ui,
      system: 'music',
      title: 'Cola vacía',
      lines: [
        `${Emojis.dot} No hay canciones en la cola.`,
        `${Emojis.dot} Usa ${Format.inlineCode('/play')} para agregar música.`
      ],
      signature: 'Música'
    })
  }

  const pos = Math.max(0, Number(positionMs) || 0)
  const dur = Math.max(0, Number(current?.duration) || 0)
  const remaining = current ? Math.max(0, dur - pos) : 0
  const totalRemaining = remaining + sumDurations(upcoming)

  const safePageSize = Math.max(3, Math.min(15, Number(pageSize) || 8))
  const maxPages = Math.max(1, Math.ceil(upcoming.length / safePageSize))
  const p = Math.max(1, Math.min(maxPages, Number(page) || 1))
  const start = (p - 1) * safePageSize
  const slice = upcoming.slice(start, start + safePageSize)

  const voice = state.voiceChannelId ? `<#${state.voiceChannelId}>` : Format.inlineCode('n/a')

  const nextLines = slice.map((t, idx) => {
    const i = start + idx + 1
    const req = safeRequestedBy(t)
    const dur = Format.inlineCode(formatDuration(t.duration))
    return `${Format.inlineCode(i)} ${Emojis.dot} [${t.title}](${t.uri})\n${Emojis.dot} ${Format.italic(t.author)} • ${dur} • ${req}`
  })

  return embed({
    ui,
    system: 'music',
    kind: 'info',
    title: `${Emojis.music} Cola`,
    description: [
      headerLine(Emojis.music, 'Estado'),
      `${Emojis.dot} ${Emojis.voice} **Voz:** ${voice}`,
      `${Emojis.dot} ${loopEmoji(state.loop)} **Loop:** ${Format.inlineCode(loopLabel(state.loop))}`,
      `${Emojis.dot} ${Emojis.volume} **Volumen:** ${Format.inlineCode(`${state.volume}%`)}`,
      `${Emojis.dot} ${Emojis.stats} **Total tracks:** ${Format.inlineCode(total)}`,
      `${Emojis.dot} ⏳ **Restante total:** ${Format.inlineCode(formatDuration(totalRemaining))}`,
      Format.softDivider(20),
      current
        ? [
          `${Emojis.online} **Ahora:** [${current.title}](${current.uri})`,
          `${Emojis.dot} ${Format.italic(current.author)} • ${Format.inlineCode(formatDuration(current.duration))} • ${safeRequestedBy(current)}`,
          `${Emojis.dot} ${Emojis.stats} Progreso: ${Format.progressBar(pos, dur || 1, 15)} ${Format.inlineCode(`${formatDuration(pos)} / ${formatDuration(dur)}`)}`
        ].join('\n')
        : `${Emojis.offline} *No hay track actual.*`,
      Format.softDivider(20),
      `${Emojis.category} **Siguientes:** ${Format.inlineCode(upcoming.length)} (página ${Format.inlineCode(`${p}/${maxPages}`)})`,
      nextLines.length ? nextLines.join('\n') : `${Emojis.dot} *No hay siguientes tracks.*`
    ].join('\n'),
    thumbnail: current?.thumbnail || null,
    signature: `Tip: /queue página ${Math.min(maxPages, p + 1)}`
  })
}

module.exports = {
  buildStoppedEmbed,
  buildNowPlayingEmbed,
  buildPlayResultEmbed,
  buildQueueEmbed
}


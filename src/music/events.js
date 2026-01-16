const idleTimers = new Map()

function clearIdleTimer (guildId) {
  const t = idleTimers.get(guildId)
  if (t) clearTimeout(t)
  idleTimers.delete(guildId)
}

function getTextChannel (queue) {
  const channel = queue?.metadata?.channel
  if (!channel || typeof channel.send !== 'function') return null
  return channel
}

function registerPlayerEvents (player) {
  if (player.__musicEventsInstalled) return
  player.__musicEventsInstalled = true

  function formatPlayerError (error) {
    const msg = String(error?.message || error || '').trim()
    if (!msg) return 'Error desconocido.'

    if (msg.startsWith('Could not extract stream for this track')) {
      const lines = msg.split('\n').map(l => l.trim()).filter(Boolean)
      const detail = lines.find(l => l.startsWith('Error:')) || null
      const detailText = detail ? ` (${detail.replace(/^Error:\\s*/, '')})` : ''
      return `No pude extraer audio de YouTube${detailText}. Si pasa seguido: prueba \`YOUTUBE_STREAM_CLIENT_TYPE=IOS\` (sin cookies) o habilita cookies con \`YOUTUBE_USE_COOKIES=1\` + \`YOUTUBE_STREAM_CLIENT_TYPE=WEB\` (y opcional \`YOUTUBE_GENERATE_PO_TOKEN=1\`).`
    }

    return msg
  }

  // playerStart
  player.events.on('playerStart', (queue, track) => {
    clearIdleTimer(queue.id)
    const channel = getTextChannel(queue)
    if (channel) channel.send(`Reproduciendo: **${track.title}**`)
  })

  // playerFinish
  player.events.on('playerFinish', (queue, track) => {
    const channel = getTextChannel(queue)
    if (channel) channel.send(`Termino: **${track.title}**`)
  })

  // emptyQueue (no destruir player/queue; solo desconectar tras inactividad)
  player.events.on('emptyQueue', (queue) => {
    const channel = getTextChannel(queue)
    if (channel) channel.send('La cola termino. Me desconecto en 2 minutos si no agregan mas musica.')

    clearIdleTimer(queue.id)
    const timer = setTimeout(() => {
      try {
        if (queue.deleted) return
        if (queue.node.isPlaying()) return
        if (!queue.tracks.isEmpty()) return
        queue.disconnect()
      } catch {}
    }, 120000)

    idleTimers.set(queue.id, timer)
  })

  // disconnect
  player.events.on('disconnect', (queue) => {
    clearIdleTimer(queue.id)
    const channel = getTextChannel(queue)
    if (channel) channel.send('Desconectado del canal de voz.')
  })

  // queueDelete (cleanup)
  player.events.on('queueDelete', (queue) => {
    clearIdleTimer(queue.id)
  })

  // error
  player.events.on('error', (queue, error) => {
    const channel = getTextChannel(queue)
    if (channel) channel.send(`Error: ${error?.message || error}`)
  })

  // playerError (streaming)
  player.events.on('playerError', (queue, error) => {
    const channel = getTextChannel(queue)
    if (channel) channel.send(`Error al reproducir: ${formatPlayerError(error)}`)
  })
}

module.exports = {
  registerPlayerEvents
}

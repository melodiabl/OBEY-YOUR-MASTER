const { createHash } = require('node:crypto')
function createPlaybackHealth(guildId, player, { now = Date.now, write = (level, row) => console[level]('[Music] Playback health:', JSON.stringify(row)) } = {}) {
  const guild = createHash('sha256').update(String(guildId)).digest('hex').slice(0, 12)
  let last = -Infinity, previousWarning
  const finite = value => Number.isFinite(value) && value >= 0 ? value : null
  return data => {
    const state = data?.state || {}, ping = finite(state.ping)
    if (typeof state.connected !== 'boolean' && ping === null) return
    const at = now(), warning = state.connected === false || ping !== null && ping > 250
    if (at - last < 30000 && warning === previousWarning) return
    last = at; previousWarning = warning
    const stats = player.node?.stats, frames = stats?.frameStats, load = finite(stats?.cpu?.lavalinkLoad)
    write(warning ? 'warn' : 'info', { event: 'music_playback_health', entryPoint: 'player_update', guild, node: player.node?.name || null,
      connected: typeof state.connected === 'boolean' ? state.connected : null,
      voicePingMs: ping, positionMs: finite(state.position), nodeCpuPercent: load === null ? null : Math.round(load * 10000) / 100,
      nodeFrames: frames ? { sent: finite(frames.sent), deficit: finite(frames.deficit), nulled: finite(frames.nulled) } : null })
  }
}
module.exports = { createPlaybackHealth }

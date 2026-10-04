const { fetchLyricsResult } = require('./lyrics')
async function sharedLookup(title, artist) {
  const result = await fetchLyricsResult(title, artist)
  if (result.status === 'unavailable') throw new Error('provider_unavailable')
  return result.data
}

async function getCurrentLyrics(music, guildId, lookup = sharedLookup) {
  const state = music?.getState(guildId)
  const track = state?.currentTrack
  if (!track) return { status: 'idle', guildId }
  const info = track.info || track
  const identity = { guildId, sessionId: state.sessionId, playbackId: state.playbackId }
  const current = () => {
    const latest = music.getState(guildId)
    return latest?.currentTrack === track && latest.sessionId === identity.sessionId && latest.playbackId === identity.playbackId
  }
  if (info.isStream) return { ...identity, status: 'stream' }
  let result
  try { result = await lookup(info.title, info.author) }
  catch { return current() ? { ...identity, status: 'unavailable' } : { guildId, status: 'track_changed' } }
  if (!current()) return { guildId, status: 'track_changed' }
  const lines = (Array.isArray(result?.lines) ? result.lines : [])
    .filter(line => Number.isFinite(line.ms) && line.ms >= 0 && typeof line.text === 'string')
    .map(line => ({ ms: line.ms, text: line.text })).sort((a, b) => a.ms - b.ms)
  const text = typeof result?.plain === 'string' && result.plain ? result.plain : lines.map(line => line.text).join('\n')
  if (!text) return { ...identity, status: 'missing' }
  const publicState = music.getPublicState(guildId)
  return { ...identity, status: 'ready', mode: lines.length ? 'synced' : 'plain', text, lines,
    title: info.title, author: info.author, elapsed: publicState.current?.elapsed || 0,
    paused: Boolean(publicState.paused), revision: publicState.revision }
}

module.exports = { getCurrentLyrics }

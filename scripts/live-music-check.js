// Opt-in server release check. Uses an existing empty bot voice channel and its existing text channel.
// This module has no HTTP endpoint and runs only with an explicit process environment flag.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { getState } = require('../handlers/music/state')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(check, label, timeout = 45000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) { if (check()) return; await sleep(500) }
  throw new Error(`Timeout: ${label}`)
}
function emptyChannel(channel, botId) {
  return channel?.members && ![...channel.members.values()].some(member => member.id !== botId && !member.user.bot)
}

module.exports = async function liveMusicCheck(client, phase, stateFile) {
  assert.ok(['prepare', 'finish'].includes(phase), 'Invalid release check phase')
  assert.ok(stateFile, 'Release check needs a private state file')
  if (phase === 'prepare') {
    if (fs.existsSync(stateFile)) {
      const original = JSON.parse(fs.readFileSync(stateFile)), previous = getState(original.id)
      if ((previous.currentTrack?.info || previous.currentTrack)?.requesterId === 'release-check') {
        assert.ok(emptyChannel(client.channels.cache.get(original.voice), client.user.id), 'Voice channel is now occupied')
        await client.music.stop(original.id)
        await client.music.joinChannel(original.id, original.voice, original.text)
        await client.music.setVolume(original.id, original.volume)
      }
    }
    const entry = [...client.shoukaku.players].find(([id]) => {
      const state = getState(id), channel = client.channels.cache.get(state.voiceChannelId)
      return !state.currentTrack && !state.queue.length && emptyChannel(channel, client.user.id)
    })
    assert.ok(entry, 'No existing empty bot voice channel available')
    const [id] = entry, state = getState(id)
    fs.writeFileSync(stateFile, JSON.stringify({ id, voice: state.voiceChannelId, text: state.textChannelId, volume: state.volume }), { mode: 0o600 })
    await client.music.setVolume(id, 0)
    const tracks = []
    for (const video of ['fRIhCiUVaKs', 'B402rKl4bUg']) {
      const result = await client.music.search(`https://www.youtube.com/watch?v=${video}`, { username: 'Verificación', id: 'release-check' })
      assert.ok(result?.tracks?.[0]?.encoded, 'YouTube track unavailable')
      tracks.push(result.tracks[0])
    }
    await client.music.enqueue(id, tracks)
    await until(() => client.music.getPublicState(id).current?.elapsed > 4000, 'Discord player progress')
    await client.music.pause(id)
    const nodePlayer = await client.shoukaku.players.get(id).node.rest.getPlayer(id)
    assert.equal(nodePlayer.state.connected, true, 'Lavalink voice connection')
    assert.ok(nodePlayer.state.position > 2000, 'Lavalink audio position')
    await client.music.flushSessions()
    console.log('[LIVE_CHECK] prepare passed: playback progressed, muted session paused and saved with next track')
  } else {
    const original = JSON.parse(fs.readFileSync(stateFile))
    const id = original.id
    await until(() => getState(id).currentTrack && getState(id).paused, 'session restoration')
    const state = getState(id), channel = client.channels.cache.get(original.voice)
    assert.ok(emptyChannel(channel, client.user.id), 'Voice channel is now occupied')
    assert.equal(state.volume, 0)
    const restoredPlayer = await client.shoukaku.players.get(id).node.rest.getPlayer(id)
    assert.equal(restoredPlayer.state.connected, true, 'Restored Lavalink voice connection')
    assert.equal(restoredPlayer.paused, true)
    assert.equal(restoredPlayer.volume, 0)
    assert.equal(state.queue.length, 1)
    assert.equal((state.currentTrack.info || state.currentTrack).requesterId, 'release-check')
    const position = client.music.getPublicState(id).current.elapsed
    await client.music.pause(id)
    await until(() => client.music.getPublicState(id).current?.elapsed > position + 2500, 'resumed audio progress')
    const write = client.music.setVolume(id, 35)
    assert.equal(client.music.getPublicState(id).volume, 35)
    await write
    await client.music.setVolume(id, 0)
    await client.music.setFilter(id, 'normalizar')
    await client.music.setFilter(id, 'off')
    const first = state.currentTrack
    const length = (first.info || first).length
    assert.ok(length > 10000, 'Track length unavailable')
    await client.music.seek(id, length - 1500)
    const afterSeek = await client.shoukaku.players.get(id).node.rest.getPlayer(id)
    console.log('[LIVE_CHECK] after seek:', JSON.stringify({ connected: afterSeek.state?.connected, position: afterSeek.state?.position, track: Boolean(afterSeek.track), seekable: afterSeek.track?.info?.isSeekable, playbackMatches: afterSeek.track?.userData?.obeyPlaybackId === state.playbackId, trackMatches: afterSeek.track?.encoded === state.currentTrack?.encoded }))
    await until(() => state.currentTrack && state.currentTrack !== first, 'automatic queue transition')
    await until(() => client.music.getPublicState(id).current?.elapsed > 2000, 'second track progress')
    assert.equal(state.queue.length, 0)
    await client.music.stop(id)
    await client.music.joinChannel(id, original.voice, original.text)
    await client.music.setVolume(id, original.volume)
    console.log('[LIVE_CHECK] finish passed: restored pause/volume/queue/requester, resume, filters, natural transition, second audio and idle cleanup')
  }
}
module.exports.emptyChannel = emptyChannel

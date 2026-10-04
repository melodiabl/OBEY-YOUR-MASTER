const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
test('failed reconnect preserves the saved song and a later retry restores mute, pause and queue', async () => {
  const model = require('../database/schemas/MusicSessionSchema')
  const saved = { guildId: 'recovery-retry', voiceChannelId: 'voice', textChannelId: 'text', sessionId: 'saved-session', revision: 8, currentTrack: { encoded: 'old', info: { uri: 'https://example.com/song', title: 'Saved', requesterId: 'owner' } }, queue: [{ encoded: 'next' }], history: [], volume: 0, paused: true, position: 31500 }
  let persisted
  model.find = () => ({ lean: async () => [saved] })
  model.findOneAndUpdate = async (_, value) => { persisted = value.$set }
  const client = new EventEmitter(), node = {}, player = { node, setGlobalVolume: async value => { player.volume = value }, playTrack: async options => { player.options = options } }
  client._dbReady = true
  client.shoukaku = { players: new Map(), nodes: new Map(), options: { nodeResolver: () => node } }
  client.guilds = { cache: new Map([[saved.guildId, {}]]) }
  client.channels = { cache: new Map([['voice', {}]]) }
  require('../handlers/musichandler')(client)
  const state = client.music.getState(saved.guildId)
  let attempts = 0
  client.music.joinChannel = async () => {
    if (++attempts === 1) { state.currentTrack = null; throw new Error('Node not ready') }
    client.shoukaku.players.set(saved.guildId, player)
    return player
  }
  client.music.search = async () => ({ tracks: [{ encoded: 'fresh', info: { uri: saved.currentTrack.info.uri } }] })
  client.music.sendNowPlaying = async () => {}
  await client.music.restoreSessions()
  await client.music.flushSessions()
  assert.equal(state.status, 'recovering')
  assert.equal(persisted.currentTrack.info.title, 'Saved')
  assert.equal(persisted.volume, 0)
  assert.equal(persisted.position, 31500)
  await client.music.restoreSessions()
  assert.equal(state.status, 'paused')
  assert.equal(player.options.position, 31500)
  assert.equal(player.options.paused, true)
  assert.equal(player.volume, 0)
  assert.equal(state.queue.length, 1)
  assert.equal(state.currentTrack.info.requesterId, 'owner')
  client._shuttingDown = true
  await client.music.flushSessions()
})

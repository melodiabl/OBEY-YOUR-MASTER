const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { validateNodes } = require('../handlers/music/nodes-config')
const { createNodePool } = require('../handlers/music/nodes')
const model = require('../database/schemas/MusicSessionSchema')
function setup(t, id) {
  const original = { find: model.find, findOneAndUpdate: model.findOneAndUpdate }
  const writes = [], resolves = []
  model.find = () => ({ lean: async () => [] })
  model.findOneAndUpdate = async (filter, update) => { writes.push({ guildId: filter.guildId, ...update.$set }) }
  const client = new EventEmitter(); client._dbReady = true
  const entries = validateNodes([
    { id: 'private-primary', label: 'Internal', visibility: 'private', host: '127.0.0.1', port: 2333, password: 'private-secret', secure: false, priority: 0 },
    { id: 'public-one', label: 'Public', visibility: 'public', host: 'music.example.com', port: 443, password: 'public-password', secure: true, priority: 1 },
    { id: 'public-two', label: 'Second public', visibility: 'public', host: 'backup.example.com', port: 443, password: 'backup-password', secure: true, priority: 2 },
  ])
  const nodes = new Map(entries.map(entry => [entry.id, { name: entry.id, state: 1, ws: { readyState: 1 }, rest: { resolve: async query => {
    resolves.push({ node: entry.id, query })
    return { loadType: 'search', data: [{ encoded: entry.id + ':encoded', info: { title: 'Song', author: 'Artist', uri: 'https://www.youtube.com/watch?v=test', sourceName: 'youtube', length: 180000 } }] }
  } } }]))
  client.nodePool = createNodePool(entries, { preferenceFor: guildId => client.music?.getState(guildId)?.nodePreference || 'auto' })
  client.shoukaku = new EventEmitter(); client.shoukaku.nodes = nodes; client.shoukaku.players = new Map()
  client.nodePool.attach(client.shoukaku)
  client.shoukaku.options = { nodeResolver: () => client.nodePool.choose() }
  client.shoukaku.leaveVoiceChannel = async guildId => client.shoukaku.players.delete(guildId)
  client.shoukaku.joinVoiceChannel = async ({ guildId }) => {
    const player = new EventEmitter(); player.guildId = guildId; player.node = client.nodePool.choose(guildId)
    player.playTrack = async options => { player.played = options }
    player.setGlobalVolume = async volume => { player.volume = volume }
    player.setFilters = async filters => { player.filters = filters }
    client.shoukaku.players.set(guildId, player); return player
  }
  client.settings = { get: () => ({}) }; client.guilds = { cache: new Map() }; client.channels = { cache: new Map() }
  require('../handlers/musichandler')(client)
  client.music.sendNowPlaying = async () => {}
  t.after(async () => { client._shuttingDown = true; client._dbReady = false; await client.music.flushSessions(); client.nodePool.dispose(); Object.assign(model, original) })
  return { client, state: client.music.getState(id), nodes, writes, resolves }
}
test('search uses the selected guild node and falls back after a provider failure', async t => {
  const id = 'nodes-search', { client, state, nodes, resolves } = setup(t, id)
  state.nodePreference = 'public-one'
  const result = await client.music.search('Song', 'User', { guildId: id })
  assert.equal(result.tracks[0].encoded, 'public-one:encoded')
  assert.equal(resolves[0].node, 'public-one')
  state.nodePreference = 'auto'; client.nodePool.unpin(id)
  nodes.get('private-primary').rest.resolve = async () => { throw Error('network failed private-secret') }
  const fallback = await client.music.search('Other', 'User', { guildId: id })
  assert.equal(fallback.tracks[0].encoded, 'public-one:encoded')
})
test('an idle public preference is persisted before success and contains no node credentials', async t => {
  const id = 'nodes-idle', { client, state, writes } = setup(t, id)
  await client.music.setNodePreference(id, 'public-one')
  assert.equal(state.nodePreference, 'public-one')
  assert.ok(writes.some(row => row.guildId === id && row.nodePreference === 'public-one'))
  assert.ok(!JSON.stringify(client.music.getPublicState(id)).includes('private-secret'))
})
test('changing node preserves pause, mute, position, queue, filters and session identity', async t => {
  const id = 'nodes-change', { client, state } = setup(t, id)
  Object.assign(state, { currentTrack: { encoded: 'old-node-codec', info: { uri: 'https://www.youtube.com/watch?v=test', requesterId: 'owner', length: 180000 } }, queue: [{ encoded: 'queued', info: { title: 'Next' } }], paused: true, lastPosition: 42000, volume: 0, status: 'paused', voiceChannelId: 'voice', textChannelId: 'text', filter: 'custom', customFilters: { timescale: { speed: 1.2 } } })
  const session = state.sessionId
  const original = await client.shoukaku.joinVoiceChannel({ guildId: id })
  await client.music.setNodePreference(id, 'public-one')
  const player = client.shoukaku.players.get(id)
  assert.notEqual(player, original); assert.equal(player.node.name, 'public-one')
  assert.equal(player.played.track.encoded, 'public-one:encoded')
  assert.equal(player.played.paused, true); assert.equal(player.played.position, 42000); assert.equal(player.volume, 0)
  assert.equal(state.sessionId, session); assert.equal(state.queue.length, 1); assert.equal(state.currentTrack.info.requesterId, 'owner')
  assert.deepEqual(player.filters, { timescale: { speed: 1.2 } })
})
test('unavailable or private choices cannot disrupt a live session', async t => {
  const id = 'nodes-denied', { client, state, nodes, writes } = setup(t, id)
  const player = await client.shoukaku.joinVoiceChannel({ guildId: id })
  nodes.get('public-one').state = 3
  for (const nodeId of ['public-one', 'private-primary', 'http://internal']) await assert.rejects(client.music.setNodePreference(id, nodeId))
  assert.equal(client.shoukaku.players.get(id), player); assert.equal(state.nodePreference || 'auto', 'auto')
  assert.equal(writes.length, 0)
})
test('failed preference persistence restores the previous preference and playback', async t => {
  const id = 'nodes-storage-failure', { client, state } = setup(t, id)
  Object.assign(state, { currentTrack: { encoded: 'old', info: { uri: 'https://www.youtube.com/watch?v=test', length: 180000 } }, voiceChannelId: 'voice', paused: true, lastPosition: 7000, volume: 0 })
  await client.shoukaku.joinVoiceChannel({ guildId: id })
  model.findOneAndUpdate = async () => { throw Error('storage private-secret unavailable') }
  await assert.rejects(client.music.setNodePreference(id, 'public-one'), error => !error.message.includes('private-secret'))
  assert.equal(state.nodePreference || 'auto', 'auto')
  assert.equal(state.currentTrack.info.uri, 'https://www.youtube.com/watch?v=test')
  assert.equal(client.shoukaku.players.get(id).node.name, 'private-primary')
  assert.equal(state.volume, 0); assert.equal(state.paused, true)
})
test('queued encodings are resolved on the destination rather than reused across providers', async t => {
  const id = 'nodes-queue-codec', { client, state } = setup(t, id)
  state.nodePreference = 'public-one'
  const player = await client.shoukaku.joinVoiceChannel({ guildId: id })
  await client.music.enqueue(id, [{ encoded: 'private-encoded', _resolvedNode: 'private-primary', info: { uri: 'https://www.youtube.com/watch?v=test', sourceName: 'youtube', requesterId: 'user' } }])
  assert.equal(player.played.track.encoded, 'public-one:encoded')
  assert.equal(state.currentTrack.info.requesterId, 'user')
})
test('a playback failure changes provider while keeping the recording, queue and mute', async t => {
  const id = 'nodes-playback-failure', { client, state } = setup(t, id)
  Object.assign(state, { currentTrack: { encoded: 'old', _resolvedNode: 'private-primary', info: { uri: 'https://www.youtube.com/watch?v=test', sourceName: 'youtube' } }, queue: [{ info: { title: 'Next' } }], voiceChannelId: 'voice', volume: 0, paused: true, lastPosition: 9000 })
  const player = await client.shoukaku.joinVoiceChannel({ guildId: id })
  await client.music._recoverFailedTrack(id, player, 'stream failed')
  assert.equal(client.shoukaku.players.get(id).node.name, 'public-one')
  assert.equal(state.queue.length, 1); assert.equal(state.volume, 0); assert.equal(state.lastPosition, 9000)
  assert.equal(state.nodePreference, 'auto')
})
test('a failed first backup does not prevent recovery on a second public backup', async t => {
  const id = 'nodes-second-backup', { client, state, nodes } = setup(t, id)
  nodes.get('public-one').rest.resolve = async () => { throw Error('provider unavailable') }
  Object.assign(state, { currentTrack: { encoded: 'old', _resolvedNode: 'private-primary', info: { uri: 'https://www.youtube.com/watch?v=test', sourceName: 'youtube' } }, queue: [{ info: { title: 'Next' } }], voiceChannelId: 'voice', volume: 0, paused: true, lastPosition: 11000 })
  const player = await client.shoukaku.joinVoiceChannel({ guildId: id })
  await client.music._recoverFailedTrack(id, player, 'stream failed')
  assert.equal(client.shoukaku.players.get(id).node.name, 'public-two')
  assert.equal(state.queue.length, 1); assert.equal(state.lastPosition, 11000); assert.equal(state.volume, 0)
})
test('a rejected playback REST request also triggers recovery on a different node', async t => {
  const id = 'nodes-play-request-failure', { client, state } = setup(t, id)
  state.voiceChannelId = 'voice'; state.volume = 0
  const player = await client.shoukaku.joinVoiceChannel({ guildId: id })
  player.playTrack = async () => { throw Error('provider unavailable') }
  const track = { encoded: 'original', _resolvedNode: 'private-primary', info: { uri: 'https://www.youtube.com/watch?v=test', sourceName: 'youtube', requesterId: 'owner' } }
  await client.music.enqueue(id, [track])
  assert.equal(client.shoukaku.players.get(id).node.name, 'public-one')
  assert.equal(state.currentTrack.info.uri, track.info.uri); assert.equal(state.volume, 0)
})
test('idle preferences reload after restart without joining a voice channel', async t => {
  const id = 'nodes-preference-restart', { client, state } = setup(t, id)
  client.guilds.cache.set(id, {})
  model.find = query => ({ lean: async () => query.nodePreference ? [{ guildId: id, nodePreference: 'public-one' }] : [] })
  await client.music.restoreSessions()
  assert.equal(state.nodePreference, 'public-one'); assert.equal(client.shoukaku.players.size, 0)
})
test('controls cannot silently overwrite a session snapshot during a node change', async t => {
  const id = 'nodes-concurrent-controls', { client, state, nodes } = setup(t, id)
  Object.assign(state, { currentTrack: { encoded: 'old', info: { uri: 'https://www.youtube.com/watch?v=test' } }, queue: [{ info: { title: 'Next' } }], voiceChannelId: 'voice', volume: 0 })
  await client.shoukaku.joinVoiceChannel({ guildId: id })
  let release
  const original = nodes.get('public-one').rest.resolve
  nodes.get('public-one').rest.resolve = async query => { await new Promise(resolve => { release = resolve }); return original(query) }
  const change = client.music.setNodePreference(id, 'public-one')
  while (!release) await new Promise(resolve => setImmediate(resolve))
  await assert.rejects(client.music.setVolume(id, 120), /cambiando/)
  assert.throws(() => client.music.clearQueue(id), /cambiando/)
  assert.throws(() => client.music.setLoop(id, 'track'), /cambiando/)
  release(); await change
  assert.equal(state.volume, 0); assert.equal(state.queue.length, 1); assert.equal(state.loop, 'none')
  await client.music.setVolume(id, 120); assert.equal(state.volume, 120)
})

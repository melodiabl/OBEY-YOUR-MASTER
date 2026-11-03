const assert = require('node:assert/strict')
const { EventEmitter, once } = require('node:events')
const test = require('node:test')
const path = require('node:path')
const { Manager, Node, Player, Track, NodeState, VoiceConnectionState } = require('nyxlink')
const { DatabaseManager } = require(path.join(path.dirname(require.resolve('nyxlink')), 'src/managers/DatabaseManager.js'))

const GUILD = '123456789012345678', VOICE = '223456789012345678', TEXT = '323456789012345678', BOT = '423456789012345678'
async function waitForBoundary(promise) {
  let timer
  try {
    await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Expected backend boundary was not reached')), 1500)
    })])
  } finally { clearTimeout(timer) }
}
function rawTrack(encoded, title, sourceName = 'youtube', extra = {}) {
  return { encoded, info: { identifier: encoded, title, author: 'Artist', length: 180000,
    uri: `https://example.com/${encoded}`, sourceName, isSeekable: true, isStream: false, ...extra } }
}
function nativeClient(t, { connected = true, defaults = {} } = {}) {
  const config = { identifier: 'main', host: '127.0.0.1', port: 2333, password: 'test-only' }
  const gatewayRequests = []
  const manager = new Manager({ nodes: [config], send(guildId, packet) {
    // External Discord gateway double: acknowledge voice requests through the
    // real SDK packet handler, without logging in or opening a websocket.
    if (packet.op !== 4) return
    gatewayRequests.push(packet)
    queueMicrotask(async () => {
      if (client._shuttingDown) return
      const botMember = client.guilds.cache.get(guildId)?.botMember
      if (botMember) botMember.voice.channelId = packet.d.channel_id
      await manager.packetUpdate({ t: 'VOICE_STATE_UPDATE', d: { guild_id: guildId, user_id: BOT,
        channel_id: packet.d.channel_id, session_id: 'voice-session' } })
      if (packet.d.channel_id) await manager.packetUpdate({ t: 'VOICE_SERVER_UPDATE', d: { guild_id: guildId, token: 'voice-token', endpoint: 'test.invalid' } })
    })
  }, options: { database: { type: 'memory' } } })
  manager.database = new DatabaseManager(manager)
  manager.clientId = BOT; manager.initialized = true
  const node = new Node(manager, config)
  node.connected = true; node.state = NodeState.READY; node.sessionId = 'backend-session'
  manager.nodes.nodes.set(node.identifier, node)
  const requests = []
  node.rest.updatePlayer = async (guildId, payload) => { requests.push({ guildId, payload }); return { guildId, volume: manager.players.get(guildId)?.volume ?? 100, ...payload } }
  node.rest.destroyPlayer = async () => null
  node.rest.getInfo = async () => ({ version: { major: 4 }, sourceManagers: ['youtube', 'spotify', 'applemusic'], plugins: [] })
  node.rest.loadTracks = async () => ({ loadType: 'empty', data: null })
  // Recommendations are an optional external lookup after native playback.
  node.updateRecommendations = async () => {}
  const client = new EventEmitter()
  client.nyxlink = manager
  client.channels = { cache: new Map() }; client.guilds = { cache: new Map() }
  client.settings = { get: (_id, key) => defaults[key] }
  client.user = { id: BOT }
  client.nodePool = require('../handlers/music/nodes').createNodePool([{ id: 'main', label: 'Main', enabled: true, visibility: 'public', priority: 1 }])
  client.nodePool.attach(manager)
  let player
  if (connected) {
    player = new Player(manager, node, { guildId: GUILD, voiceChannelId: VOICE, textChannelId: TEXT, autoPlay: false })
    manager.players.players.set(GUILD, player)
    player.voice.sessionId = 'voice-session'; player.voice.token = 'voice-token'; player.voice.endpoint = 'test.invalid'; player.voice.setState(VoiceConnectionState.CONNECTED)
    player.stopHealthCheck()
  }
  require('../handlers/musichandler')(client)
  t.after(async () => {
    client._shuttingDown = true
    await client.music.flushSessions?.()
    for (const player of manager.players.all) { player.stopHealthCheck(); player.voice.destroy() }
    const { playerStates, liveTimers, liveMessages } = require('../handlers/music/state')
    playerStates.delete(GUILD); clearInterval(liveTimers.get(GUILD)); liveTimers.delete(GUILD); liveMessages.delete(GUILD)
    client.nodePool.dispose(); await node.destroy(); await manager.database.shutdown()
  })
  return { client, manager, node, player, requests, gatewayRequests }
}

test('pause and resume emit a synchronized public player state', async t => {
  const { client, player } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Test song', 'youtube', { author: 'Test artist' }))
  player.current.position = 42000; player.playing = true
  const state = client.music.getState(GUILD)
  state.status = 'playing'; state.startedAt = Date.now() - player.current.position
  const pauseEvent = once(client, 'playerStateUpdate')
  assert.equal(await client.music.pause(GUILD), true)
  assert.deepEqual(await pauseEvent, [GUILD])
  let publicState = client.music.getPublicState(GUILD)
  assert.equal(publicState.paused, true)
  assert.ok(Math.abs(publicState.current.elapsed - 42000) < 100)
  const resumeEvent = once(client, 'playerStateUpdate')
  assert.equal(await client.music.pause(GUILD), false)
  assert.deepEqual(await resumeEvent, [GUILD])
  publicState = client.music.getPublicState(GUILD)
  assert.equal(publicState.paused, false)
  assert.equal(publicState.current.title, 'Test song')
  assert.equal(publicState.queue[0].pos, 0)
})

test('plain text searches try spsearch first and return its list result', async t => {
  const { client, node } = nativeClient(t)
  const identifiers = []
  node.rest.loadTracks = async identifier => { identifiers.push(identifier); return { loadType: 'search', data: [rawTrack('track', 'Test song', 'spotify')] } }
  const result = await client.music.search('test song', 'Tester')
  assert.deepEqual(identifiers, ['spsearch:test song'])
  assert.equal(result.tracks[0].info.title, 'Test song')
  assert.equal(result.tracks[0].info.requester, 'Tester')
})

test('a single spsearch track is kept as fallback while ytmsearch provides the list', async t => {
  const { client, node } = nativeClient(t)
  const identifiers = []
  node.rest.loadTracks = async identifier => {
    identifiers.push(identifier)
    return identifier.startsWith('spsearch:')
      ? { loadType: 'track', data: rawTrack('sp-track', 'Test song (Single)', 'spotify') }
      : { loadType: 'search', data: [rawTrack('yt-track', 'Test song')] }
  }
  const result = await client.music.search('test song', 'Tester')
  assert.deepEqual(identifiers, ['spsearch:test song', 'ytmsearch:test song'])
  assert.equal(result.loadType, 'search')
  assert.equal(result.tracks[0].info.title, 'Test song')
})

test('search falls back to the single spsearch track when no list source has results', async t => {
  const { client, node } = nativeClient(t)
  node.rest.loadTracks = async identifier => identifier.startsWith('spsearch:')
    ? { loadType: 'track', data: rawTrack('sp-track', 'Test song (Single)', 'spotify') }
    : { loadType: 'empty', data: null }
  const result = await client.music.search('test song', 'Tester')
  assert.equal(result.loadType, 'track')
  assert.equal(result.tracks[0].info.title, 'Test song (Single)')
})

test('spotify album URIs resolve directly and return album tracks', async t => {
  const { client, node } = nativeClient(t)
  const identifiers = []
  node.rest.loadTracks = async identifier => {
    identifiers.push(identifier)
    return { loadType: 'playlist', data: { info: { name: 'Test Album' }, tracks: [rawTrack('t1', 'Track 1', 'spotify'), rawTrack('t2', 'Track 2', 'spotify')] } }
  }
  const result = await client.music.search('https://open.spotify.com/album/abc123', 'Tester')
  assert.deepEqual(identifiers, ['https://open.spotify.com/album/abc123'])
  assert.equal(result.loadType, 'playlist')
  assert.equal(result.tracks.length, 2)
  assert.equal(result.playlistName, 'Test Album')
})

test('joining voice applies saved music defaults', async t => {
  const { client, requests } = nativeClient(t, { connected: false, defaults: { autoplay: true, defaultVolume: 75 } })
  const player = await client.music.joinChannel(GUILD, VOICE, TEXT)
  player.stopHealthCheck()
  assert.equal(player.volume, 75)
  assert.equal(player.autoPlay, true)
  assert.equal(player.connected, true)
  assert.ok(requests.some(({ payload }) => payload.voice?.sessionId === 'voice-session'))
  assert.equal(client.music.getState(GUILD).volume, 75)
  assert.equal(client.music.getState(GUILD).autoplay, true)
})

test('skip advances the queue even when the player is paused', async t => {
  const { client, player, requests } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Current')); player.current.position = 15000; player.playing = true; player.paused = true
  player.queue.add(new Track(rawTrack('next', 'Next')))
  const state = client.music.getState(GUILD)
  assert.equal(await client.music.skip(GUILD), true)
  assert.equal(player.paused, false)
  assert.deepEqual(requests.filter(({ payload }) => payload.track?.encoded).map(({ payload }) => payload.track.encoded), ['next'])
  assert.equal(state.currentTrack.info.title, 'Next')
  assert.equal(state.queue.length, 0)
})

test('a blocked YouTube track falls back only to the matching Apple Music recording', async t => {
  const { client, node, player, requests } = nativeClient(t)
  const queries = []
  node.rest.loadTracks = async query => {
    queries.push(query)
    return { loadType: 'search', data: [rawTrack('remix', 'Shape of You (Remix)', 'applemusic', { author: 'Ed Sheeran' }), rawTrack('match', 'Shape of You', 'applemusic', { author: 'Ed Sheeran' })] }
  }
  player.current = new Track(rawTrack('blocked', 'Shape of You (Official Video)', 'youtube', { author: 'Ed Sheeran' })); player.playing = true
  const state = client.music.getState(GUILD)
  // Matching-recording fallback is application policy; it remains the app's
  // responsibility when a backend failure is reported by the native SDK.
  assert.equal(typeof client.music._recoverFailedTrack, 'function', 'matching Apple recording recovery policy must remain available')
  await client.music._recoverFailedTrack(GUILD, player, 'Sign in to confirm')
  assert.deepEqual(queries, ['amsearch:Shape of You (Official Video) Ed Sheeran'])
  assert.deepEqual(requests.filter(({ payload }) => payload.track?.encoded).map(({ payload }) => payload.track.encoded), ['match'])
  assert.equal(state.currentTrack.info.sourceName, 'applemusic')
})

test('volume remains at the confirmed value until a delayed acknowledgement succeeds', async t => {
  const { client, node, player } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Volume test')); player.playing = true
  let release
  node.rest.updatePlayer = () => new Promise(resolve => { release = () => resolve({ volume: 0 }) })
  const pending = client.music.setVolume(GUILD, 0)
  await new Promise(resolve => setImmediate(resolve))
  try { assert.equal(client.music.getPublicState(GUILD).volume, 100) } finally { release() }
  await pending
  assert.equal(client.music.getPublicState(GUILD).volume, 0)
})

test('rapid volume changes reach the backend in order and retain confirmed volume on failure', async t => {
  const { client, node, player } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Volume test')); player.playing = true
  const calls = []
  node.rest.updatePlayer = async (_guildId, { volume }) => { calls.push(volume); if (volume === 30) throw new Error('node unavailable'); return { volume } }
  await Promise.all([client.music.setVolume(GUILD, 10), client.music.setVolume(GUILD, 20)])
  assert.deepEqual(calls, [10, 20])
  assert.equal(client.music.getPublicState(GUILD).volume, 20)
  await assert.rejects(client.music.setVolume(GUILD, 30), /node unavailable/)
  assert.equal(client.music.getPublicState(GUILD).volume, 20)
  await assert.rejects(client.music.setVolume(GUILD, NaN), /volumen/i)
})

test('queue editing rejects invalid positions and clearing keeps the playing song', async t => {
  const { client, player } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Current')); player.playing = true
  player.queue.add(new Track(rawTrack('next', 'Next')))
  const state = client.music.getState(GUILD), current = state.currentTrack
  for (const position of [NaN, 0, 1.5]) {
    await assert.rejects(client.music.remove(GUILD, position), /Posición/)
    await assert.rejects(client.music.jump(GUILD, position), /Posición/)
  }
  await assert.rejects(client.music.move(GUILD, NaN, 1), /Posición/)
  assert.equal(state.queue.length, 1)
  assert.equal(client.music.clearQueue(GUILD), 1)
  assert.equal(state.currentTrack, current)
  assert.equal(state.queue.length, 0)
})

test('changing audio presets clears previous effects', async t => {
  const { client, player, requests } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Filter test')); player.playing = true
  await client.music.setFilter(GUILD, 'nightcore')
  await client.music.setFilter(GUILD, 'bassboost')
  const calls = requests.filter(({ payload }) => payload.filters).map(({ payload }) => payload.filters)
  assert.equal(calls[1].timescale, null)
  assert.deepEqual(calls[1].pluginFilters, {})
})

test('seek exposes confirmed positionMs to the existing Discord command consumer', async t => {
  const { client, player, requests } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Seek test')); player.playing = true
  const state = client.music.getState(GUILD)
  state.status = 'playing'
  const result = await client.music.seek(GUILD, 42000)
  assert.equal(result?.positionMs, 42000, 'public seek result must retain the positionMs contract')
  assert.equal(player.current.position, 42000)
  assert.equal(requests.at(-1).payload.position, 42000)
  const edits = []
  const context = {
    guildId: GUILD, member: { voice: { channel: { id: VOICE } } },
    deferReply: async () => {}, editReply: async payload => { edits.push(payload); return payload },
  }
  await require('../handlers/music/seek-command').runSeek(client, context, { action: 'seek', input: '1:15', slash: true })
  assert.equal(edits.length, 1)
  assert.match(edits[0].embeds[0].data.description, /1:15/)
  assert.doesNotMatch(edits[0].embeds[0].data.description, /confirmar|confirmed/)
  assert.equal(player.current.position, 75000)
})

test('stop cancels a pending backend search before its result can reconnect or enqueue', async t => {
  const { client, manager, node, requests, gatewayRequests } = nativeClient(t)
  let release, entered
  const reached = new Promise(resolve => { entered = resolve })
  const gate = new Promise(resolve => { release = resolve })
  node.rest.loadTracks = async () => { entered(); await gate; return { loadType: 'search', data: [rawTrack('late', 'Late song')] } }
  const pending = client.music.play(GUILD, VOICE, TEXT, 'late song', { id: '523456789012345678', username: 'Tester' })
  // Attach rejection handling before Stop can invalidate the request.
  const rejected = assert.rejects(pending, /cancel/i)
  try {
    await waitForBoundary(reached)
    await client.music.stop(GUILD)
  } finally { release() }
  await rejected
  assert.equal(manager.players.has(GUILD), false)
  assert.equal(client.music.getState(GUILD).currentTrack, null)
  assert.equal(client.music.getState(GUILD).queue.length, 0)
  assert.equal(requests.some(({ payload }) => payload.track?.encoded === 'late'), false)
  assert.equal(gatewayRequests.some(packet => packet.d.channel_id === VOICE), false, 'delayed search must not rejoin voice')
})

function voiceAccess(client, { actorInTarget = true, botAllowed = true } = {}) {
  const ACTOR = '523456789012345678', TARGET = '623456789012345678'
  const guild = { id: GUILD, available: true }
  const member = { id: ACTOR, guild, permissions: { has: () => true }, voice: { channelId: actorInTarget ? TARGET : VOICE } }
  const bot = { id: BOT, guild, voice: { channelId: VOICE } }
  const voice = { id: TARGET, guildId: GUILD, isVoiceBased: () => true,
    permissionsFor: entity => ({ has: () => entity === bot ? botAllowed : true }) }
  const text = { id: TEXT, guildId: GUILD, permissionsFor: () => ({ has: () => true }) }
  guild.botMember = bot
  guild.members = { fetch: async () => member, fetchMe: async () => bot }
  guild.channels = { fetch: async id => id === TARGET ? voice : id === TEXT ? text : null }
  client.guilds.cache.set(GUILD, guild)
  return { actor: member, bot, request: { command: 'moveme', actorId: ACTOR, voiceChannelId: TARGET, textChannelId: TEXT, expectedVoiceChannelId: VOICE } }
}

test('voice relocation rejects an actor outside the requested channel before native side effects', async t => {
  const { client, player, gatewayRequests } = nativeClient(t)
  const { request } = voiceAccess(client, { actorInTarget: false })
  await assert.rejects(client.music.relocateVoice(GUILD, request), { code: 'music_voice_actor' })
  assert.equal(player.voiceChannelId, VOICE)
  assert.equal(gatewayRequests.length, 0)
  assert.equal(client.music.getState(GUILD).nodeTransition, false)
})

test('voice relocation rejects missing bot permissions before native side effects', async t => {
  const { client, player, gatewayRequests } = nativeClient(t)
  const { request } = voiceAccess(client, { botAllowed: false })
  await assert.rejects(client.music.relocateVoice(GUILD, request), { code: 'music_voice_permissions' })
  assert.equal(player.voiceChannelId, VOICE)
  assert.equal(gatewayRequests.length, 0)
})

test('authorized voice relocation moves through the native gateway and preserves paused playback and queue', async t => {
  const { client, manager, player, gatewayRequests } = nativeClient(t)
  player.current = new Track(rawTrack('current', 'Current')); player.current.position = 42000
  player.playing = true; player.paused = true
  player.queue.add(new Track(rawTrack('next', 'Next')))
  const current = player.current
  const { bot, request } = voiceAccess(client)
  const moved = await client.music.relocateVoice(GUILD, request)
  assert.equal(moved, player)
  assert.equal(manager.players.get(GUILD), player)
  assert.equal(player.voiceChannelId, request.voiceChannelId)
  assert.equal(bot.voice.channelId, request.voiceChannelId)
  assert.ok(gatewayRequests.some(packet => packet.d.channel_id === request.voiceChannelId))
  assert.equal(player.current, current)
  assert.equal(player.current.position, 42000)
  assert.equal(player.paused, true)
  assert.deepEqual(player.queue.all.map(track => track.identifier), ['next'])
  assert.equal(client.music.getState(GUILD).nodeTransition, false)
})

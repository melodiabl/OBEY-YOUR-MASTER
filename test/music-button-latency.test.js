const test = require('node:test'), assert = require('node:assert/strict'), { EventEmitter } = require('node:events')
const settle = () => new Promise(resolve => setImmediate(resolve))
function fixture(id, customId = 'mp_toggle') {
  const client = new EventEmitter(), calls = [], guild = { id }
  client.shoukaku = { players: new Map(), nodes: new Map(), options: { nodeResolver: () => null } }
  client.channels = { cache: new Map() }; client.settings = { get: () => ({}) }
  require('../handlers/music/index')(client)
  Object.assign(client.music.getState(id), { currentTrack: { encoded: 'track', info: { title: 'Song', length: 60000 } }, voiceChannelId: 'voice', status: 'playing', volume: 100 })
  let release, confirmed = false
  const interaction = { customId, guild, isButton: () => true, user: { id: 'user' },
    member: { id: 'user', guild, voice: { channelId: 'voice' }, permissions: { has: () => false } },
    deferUpdate: () => { calls.push('acknowledge'); return new Promise(resolve => { release = () => { confirmed = true; resolve() } }) },
    reply: async () => calls.push('denied'), followUp: async () => { assert.equal(confirmed, true); calls.push('error') } }
  const handler = client.listeners('interactionCreate').at(-1)
  return { client, calls, interaction, run: () => handler(interaction), confirm: () => release?.(),
    cleanup: async () => { client._shuttingDown = true; await require('../handlers/music/liveupdate').stopLiveUpdate(id); require('../handlers/music/state').playerStates.delete(id); client.removeAllListeners() } }
}
test('pause, skip, stop and volume start while Discord acknowledgement is in flight', async () => {
  for (const [customId, method] of [['mp_toggle', 'pause'], ['mp_skip', 'skip'], ['mp_stop', 'stop'], ['mp_volup', 'setVolume']]) {
    const f = fixture('button-' + method, customId)
    f.client.music[method] = async () => f.calls.push('node')
    const running = f.run(); await settle()
    const began = f.calls.includes('node')
    f.confirm(); await running; await f.cleanup()
    assert.equal(began, true, method + ' should not wait for a separate Discord round trip')
    assert.deepEqual(f.calls, ['acknowledge', 'node'])
  }
})
test('voice and DJ permissions are checked before acknowledgement or node controls', async () => {
  const f = fixture('button-denied')
  f.client.music.pause = async () => f.calls.push('node')
  f.interaction.member.voice.channelId = 'other'
  await f.run(); assert.deepEqual(f.calls, ['denied'])
  f.calls.length = 0; f.interaction.member.voice.channelId = 'voice'
  f.client.settings.get = () => ({ djroles: ['dj'] })
  await f.run(); assert.deepEqual(f.calls, ['denied']); await f.cleanup()
})
test('a failed control waits for acknowledgement before showing its error', async () => {
  const f = fixture('button-failed')
  f.client.music.pause = async () => { f.calls.push('node'); throw Error('provider unavailable') }
  const running = f.run(); await settle()
  assert.equal(f.calls.includes('error'), false)
  f.confirm(); await running; assert.deepEqual(f.calls, ['acknowledge', 'node', 'error']); await f.cleanup()
})
